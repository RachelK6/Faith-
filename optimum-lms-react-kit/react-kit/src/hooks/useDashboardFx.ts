import { useEffect, useRef, useState, type MouseEvent } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Animates a number counting up from 0 to `value` on mount / whenever `value` changes. Respects reduced-motion. */
export function useCountUp(value: number, decimals = 0, durationMs = 1400) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - k, 4)
      setDisplay(from + (value - from) * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return decimals ? Number(display.toFixed(decimals)) : Math.round(display)
}

/** IntersectionObserver-driven "reveal on scroll" — attach the returned ref + className to any element. */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
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
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, className: `dg-reveal${inView ? ' dg-in' : ''}` }
}

/** Light/dark theme with localStorage persistence. Sets data-theme on <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('dg-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('dg-theme', theme)
  }, [theme])
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}

/** Click-ripple effect for buttons. Spread the returned props onto any button; add className="dg-rippling". */
export function useRipple() {
  const onClick = (e: MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const span = document.createElement('span')
    span.className = 'dg-ripple'
    span.style.width = span.style.height = `${size}px`
    span.style.left = `${e.clientX - rect.left - size / 2}px`
    span.style.top = `${e.clientY - rect.top - size / 2}px`
    el.appendChild(span)
    setTimeout(() => span.remove(), 700)
  }
  return { onClick }
}

/** Cursor-following radial glow on cards — spread onto the card's onMouseMove. */
export function useSpotlight() {
  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }
  return { onMouseMove }
}
