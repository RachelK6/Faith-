import { Fragment, useEffect, useState } from 'react'
import { useCountUp } from '../hooks/useDashboardFx.js'

/** Hero headline that reveals word-by-word, each word sliding up from a mask. */
export function HeroTitle({ text }) {
  return (
    <h1 aria-label={text}>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="dg-word" aria-hidden="true">
            <span style={{ '--k': i }}>{w}</span>
          </span>
        </Fragment>
      ))}
    </h1>
  )
}

/** Animates the first number found in `value` (e.g. 12, "87%", "3 days"); non-numeric values render as-is. */
export function CountUp({ value }) {
  const s = String(value ?? '')
  const m = s.match(/-?\d+(\.\d+)?/)
  const n = m ? parseFloat(m[0]) : 0
  const decimals = m && m[1] ? m[1].length - 1 : 0
  const shown = useCountUp(n, decimals)
  return <>{m ? s.replace(m[0], String(shown)) : s}</>
}

/** Thin gradient bar under the top edge that tracks page scroll. */
export function ScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const d = document.documentElement
      const max = d.scrollHeight - d.clientHeight
      setP(max > 0 ? d.scrollTop / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return <div className="dg-scroll" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
}

/** Mounts once per dashboard: chart tooltips (data-tip) and click ripples on .dg-btn/.dg-gb. */
export function GlobalFx() {
  useEffect(() => {
    const tip = document.createElement('div')
    tip.id = 'dg-tip'
    document.body.appendChild(tip)

    const onMove = (e) => {
      const t = e.target.closest?.('[data-tip]')
      if (t) {
        tip.textContent = t.getAttribute('data-tip')
        tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY - 40}px)`
        tip.classList.add('dg-on')
      } else {
        tip.classList.remove('dg-on')
      }
    }
    const onClick = (e) => {
      const b = e.target.closest?.('.dg-btn, .dg-gb')
      if (!b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const r = b.getBoundingClientRect()
      const d = Math.max(r.width, r.height) * 2
      const s = document.createElement('span')
      s.className = 'dg-ripple'
      Object.assign(s.style, {
        width: `${d}px`, height: `${d}px`,
        left: `${e.clientX - r.left - d / 2}px`, top: `${e.clientY - r.top - d / 2}px`,
      })
      b.appendChild(s)
      setTimeout(() => s.remove(), 700)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick)
      tip.remove()
    }
  }, [])
  return null
}
