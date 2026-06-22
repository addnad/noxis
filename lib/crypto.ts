// Client-side encryption. The master key is derived from the user's passphrase
// and NEVER leaves the browser. The server only ever sees ciphertext.

const PBKDF2_ITERATIONS = 250_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// Deterministic salt derived from the username, so the same username + passphrase
// yields the same key on any device (enables cross-device sync). The username is
// namespaced to avoid collisions with other apps' derivations.
export async function saltFromUsername(username: string): Promise<Uint8Array> {
  const normalized = username.trim().toLowerCase();
  const data = enc.encode(`noxis:v1:${normalized}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash).slice(0, 16);
}

// Derive a short, stable, NON-secret identifier for a username — used as the
// public pointer key in the sync store. Derived from username only (no passphrase),
// so it reveals nothing about the key.
export async function userHandle(username: string): Promise<string> {
  const normalized = username.trim().toLowerCase();
  const data = enc.encode(`noxis:handle:v1:${normalized}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toB64(new Uint8Array(hash).slice(0, 12)).replace(/[^a-zA-Z0-9]/g, "");
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface Cipher {
  iv: string; // base64
  ct: string; // base64
}

export async function encryptString(
  key: CryptoKey,
  plaintext: string,
): Promise<Cipher> {
  const iv = randomBytes(12);
  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    enc.encode(plaintext),
  );
  return { iv: toB64(iv), ct: toB64(new Uint8Array(ctBuf)) };
}

export async function decryptString(
  key: CryptoKey,
  cipher: Cipher,
): Promise<string> {
  const ivBytes = fromB64(cipher.iv);
  const ctBytes = fromB64(cipher.ct);
  const buf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as unknown as BufferSource },
    key,
    ctBytes as unknown as BufferSource,
  );
  return dec.decode(buf);
}

// Encrypt a string and return a single base64 blob (iv || ciphertext) suitable
// for storing on 0G as one opaque object.
export async function encryptToBlob(
  key: CryptoKey,
  plaintext: string,
): Promise<string> {
  const { iv, ct } = await encryptString(key, plaintext);
  const ivBytes = fromB64(iv);
  const ctBytes = fromB64(ct);
  const out = new Uint8Array(ivBytes.length + ctBytes.length);
  out.set(ivBytes, 0);
  out.set(ctBytes, ivBytes.length);
  return toB64(out);
}

export async function decryptFromBlob(
  key: CryptoKey,
  blobB64: string,
): Promise<string> {
  const bytes = fromB64(blobB64);
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  return decryptString(key, { iv: toB64(iv), ct: toB64(ct) });
}
