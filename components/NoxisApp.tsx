"use client"

import { useEffect, useState, useCallback } from "react"
import VaultGate from "./VaultGate"
import NoxisSidebar from "./NoxisSidebar"
import NoteEditor from "./NoteEditor"
import AskPane from "./AskPane"
import { scheduleReminders } from "@/lib/reminders"
import { enableRemindersIfNeeded } from "@/lib/reminders"
import {
  isUnlocked,
  listNotes,
  decryptMeta,
  deleteNote as vaultDeleteNote,
  lockVault,
  type NoteMeta,
} from "@/lib/vault"

export interface ListItem {
  meta: NoteMeta
  title: string
  preview: string
}

type Mode = "note" | "ask"

export default function NoxisApp() {
  // ── theme (mirrors the template's approach) ────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(saved || (prefersDark ? "dark" : "light"))
      setUnlocked(isUnlocked())
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === "dark") root.classList.add("dark")
      else root.classList.remove("dark")
      root.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  // ── vault + notes ──────────────────────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false)
  const [items, setItems] = useState<ListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("note")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refreshNotes = useCallback(async () => {
    const metas = listNotes()
    const decoded = await Promise.all(
      metas.map(async (meta) => {
        const { title, preview } = await decryptMeta(meta)
        return { meta, title, preview }
      }),
    )
    setItems(decoded)
  }, [])

  useEffect(() => {
    if (unlocked) refreshNotes()
  }, [unlocked, refreshNotes])

  useEffect(() => {
    if (unlocked) enableRemindersIfNeeded()
  }, [unlocked])

  function newNote() {
    setSelectedId(null)
    setMode("note")
    setSidebarOpen(false)
  }
  function selectNote(id: string) {
    setSelectedId(id)
    setMode("note")
    setSidebarOpen(false)
  }
  function openAsk() {
    setMode("ask")
    setSidebarOpen(false)
  }
  async function handleDelete(id: string) {
    vaultDeleteNote(id)
    if (selectedId === id) newNote()
    await refreshNotes()
  }
  function lock() {
    lockVault()
    setUnlocked(false)
    setItems([])
    setSelectedId(null)
  }

  const selected = items.find((i) => i.meta.id === selectedId) || null

  if (!mounted) return <div className="h-[100dvh] w-full bg-background" />

  if (!unlocked) {
    return (
      <VaultGate
        theme={theme}
        setTheme={setTheme}
        onEnter={() => setUnlocked(true)}
      />
    )
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex h-[100dvh] max-w-[1400px]">
        <NoxisSidebar
          items={items}
          selectedId={mode === "note" ? selectedId : "__ask__"}
          onSelectNote={selectNote}
          onNewNote={newNote}
          onOpenAsk={openAsk}
          onDelete={handleDelete}
          theme={theme}
          setTheme={setTheme}
          onLock={lock}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          {mode === "ask" ? (
            <AskPane noteCount={items.length} onOpenMenu={() => setSidebarOpen(true)} />
          ) : (
            <NoteEditor
              key={selected?.meta.id || "new"}
              meta={selected?.meta || null}
              onSaved={async (id) => {
                await refreshNotes()
                setSelectedId(id)
              }}
              onDelete={handleDelete}
              onOpenMenu={() => setSidebarOpen(true)}
            />
          )}
        </main>
      </div>
    </div>
  )
}
