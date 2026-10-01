import { useEffect, useRef, useState } from 'react'

export default function Modal({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const lastFocused = useRef(null)

  useEffect(() => {
    // This effect exists specifically to synchronize local "is it mounted /
    // is the enter-transition class applied yet" state with the `open` prop
    // over two animation frames — there is no way to derive that from props
    // during render, so this is the documented "external system" exception,
    // not the "derived state" antipattern the set-state-in-effect rule
    // otherwise correctly guards against.
    if (open) {
      lastFocused.current = document.activeElement
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true)
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 250)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!visible) return
    panelRef.current?.querySelector('input, textarea, select, button')?.focus()
  }, [visible])

  useEffect(() => {
    if (!mounted) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mounted, onClose])

  useEffect(() => {
    if (!mounted && lastFocused.current) lastFocused.current.focus?.()
  }, [mounted])

  if (!mounted) return null

  return (
    <div
      className={`dg-modal-backdrop${visible ? ' dg-on' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dg-modal" role="dialog" aria-modal="true" ref={panelRef}>
        <h3 style={{ fontSize: 18, marginBottom: 10 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}
