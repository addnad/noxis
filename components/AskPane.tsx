"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, Sparkles, Send, Loader2, ShieldCheck, Cpu } from "lucide-react"
import { cls } from "./utils"
import { selectRelevant } from "@/lib/vault"

interface Turn {
  role: "user" | "assistant"
  content: string
  sources?: string[]
  verified?: boolean
  model?: string
  pending?: boolean
  error?: boolean
}

const SUGGESTIONS = ["Summarize my notes", "What did I decide about…", "Who is…"]

export default function AskPane({
  noteCount,
  onOpenMenu,
}: {
  noteCount: number
  onOpenMenu: () => void
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [q, setQ] = useState("")
  const [asking, setAsking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns])

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    const question = q.trim()
    if (!question || asking) return
    setQ("")
    setTurns((t) => [...t, { role: "user", content: question }, { role: "assistant", content: "", pending: true }])
    setAsking(true)
    try {
      const relevant = await selectRelevant(question, 5)
      const contexts = relevant.map((r) => ({ title: r.title, body: r.body }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, contexts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "inference failed")
      setTurns((t) => {
        const c = [...t]
        c[c.length - 1] = {
          role: "assistant",
          content: data.answer || "(no answer)",
          sources: relevant.map((r) => r.title),
          verified: data.verified,
          model: data.providerLabel || data.model,
        }
        return c
      })
    } catch (err) {
      setTurns((t) => {
        const c = [...t]
        c[c.length - 1] = { role: "assistant", content: (err as Error).message, error: true }
        return c
      })
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-zinc-200 bg-white/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <button onClick={onOpenMenu} className="rounded-lg p-2 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800">
          <Menu className="h-5 w-5" />
        </button>
        <Sparkles className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-semibold tracking-tight">Ask your vault</span>
        <span className="ml-auto hidden items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 sm:inline-flex dark:border-zinc-800 dark:text-zinc-400">
          <Cpu className="h-3 w-3" /> Grounded in your notes
        </span>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-6 sm:px-8">
        {turns.length === 0 && (
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">Ask your encrypted mind</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Answers come only from your own notes ({noteCount}). Relevant memories
              are selected locally, then reasoned over to answer your question.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className={cls("flex gap-3", turn.role === "user" ? "justify-end" : "justify-start")}>
            {turn.role === "assistant" && (
              <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900">
                Nx
              </div>
            )}
            <div
              className={cls(
                "max-w-[85%] min-w-0 break-words rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[80%]",
                turn.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : turn.error
                    ? "border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                    : "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
              )}
            >
              {turn.pending ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                  </div>
                  reasoning over your notes…
                </div>
              ) : (
                <>
                  {turn.role === "assistant" && !turn.error && (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cls(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          turn.verified
                            ? "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                        )}
                      >
                        <ShieldCheck className="h-3 w-3" /> {turn.verified ? "verified" : "grounded in your notes"}
                      </span>
                      {turn.model && <span className="font-mono text-[10px] text-zinc-400">{turn.model}</span>}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{turn.content}</div>
                  {turn.sources && turn.sources.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400">from memory</span>
                      {turn.sources.map((s, j) => (
                        <span
                          key={j}
                          className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          [{j + 1}] {s}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="border-t border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
        <form
          onSubmit={ask}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                ask(e)
              }
            }}
            rows={1}
            placeholder="Ask anything about your notes…"
            className="flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={asking || !q.trim()}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 p-2.5 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
          >
            {asking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <div className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-400">
          Answers are grounded only in your encrypted notes.
        </div>
      </div>
    </div>
  )
}
