"use client"

import { useState } from "react"
import { KeyRound, Lock, ShieldCheck, Database, Cpu } from "lucide-react"
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
  { icon: Cpu, title: "Answered by verifiable AI", desc: "Questions run on TEE-attested 0G Compute, settled on-chain." },
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
  const [pass, setPass] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (pass.length < 8) return setError("Use at least 8 characters.")
    if (mode === "create" && pass !== confirm) return setError("Passphrases do not match.")
    setBusy(true)
    try {
      if (mode === "create") {
        await createVault(pass)
        onEnter()
      } else {
        const ok = await unlockVault(pass)
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
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Noxis" className="h-7 w-7 rounded-md" />
          <span className="text-[17px] font-semibold tracking-tight">Noxis</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://0g.ai/arena/zero-cup"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 sm:inline-flex dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            The Zero Cup · 0G
          </a>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* hero */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Sovereign second brain
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Your mind, end-to-end encrypted.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Noxis turns your private notes into a searchable AI memory —
            encrypted in your browser, stored on 0G Storage, and queried with
            verifiable 0G Compute. No one but you holds the key.
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
        </div>

        {/* access card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                autoFocus
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
              className="mt-4 text-xs text-zinc-400 underline-offset-2 hover:text-red-500 hover:underline"
            >
              reset local vault
            </button>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-200 px-6 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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
