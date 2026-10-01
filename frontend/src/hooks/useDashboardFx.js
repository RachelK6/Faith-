import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

let uidCounter = 0
export function uid(prefix = 'g') {
  uidCounter += 1
  return `${prefix}${uidCounter}`
}

export function smoothPath(values, w, h, pad = 6) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const n = values.length
  const x = (i) => pad + (i * (w - 2 * pad)) / Math.max(n - 1, 1)
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad)
  let d = `M${x(0)} ${y(values[0])}`
  for (let i = 1; i < n; i++) {
    const cx = (x(i - 1) + x(i)) / 2
    d += `C${cx} ${y(values[i - 1])} ${cx} ${y(values[i])} ${x(i)} ${y(values[i])}`
  }
  const fill = `${d}L${x(n - 1)} ${h}L${x(0)} ${h}Z`
  return { d, fill, x, y }
}

export function radarPoint(i, n, k, cx, cy, r) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
  return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]
}

/* ------------------------------------------------------------------ */
/* small fx hooks                                                      */
/* ------------------------------------------------------------------ */

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useCountUp(value, decimals = 0, durationMs = 1200) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      // Synchronizing with an external system (the OS/browser's reduced-motion
      // preference) that can't be read during render — this is exactly the
      // "you do need an effect" case React's own docs carve out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - k, 4)
      setDisplay(value * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, decimals, durationMs])
  return decimals ? Number(display.toFixed(decimals)) : Math.round(display)
}

/** Reveal-on-scroll with a safety-net timeout (a card in a layout with an
 * inner scroll container can otherwise leave IntersectionObserver never
 * firing, which would leave the card invisible forever). */
export function useReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      // Same external-system case as useCountUp above.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px 200px 0px' },
    )
    io.observe(el)
    const fallback = setTimeout(() => setInView(true), 900)
    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold])
  return { ref, className: `dg-reveal${inView ? ' dg-in' : ''}` }
}

export function useSpotlight() {
  return {
    onMouseMove: (e) => {
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    },
  }
}
