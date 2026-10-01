import type { ReactNode } from 'react'
import { Sparkline } from './Sparkline'
import { Icon } from './icons'
import { useCountUp, useRipple, useSpotlight } from '../../hooks/useDashboardFx'

export function Hero({ day, title, children, side }: { day: string; title: string; children: ReactNode; side?: ReactNode }) {
  return (
    <section className="dg-hero">
      <i className="dg-orb dg-o1" />
      <i className="dg-orb dg-o2" />
      <div className="dg-grow">
        <div className="dg-day">{day}</div>
        <h1>{title}</h1>
        {children}
      </div>
      {side}
    </section>
  )
}

export function HeroButton({ children, ghost, onClick }: { children: ReactNode; ghost?: boolean; onClick?: () => void }) {
  const ripple = useRipple()
  return (
    <button className={`dg-btn dg-rippling${ghost ? ' dg-ghost' : ''}`} onClick={(e) => { ripple.onClick(e); onClick?.() }}>
      {children}
    </button>
  )
}

export function KpiCard({
  label,
  value,
  delta,
  warn,
  icon,
  spark,
  suffix = '',
}: {
  label: string
  value: number
  delta: string
  warn?: boolean
  icon: Parameters<typeof Icon>[0]['name']
  spark: number[]
  suffix?: string
}) {
  const shown = useCountUp(value)
  const spotlight = useSpotlight()
  return (
    <div className="dg-card dg-kpi dg-c3" onMouseMove={spotlight.onMouseMove}>
      <span className="dg-ic">
        <Icon name={icon} />
      </span>
      <div className="dg-l">{label}</div>
      <div className="dg-v">
        {shown}
        {suffix}
      </div>
      <div className={`dg-d${warn ? ' dg-w' : ''}`}>{delta}</div>
      <Sparkline values={spark} />
    </div>
  )
}

export function Pill({ tone = 'default', children }: { tone?: 'default' | 'r' | 'y' | 'g'; children: ReactNode }) {
  return <span className={`dg-pill${tone !== 'default' ? ` dg-${tone}` : ''}`}>{children}</span>
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="dg-bar">
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
  return <span className="dg-avatar">{initials}</span>
}
