"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "./Logo";
import { CHAIN_EXPLORER, STORAGE_EXPLORER } from "@/lib/zg/config";
import {
  listNotes,
  saveNote,
  readNote,
  deleteNote,
  decryptMeta,
  selectRelevant,
  verifyFromZG,
  lockVault,
  type NoteMeta,
} from "@/lib/vault";

type View = "capture" | "ask";

interface ListItem {
  meta: NoteMeta;
  title: string;
  preview: string;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string }[];
  verified?: boolean;
  model?: string;
  chatId?: string;
  pending?: boolean;
  error?: boolean;
}

function shortHash(h?: string) {
  if (!h) return "—";
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}

function CopyHash({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={value}
      className="mono inline-flex items-center gap-1.5 text-[11px] text-mist-300 hover:text-violet-300"
    >
      <span className="text-mist-500">{label}</span>
      <span>{shortHash(value)}</span>
      <span className="text-cipher-500">{copied ? "copied" : "⧉"}</span>
    </button>
  );
}

export function Workspace({ onLock }: { onLock: () => void }) {
  const [view, setView] = useState<View>("capture");
  const [items, setItems] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");

  // editor state
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState("");
  const [receipt, setReceipt] = useState<NoteMeta | null>(null);
  const [verifyMsg, setVerifyMsg] = useState("");

  // ask state
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  async function refreshList() {
    const metas = listNotes();
    const decoded = await Promise.all(
      metas.map(async (meta) => {
        const { title, preview } = await decryptMeta(meta);
        return { meta, title, preview };
      }),
    );
    setItems(decoded);
  }

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.preview.toLowerCase().includes(q),
    );
  }, [items, query]);

  function newNote() {
    setEditId(null);
    setTitle("");
    setBody("");
    setReceipt(null);
    setVerifyMsg("");
    setView("capture");
  }

  async function openNote(meta: NoteMeta) {
    const note = await readNote(meta);
    setEditId(meta.id);
    setTitle(note.title);
    setBody(note.body);
    setReceipt(meta);
    setVerifyMsg("");
    setView("capture");
  }

  async function handleSave() {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    setReceipt(null);
    setVerifyMsg("");
    try {
      setSaveStep("Encrypting (AES-256)…");
      await new Promise((r) => setTimeout(r, 150));
      setSaveStep("Uploading ciphertext to 0G Storage…");
      const { meta } = await saveNote(
        title.trim() || "Untitled",
        body,
        editId || undefined,
      );
      setEditId(meta.id);
      setReceipt(meta);
      setSaveStep("");
      await refreshList();
    } catch (e) {
      setSaveStep("");
      setVerifyMsg("✕ " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    if (!receipt) return;
    setVerifyMsg("Fetching ciphertext from 0G Storage…");
    try {
      const note = await verifyFromZG(receipt);
      const ok = note.body === body && note.title === (title.trim() || "Untitled");
      setVerifyMsg(
        ok
          ? "✓ Retrieved from 0G and decrypted — content matches."
          : "✓ Retrieved & decrypted from 0G (loaded that version).",
      );
      if (!ok) {
        setTitle(note.title);
        setBody(note.body);
      }
    } catch (e) {
      setVerifyMsg("✕ " + (e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this note from your local index?")) return;
    deleteNote(id);
    if (editId === id) newNote();
    await refreshList();
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setQuestion("");
    setTurns((t) => [
      ...t,
      { role: "user", content: q },
      { role: "assistant", content: "", pending: true },
    ]);
    setAsking(true);
    try {
      const relevant = await selectRelevant(q, 5);
      const contexts = relevant.map((r) => ({ title: r.title, body: r.body }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, contexts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "inference failed");
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: "assistant",
          content: data.answer || "(no answer)",
          sources: relevant.map((r) => ({ title: r.title })),
          verified: data.verified,
          model: data.providerLabel || data.model,
          chatId: data.chatId,
        };
        return copy;
      });
    } catch (err) {
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: "assistant",
          content: (err as Error).message,
          error: true,
        };
        return copy;
      });
    } finally {
      setAsking(false);
    }
  }

  function lock() {
    lockVault();
    onLock();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5">
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-500/10 pb-4">
        <div className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="text-[16px] font-semibold tracking-tight">
            Noxis
          </span>
          <span className="pill pill-violet ml-1">vault open</span>
        </div>
        <button onClick={lock} className="btn btn-ghost py-2 text-[13px]">
          ⨯ Lock vault
        </button>
      </header>

      <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[300px_1fr]">
        {/* sidebar: library */}
        <aside className="panel flex max-h-[78vh] flex-col p-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="label">Encrypted library · {items.length}</span>
            <button
              onClick={newNote}
              className="mono text-[11px] text-violet-300 hover:text-violet-400"
            >
              + new
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter notes…"
            className="field mb-2 py-2 text-[13px]"
          />
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <div className="px-2 py-8 text-center text-sm text-mist-500">
                {items.length === 0
                  ? "No memories yet. Capture your first thought →"
                  : "No matches."}
              </div>
            )}
            {filtered.map(({ meta, title, preview }) => (
              <button
                key={meta.id}
                onClick={() => openNote(meta)}
                className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  editId === meta.id
                    ? "border-violet-500/40 bg-violet-500/8"
                    : "border-transparent bg-ink-700/40 hover:border-violet-500/20 hover:bg-ink-700/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-medium text-mist-100">
                    {title}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(meta.id);
                    }}
                    className="mono shrink-0 text-[11px] text-mist-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-500"
                  >
                    del
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-mist-400">
                  {preview}
                </div>
                <div className="mono mt-1.5 flex items-center gap-2 text-[10px] text-cipher-600">
                  <span>● 0G</span>
                  <span className="text-mist-500">{shortHash(meta.rootHash)}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* main */}
        <section className="panel flex max-h-[78vh] flex-col overflow-hidden">
          {/* tabs */}
          <div className="flex items-center gap-1 border-b border-violet-500/10 px-3 py-2.5">
            {(["capture", "ask"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`mono rounded-lg px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition ${
                  view === v
                    ? "bg-violet-500/14 text-violet-300"
                    : "text-mist-400 hover:text-mist-200"
                }`}
              >
                {v === "capture" ? "✎ Capture" : "✦ Ask"}
              </button>
            ))}
            <div className="ml-auto pr-1">
              {view === "ask" && (
                <span className="pill">0G Compute · verifiable</span>
              )}
            </div>
          </div>

          {/* body */}
          <AnimatePresence mode="wait">
            {view === "capture" ? (
              <motion.div
                key="capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col overflow-y-auto p-5"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled memory"
                  className="w-full bg-transparent text-2xl font-semibold tracking-tight text-mist-100 outline-none placeholder:text-mist-500"
                />
                <div className="mono mt-1 text-[11px] text-mist-500">
                  {editId ? "editing encrypted note" : "new note"} ·{" "}
                  {body.length} chars
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a thought, a fact, a meeting, a person… It will be encrypted on this device before it ever leaves."
                  className="mt-4 min-h-[240px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-mist-200 outline-none placeholder:text-mist-500"
                />

                {/* receipt */}
                <AnimatePresence>
                  {receipt && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 rounded-xl border border-cipher-500/25 bg-cipher-500/5 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="pill">● ENCRYPTED ON 0G</span>
                        <span className="mono text-[11px] text-mist-400">
                          {receipt.size} bytes ciphertext
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a
                          href={`${STORAGE_EXPLORER}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:opacity-80"
                        >
                          <CopyHash value={receipt.rootHash} label="root" />
                        </a>
                        {receipt.txHash ? (
                          <a
                            href={`${CHAIN_EXPLORER}/tx/${receipt.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:opacity-80"
                          >
                            <CopyHash value={receipt.txHash} label="tx" />
                          </a>
                        ) : (
                          <span className="mono text-[11px] text-mist-500">
                            tx · already on network
                          </span>
                        )}
                        <button
                          onClick={handleVerify}
                          className="mono text-[11px] text-violet-300 hover:text-violet-400"
                        >
                          ↻ pull from 0G
                        </button>
                      </div>
                      {verifyMsg && (
                        <div className="mono mt-2 text-[11px] text-cipher-500">
                          {verifyMsg}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? saveStep || "Storing…" : "⛓ Encrypt & store on 0G"}
                  </button>
                  {editId && (
                    <button onClick={newNote} className="btn btn-ghost">
                      New
                    </button>
                  )}
                  {!receipt && verifyMsg && (
                    <span className="mono text-[11px] text-rose-500">
                      {verifyMsg}
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ask"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {turns.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <LogoMark size={48} spin />
                      <h3 className="mt-5 text-xl font-semibold text-mist-100">
                        Ask your encrypted mind
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-mist-400">
                        Questions are answered only from your own notes. The
                        relevant memories are selected locally, then reasoned
                        over by verifiable 0G Compute.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-2">
                        {[
                          "What did I decide about…",
                          "Summarize my notes on…",
                          "Who is…",
                        ].map((s) => (
                          <button
                            key={s}
                            onClick={() => setQuestion(s)}
                            className="pill pill-muted hover:text-mist-100"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {turns.map((turn, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        turn.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          turn.role === "user"
                            ? "bg-violet-500/14 text-mist-100"
                            : turn.error
                              ? "border border-rose-500/30 bg-rose-500/5 text-rose-500"
                              : "border border-violet-500/12 bg-ink-700/60 text-mist-200"
                        }`}
                      >
                        {turn.pending ? (
                          <div className="mono flex items-center gap-2 text-[12px] text-mist-400">
                            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cipher-500" />
                            routing through 0G Compute…
                          </div>
                        ) : (
                          <>
                            {turn.role === "assistant" && !turn.error && (
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={
                                    turn.verified ? "pill" : "pill pill-muted"
                                  }
                                >
                                  {turn.verified
                                    ? "✓ TEE-VERIFIED"
                                    : "unverified"}
                                </span>
                                {turn.model && (
                                  <span className="mono text-[10px] text-mist-500">
                                    {turn.model}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed">
                              {turn.content}
                            </div>
                            {turn.sources && turn.sources.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-violet-500/10 pt-2.5">
                                <span className="label">from memory:</span>
                                {turn.sources.map((s, j) => (
                                  <span
                                    key={j}
                                    className="pill pill-violet text-[10px]"
                                  >
                                    [{j + 1}] {s.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEnd} />
                </div>

                <form
                  onSubmit={ask}
                  className="flex items-center gap-2 border-t border-violet-500/10 p-3"
                >
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about your notes…"
                    className="field"
                    disabled={asking}
                  />
                  <button
                    type="submit"
                    disabled={asking || !question.trim()}
                    className="btn btn-primary"
                  >
                    {asking ? "…" : "Ask →"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <footer className="mono flex items-center justify-between border-t border-violet-500/10 pt-3 text-[10px] text-mist-500">
        <span>NOXIS · encrypted second brain</span>
        <span>0G Storage + 0G Compute</span>
      </footer>
    </div>
  );
}
