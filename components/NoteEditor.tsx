"use client"

import { useEffect, useState } from "react"
import {
  Menu, Loader2, Database, Copy, Check, RefreshCw, Trash2, Lock, ShieldCheck, AlertCircle,
} from "lucide-react"
import { cls } from "./utils"
import { CHAIN_EXPLORER, STORAGE_EXPLORER } from "@/lib/zg/config"
import { saveNote, readNote, verifyFromZG, type NoteMeta } from "@/lib/vault"

function short(h?: string) {
  if (!h) return "—"
  return h.length > 16 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h
}

function HashChip({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-950">
      <span className="text-zinc-400">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-zinc-700 hover:underline dark:text-zinc-300">
          {short(value)}
        </a>
      ) : (
        <span className="text-zinc-700 dark:text-zinc-300">{short(value)}</span>
      )}
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  )
}

export default function NoteEditor({
  meta,
  onSaved,
  onDelete,
  onOpenMenu,
}: {
  meta: NoteMeta | null
  onSaved: (id: string) => void
  onDelete: (id: string) => void
  onOpenMenu: () => void
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveStep, setSaveStep] = useState("")
  const [receipt, setReceipt] = useState<NoteMeta | null>(meta)
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null)

  useEffect(() => {
    let active = true
    setReceipt(meta)
    setMsg(null)
    if (meta) {
      readNote(meta).then((n) => {
        if (!active) return
        setTitle(n.title)
        setBody(n.body)
      })
    } else {
      setTitle("")
      setBody("")
    }
    return () => {
      active = false
    }
  }, [meta])

  async function handleSave() {
    if (!title.trim() && !body.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      setSaveStep("Encrypting (AES-256)…")
      await new Promise((r) => setTimeout(r, 120))
      setSaveStep("Uploading ciphertext to 0G Storage…")
      const { meta: saved } = await saveNote(title.trim() || "Untitled", body, meta?.id)
      setReceipt(saved)
      setSaveStep("")
      onSaved(saved.id)
      setMsg({ kind: "ok", text: "Encrypted and stored on 0G Storage." })
    } catch (e) {
      setSaveStep("")
      setMsg({ kind: "err", text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    if (!receipt) return
    setMsg({ kind: "info", text: "Fetching ciphertext from 0G Storage…" })
    try {
      const n = await verifyFromZG(receipt)
      const matches = n.body === body && n.title === (title.trim() || "Untitled")
      setMsg({
        kind: "ok",
        text: matches
          ? "Retrieved from 0G and decrypted — content matches."
          : "Retrieved & decrypted the stored version from 0G.",
      })
      if (!matches) {
        setTitle(n.title)
        setBody(n.body)
      }
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-zinc-200 bg-white/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <button onClick={onOpenMenu} className="rounded-lg p-2 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {meta ? "Editing note" : "New note"}
        </span>
        {receipt && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <ShieldCheck className="h-3 w-3" /> On 0G
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {meta && (
            <button
              onClick={() => {
                if (window.confirm("Remove this note from your local index?")) onDelete(meta.id)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* editor */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-5 py-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled memory"
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <Lock className="h-3 w-3" />
            Encrypted on device
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            {body.trim() ? body.trim().split(/\s+/).length : 0} words
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            {body.length} chars
          </span>
          <span className="font-mono text-[11px] text-zinc-400">AES-256-GCM</span>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a thought, a fact, a meeting, a person… It is encrypted in your browser before it ever leaves."
          className="mt-5 min-h-[260px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
        />

        {/* receipt */}
        {receipt && (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-emerald-500" /> 0G Storage receipt
              <span className="font-mono text-[11px] font-normal text-zinc-400">{receipt.size} bytes ciphertext</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <HashChip label="root" value={receipt.rootHash} href={`${STORAGE_EXPLORER}/`} />
              {receipt.txHash ? (
                <HashChip label="tx" value={receipt.txHash} href={`${CHAIN_EXPLORER}/tx/${receipt.txHash}`} />
              ) : (
                <span className="font-mono text-[11px] text-zinc-400">tx · already on network</span>
              )}
              <button
                onClick={handleVerify}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-white dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-3 w-3" /> Pull from 0G
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div
            className={cls(
              "mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
              msg.kind === "ok" && "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
              msg.kind === "err" && "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
              msg.kind === "info" && "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
            )}
          >
            {msg.kind === "ok" ? <Check className="h-4 w-4 text-emerald-500" /> : msg.kind === "err" ? <AlertCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {msg.text}
          </div>
        )}
      </div>

      {/* action bar */}
      <div className="border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || (!title.trim() && !body.trim())}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {saving ? saveStep || "Storing…" : "Encrypt & store on 0G"}
          </button>
          <span className="font-mono text-[11px] text-zinc-400">AES-256-GCM → 0G Storage</span>
        </div>
      </div>
    </div>
  )
}
