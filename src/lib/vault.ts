// Client-side vault: owns the master key (in memory only), the local encrypted
// note index, and the bridge to 0G Storage via the server API routes.

import {
  Cipher,
  deriveKey,
  encryptString,
  decryptString,
  encryptToBlob,
  decryptFromBlob,
  randomBytes,
  toB64,
  fromB64,
} from "./crypto";

const VAULT_KEY = "noxis.vault.v1";
const NOTES_KEY = "noxis.notes.v1";
const VERIFIER_PLAINTEXT = "noxis::ok";

export interface VaultMeta {
  saltB64: string;
  verifier: Cipher;
  createdAt: number;
}

export interface NoteMeta {
  id: string;
  createdAt: number;
  updatedAt: number;
  rootHash: string; // 0G Storage address
  txHash: string; // storage submission tx
  encMeta: Cipher; // encrypted {title, preview} for instant list render
  encBlob: string; // local encrypted cache of the full note (iv||ct, base64)
  size: number; // ciphertext byte length
}

export interface DecryptedNote {
  title: string;
  body: string;
}

let masterKey: CryptoKey | null = null;
const metaCache = new Map<string, { title: string; preview: string }>();
const bodyCache = new Map<string, DecryptedNote>();

// ── persistence helpers ──────────────────────────────────────────────────────
function readVault(): VaultMeta | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY);
  return raw ? (JSON.parse(raw) as VaultMeta) : null;
}
function writeVault(v: VaultMeta) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(v));
}
function readNotes(): NoteMeta[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? (JSON.parse(raw) as NoteMeta[]) : [];
}
function writeNotes(n: NoteMeta[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(n));
}

// ── vault lifecycle ──────────────────────────────────────────────────────────
export function isVaultInitialized(): boolean {
  return !!readVault();
}
export function isUnlocked(): boolean {
  return masterKey !== null;
}
export function lockVault() {
  masterKey = null;
  metaCache.clear();
  bodyCache.clear();
}

export async function createVault(passphrase: string): Promise<void> {
  const salt = randomBytes(16);
  const key = await deriveKey(passphrase, salt);
  const verifier = await encryptString(key, VERIFIER_PLAINTEXT);
  writeVault({ saltB64: toB64(salt), verifier, createdAt: Date.now() });
  masterKey = key;
}

export async function unlockVault(passphrase: string): Promise<boolean> {
  const v = readVault();
  if (!v) return false;
  const key = await deriveKey(passphrase, fromB64(v.saltB64));
  try {
    const check = await decryptString(key, v.verifier);
    if (check !== VERIFIER_PLAINTEXT) return false;
    masterKey = key;
    return true;
  } catch {
    return false;
  }
}

export function destroyVault() {
  lockVault();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(VAULT_KEY);
    localStorage.removeItem(NOTES_KEY);
  }
}

// ── 0G Storage bridge ────────────────────────────────────────────────────────
async function uploadToZG(
  blobB64: string,
): Promise<{ rootHash: string; txHash: string; alreadyExists: boolean }> {
  const res = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataB64: blobB64 }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `upload failed (${res.status})`);
  }
  return res.json();
}

export async function fetchFromZG(rootHash: string): Promise<string> {
  const res = await fetch(
    `/api/storage/download?root=${encodeURIComponent(rootHash)}`,
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `download failed (${res.status})`);
  }
  const { dataB64 } = await res.json();
  return dataB64 as string;
}

// ── note operations ──────────────────────────────────────────────────────────
function requireKey(): CryptoKey {
  if (!masterKey) throw new Error("Vault is locked.");
  return masterKey;
}

function makePreview(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? clean.slice(0, 160) + "…" : clean;
}

export interface SaveResult {
  meta: NoteMeta;
  alreadyExists: boolean;
}

export async function saveNote(
  title: string,
  body: string,
  existingId?: string,
): Promise<SaveResult> {
  const key = requireKey();
  const now = Date.now();
  const notes = readNotes();
  const prev = existingId ? notes.find((n) => n.id === existingId) : undefined;

  const payload = JSON.stringify({
    title,
    body,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  });

  const encBlob = await encryptToBlob(key, payload);
  const up = await uploadToZG(encBlob);
  const encMeta = await encryptString(
    key,
    JSON.stringify({ title, preview: makePreview(body) }),
  );

  const meta: NoteMeta = {
    id: prev?.id ?? `note_${now}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    rootHash: up.rootHash,
    txHash: up.txHash,
    encMeta,
    encBlob,
    size: fromB64(encBlob).length,
  };

  const next = prev
    ? notes.map((n) => (n.id === meta.id ? meta : n))
    : [meta, ...notes];
  writeNotes(next);

  metaCache.set(meta.id, { title, preview: makePreview(body) });
  bodyCache.set(meta.id, { title, body });

  return { meta, alreadyExists: up.alreadyExists };
}

export function listNotes(): NoteMeta[] {
  return readNotes();
}

export async function decryptMeta(
  meta: NoteMeta,
): Promise<{ title: string; preview: string }> {
  const cached = metaCache.get(meta.id);
  if (cached) return cached;
  const key = requireKey();
  const json = await decryptString(key, meta.encMeta);
  const parsed = JSON.parse(json) as { title: string; preview: string };
  metaCache.set(meta.id, parsed);
  return parsed;
}

export async function readNote(meta: NoteMeta): Promise<DecryptedNote> {
  const cached = bodyCache.get(meta.id);
  if (cached) return cached;
  const key = requireKey();
  const json = await decryptFromBlob(key, meta.encBlob);
  const parsed = JSON.parse(json) as DecryptedNote;
  const note = { title: parsed.title, body: parsed.body };
  bodyCache.set(meta.id, note);
  return note;
}

// Pull the ciphertext back from 0G Storage and decrypt it — proves the note is
// really retrievable from the decentralized network, not just local cache.
export async function verifyFromZG(meta: NoteMeta): Promise<DecryptedNote> {
  const key = requireKey();
  const blobB64 = await fetchFromZG(meta.rootHash);
  const json = await decryptFromBlob(key, blobB64);
  return JSON.parse(json) as DecryptedNote;
}

export function deleteNote(id: string) {
  writeNotes(readNotes().filter((n) => n.id !== id));
  metaCache.delete(id);
  bodyCache.delete(id);
}

// ── lightweight RAG selection (all local, no embedding cost) ──────────────────
const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "is",
  "are", "was", "were", "be", "been", "with", "as", "at", "by", "it", "this",
  "that", "i", "you", "my", "me", "do", "does", "what", "when", "how", "why",
  "where", "who", "which",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export interface ScoredNote extends DecryptedNote {
  id: string;
  score: number;
}

// Decrypt all notes (from local cache) and return the top-k most relevant.
export async function selectRelevant(
  query: string,
  k = 5,
): Promise<ScoredNote[]> {
  const notes = readNotes();
  const qTokens = tokens(query);
  const scored: ScoredNote[] = [];

  for (const meta of notes) {
    const note = await readNote(meta);
    const hay = tokens(note.title + " " + note.body);
    const haySet = new Map<string, number>();
    for (const t of hay) haySet.set(t, (haySet.get(t) || 0) + 1);
    let score = 0;
    for (const qt of qTokens) score += haySet.get(qt) || 0;
    // mild boost for title hits
    const titleTokens = new Set(tokens(note.title));
    for (const qt of qTokens) if (titleTokens.has(qt)) score += 2;
    scored.push({ ...note, id: meta.id, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, k);
  // If nothing matched, fall back to the most recent few so the AI still has
  // some context to reason over.
  return top.length ? top : scored.slice(0, Math.min(3, scored.length));
}
