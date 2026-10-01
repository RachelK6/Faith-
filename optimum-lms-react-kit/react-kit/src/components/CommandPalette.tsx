import { useEffect, useState } from 'react'
import { Modal } from './ui/Modal'

export type Command = { label: string; shortcut?: string; run: () => void }

export function useCommandPaletteHotkey(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        open()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
}

export function CommandPalette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: Command[] }) {
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) setQ('')
  }, [open])
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} title="Quick actions">
      <input
        autoFocus
        placeholder="Type a command…"
        aria-label="Search commands"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filtered[0]) {
            filtered[0].run()
            onClose()
          }
        }}
      />
      <div>
        {filtered.map((c) => (
          <button
            key={c.label}
            className="dg-cmd"
            onClick={() => {
              c.run()
              onClose()
            }}
          >
            {c.label}
            <kbd>{c.shortcut ?? '·'}</kbd>
          </button>
        ))}
      </div>
    </Modal>
  )
}
