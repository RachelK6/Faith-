import { useEffect, useState } from 'react'
import { Icon } from './ui/icons'

export function QuickCreateFab({ actions }: { actions: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#dg-fab')) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  return (
    <div
      id="dg-fab"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 10,
      }}
    >
      {actions.map((a, i) => (
        <button
          key={a.label}
          onClick={() => {
            a.onClick()
            setOpen(false)
          }}
          style={{
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--ink)',
            font: '600 13px inherit',
            padding: '10px 16px',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 12px 26px -12px #000a',
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(18px) scale(.9)',
            pointerEvents: open ? 'auto' : 'none',
            transition: `opacity .3s, transform .45s cubic-bezier(.3,1.5,.5,1) ${(actions.length - i) * 55}ms`,
          }}
        >
          {a.label}
        </button>
      ))}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Quick create"
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          border: 0,
          background: 'linear-gradient(135deg, var(--h1), var(--h2))',
          color: '#fff',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 16px 34px -10px var(--acc)',
          transform: open ? 'rotate(135deg)' : 'none',
          transition: 'transform .5s cubic-bezier(.3,1.5,.5,1)',
        }}
      >
        <Icon name="plus" size={24} />
      </button>
    </div>
  )
}
