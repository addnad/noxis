"use client"

import { useMemo, useState } from "react"
import { Plus, Sparkles, Search, Lock, Trash2, FileText } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import { cls, timeAgo } from "./utils"
import type { ListItem } from "./NoxisApp"

export default function NoxisSidebar({
  items,
  selectedId,
  onSelectNote,
  onNewNote,
  onOpenAsk,
  onDelete,
  theme,
  setTheme,
  onLock,
  open,
  onClose,
}: {
  items: ListItem[]
  selectedId: string | null
  onSelectNote: (id: string) => void
  onNewNote: () => void
  onOpenAsk: () => void
  onDelete: (id: string) => void
  theme: "light" | "dark"
  setTheme: (fn: (t: "light" | "dark") => "light" | "dark") => void
  onLock: () => void
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.preview.toLowerCase().includes(q),
    )
  }, [items, query])

  const askActive = selectedId === "__ask__"

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cls(
          "z-50 flex h-screen w-[290px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          "fixed inset-y-0 left-0 transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* brand */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="Noxis" className="h-7 w-7 rounded-md" />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight">Noxis</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                encrypted memory
              </div>
            </div>
          </div>
          <button
            onClick={onLock}
            title="Lock vault"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>

        {/* primary actions */}
        <div className="space-y-2 px-3">
          <button
            onClick={onNewNote}
            className="flex w-full items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" /> New note
          </button>
          <button
            onClick={onOpenAsk}
            className={cls(
              "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
              askActive
                ? "border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-white dark:bg-zinc-800 dark:text-white"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800",
            )}
          >
            <Sparkles className="h-4 w-4" /> Ask your vault
          </button>
        </div>

        {/* search */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
            />
          </div>
        </div>

        {/* notes list */}
        <div className="flex items-center justify-between px-4 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
            Encrypted notes
          </span>
          <span className="text-[10px] text-zinc-400">{items.length}</span>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-zinc-400">
              {items.length === 0 ? "No memories yet." : "No matches."}
            </div>
          ) : (
            filtered.map(({ meta, title, preview }) => {
              const active = selectedId === meta.id
              return (
                <button
                  key={meta.id}
                  onClick={() => onSelectNote(meta.id)}
                  className={cls(
                    "group w-full rounded-xl px-3 py-2.5 text-left transition",
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="flex-1 truncate text-sm font-medium">{title}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm("Remove this note from your local index?"))
                          onDelete(meta.id)
                      }}
                      className="shrink-0 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-0.5 line-clamp-1 pl-5 text-xs text-zinc-500 dark:text-zinc-400">
                    {preview || "Empty note"}
                  </div>
                  <div className="mt-1 flex items-center gap-2 pl-5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                      ● 0G
                    </span>
                    <span className="text-[10px] text-zinc-400">{timeAgo(meta.updatedAt)}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 0G Testnet
          </span>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </aside>
    </>
  )
}
