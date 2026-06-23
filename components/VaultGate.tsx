"use client"

import { useState, useEffect } from "react"
import { KeyRound, Lock, ShieldCheck, Database, Cpu, Trash2, User, ArrowLeft, ArrowRight } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import {
  isVaultInitialized,
  createVault,
  unlockVault,
  destroyVault,
} from "@/lib/vault"

const FEATURES = [
  { icon: Lock, title: "Encrypted on your device", desc: "AES-256 from your passphrase. The key never leaves your browser." },
  { icon: Database, title: "Stored on 0G Storage", desc: "Each note is an opaque blob addressed by a Merkle root." },
  { icon: Cpu, title: "Answered by AI", desc: "Ask questions and get answers grounded only in your own encrypted notes." },
]

export default function VaultGate({
  theme,
  setTheme,
  onEnter,
}: {
  theme: "light" | "dark"
  setTheme: (fn: (t: "light" | "dark") => "light" | "dark") => void
  onEnter: () => void
}) {
  const initialized = typeof window !== "undefined" ? isVaultInitialized() : false
  const mode: "create" | "unlock" = initialized ? "unlock" : "create"
  const [username, setUsername] = useState("")
  const [pass, setPass] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  // Pre-fill the username on return visits / refresh so users only type the passphrase.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("noxis.vault.v1")
      if (raw) {
        const v = JSON.parse(raw)
        if (v?.username) setUsername(v.username)
      }
    } catch {}
  }, [])

  // Decypher / scramble effect for the hero headline
  const FULL_HEADLINE = "YOUR MIND, END-TO-END ENCRYPTED."
  const [typed, setTyped] = useState("")
  useEffect(() => {
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>/"
    let frame = 0
    const id = setInterval(() => {
      frame++
      // How many characters are "locked in" (resolved) so far
      const revealed = frame / 3
      const out = FULL_HEADLINE.split("").map((ch, idx) => {
        if (ch === " ") return " "
        if (idx < revealed) return ch
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      }).join("")
      setTyped(out)
      if (revealed >= FULL_HEADLINE.length) {
        setTyped(FULL_HEADLINE)
        clearInterval(id)
      }
    }, 40)
    return () => clearInterval(id)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (username.trim().length < 3) return setError("Username must be at least 3 characters.")
    if (pass.length < 8) return setError("Use at least 8 characters.")
    if (mode === "create" && pass !== confirm) return setError("Passphrases do not match.")
    setBusy(true)
    try {
      if (mode === "create") {
        await createVault(username, pass)
        onEnter()
      } else {
        const ok = await unlockVault(username, pass)
        if (ok) onEnter()
        else setError("Wrong passphrase. The vault could not be decrypted.")
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    if (
      window.confirm(
        "This erases the local vault index. Notes already on 0G Storage remain, but without your passphrase they are unrecoverable. Continue?",
      )
    ) {
      destroyVault()
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="relative flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Noxis" className="h-7 w-7 rounded-md" />
          <span className="text-[17px] font-semibold tracking-tight">Noxis</span>
        </div>
        <div className="flex items-center gap-3">
          {showLogin && (
            <button
              onClick={() => { setShowLogin(false); setError("") }}
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-md flex-1 items-center gap-12 px-6 py-10 lg:max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* hero */}
        <div className={showLogin ? "hidden lg:block" : "block"}>
          <h1 className="text-balance font-mono text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl">
            {typed}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Noxis turns your private notes into a searchable AI memory —
            encrypted in your browser, stored on 0G Storage, and queried with
            an AI that answers only from your own notes. No one but you holds the key.
          </p>

          <div className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile CTA — reveals the login portal */}
          <button
            onClick={() => setShowLogin(true)}
            className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 lg:hidden dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {mode === "create" ? "Get started" : "Unlock your vault"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* access card */}
        <div className={showLogin ? "block rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" : "hidden rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm lg:block dark:border-zinc-800 dark:bg-zinc-900"}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
            <Lock className="h-3.5 w-3.5" /> Encrypted vault
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "Create your vault" : "Unlock your vault"}
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "create"
              ? "Choose a passphrase. It encrypts everything and is never sent anywhere — if you lose it, your notes are gone for good."
              : "Enter your passphrase to decrypt your memory locally."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus={mode === "create"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-white/10"
              />
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                autoFocus={mode === "unlock"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Passphrase"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-white/10"
              />
            </div>
            {mode === "create" && (
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm passphrase"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 dark:focus:ring-white/10"
                />
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {busy ? "Deriving key…" : mode === "create" ? "Create vault →" : "Decrypt & enter →"}
            </button>
          </form>

          {initialized && (
            <button
              onClick={reset}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              <Trash2 className="h-3.5 w-3.5" /> Reset local vault
            </button>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-zinc-200 px-6 py-4 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 0G Galileo Testnet
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>AES-256 · client-side</span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>keys never leave your device</span>
      </footer>
    </div>
  )
}
