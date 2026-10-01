import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const d = document.documentElement
      const max = d.scrollHeight - d.clientHeight
      setPct(max > 0 ? d.scrollTop / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 30,
        background: 'linear-gradient(90deg, var(--h2), var(--acc), var(--a2))',
        transformOrigin: 'left',
        transform: `scaleX(${pct})`,
        pointerEvents: 'none',
      }}
    />
  )
}
