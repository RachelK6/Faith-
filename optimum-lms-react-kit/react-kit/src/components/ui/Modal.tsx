import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement
      setMounted(true)
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!visible) return
    const first = panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')
    first?.focus()
  }, [visible])

  useEffect(() => {
    if (!mounted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mounted, onClose])

  useEffect(() => {
    if (!mounted && lastFocused.current) {
      lastFocused.current.focus?.()
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div
      className={`dg-modal-backdrop${visible ? ' dg-on' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dg-modal" role="dialog" aria-modal="true" aria-labelledby="dg-modal-title" ref={panelRef}>
        <h3 id="dg-modal-title" style={{ fontSize: 18, marginBottom: 10 }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
