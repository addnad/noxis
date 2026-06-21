"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogoMark } from "./Logo";
import { DecryptText } from "./DecryptText";
import {
  isVaultInitialized,
  createVault,
  unlockVault,
  destroyVault,
} from "@/lib/vault";

const FEATURES = [
  {
    k: "AES-256 · CLIENT-SIDE",
    t: "Encrypted in your browser",
    d: "Your passphrase derives the key. It never touches a server.",
  },
  {
    k: "0G STORAGE",
    t: "Stored on a decentralized network",
    d: "Each note is an opaque blob addressed by a Merkle root on 0G.",
  },
  {
    k: "0G COMPUTE",
    t: "Answered by verifiable AI",
    d: "Queries run on TEE-attested inference, settled on-chain.",
  },
];

export function Gate({ onEnter }: { onEnter: () => void }) {
  const initialized =
    typeof window !== "undefined" ? isVaultInitialized() : false;
  const [mode] = useState<"create" | "unlock">(
    initialized ? "unlock" : "create",
  );
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pass.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (mode === "create" && pass !== confirm) {
      setError("Passphrases do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "create") {
        await createVault(pass);
        onEnter();
      } else {
        const ok = await unlockVault(pass);
        if (ok) onEnter();
        else setError("Wrong passphrase. The vault could not be decrypted.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (
      confirm.length >= 0 &&
      window.confirm(
        "This erases the local vault index. Notes already on 0G Storage remain, but without your passphrase they are unrecoverable. Continue?",
      )
    ) {
      destroyVault();
      window.location.reload();
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-[17px] font-semibold tracking-tight">
            Noxis
          </span>
        </div>
        <a
          href="https://0g.ai/arena/zero-cup"
          target="_blank"
          rel="noreferrer"
          className="pill pill-violet"
        >
          ◆ The Zero Cup · 0G
        </a>
      </div>

      {/* hero */}
      <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="label mb-5">Sovereign second brain</div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
            Your mind,
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-cipher-500 bg-clip-text text-transparent">
              <DecryptText text="end-to-end encrypted." speed={26} />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-mist-300">
            Noxis turns your private notes into a searchable AI memory —
            encrypted in your browser, stored on{" "}
            <span className="text-mist-100">0G Storage</span>, and queried with{" "}
            <span className="text-mist-100">verifiable 0G Compute</span>. No one
            but you holds the key.
          </p>

          <div className="mt-10 space-y-px overflow-hidden rounded-2xl border border-violet-500/12">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.k}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4 bg-ink-800/60 px-5 py-4"
              >
                <span className="mono mt-1 whitespace-nowrap text-[10px] tracking-[0.16em] text-cipher-500">
                  {f.k}
                </span>
                <div>
                  <div className="text-[15px] font-medium text-mist-100">
                    {f.t}
                  </div>
                  <div className="text-sm text-mist-400">{f.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* access panel */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="panel relative overflow-hidden p-7"
        >
          <div className="scanline animate-scan" />
          <div className="mb-1 flex items-center gap-2">
            <span className="pill">● ENCRYPTED VAULT</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            {mode === "create" ? "Create your vault" : "Unlock your vault"}
          </h2>
          <p className="mt-2 text-sm text-mist-400">
            {mode === "create"
              ? "Choose a passphrase. It encrypts everything and is never sent anywhere — if you lose it, your notes are gone for good."
              : "Enter your passphrase to decrypt your memory locally."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="label">Passphrase</label>
              <input
                type="password"
                autoFocus
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••••••"
                className="field mono mt-2"
              />
            </div>
            {mode === "create" && (
              <div>
                <label className="label">Confirm passphrase</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  className="field mono mt-2"
                />
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-500">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full justify-center"
            >
              {busy
                ? "Deriving key…"
                : mode === "create"
                  ? "Create vault →"
                  : "Decrypt & enter →"}
            </button>
          </form>

          {initialized && (
            <button
              onClick={reset}
              className="mono mt-4 text-[11px] text-mist-500 underline-offset-2 hover:text-rose-500 hover:underline"
            >
              reset local vault
            </button>
          )}
        </motion.div>
      </div>

      {/* trust footer */}
      <div className="mono mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-5 text-[11px] text-mist-400">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cipher-500 shadow-[0_0_8px_rgba(43,240,190,0.7)]" />
          0G Galileo Testnet
        </span>
        <span className="text-mist-500">·</span>
        <span>AES-256 · client-side</span>
        <span className="text-mist-500">·</span>
        <span>keys never leave your device</span>
      </div>
    </main>
  );
}
