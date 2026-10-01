import { uid } from './chartMath'
import { useCountUp } from '../../hooks/useDashboardFx'
import type { ReactNode } from 'react'

/**
 * Circular progress ring. `pct` 0-100. Pass `track`/`stroke` colours to override
 * the default (white-on-translucent, meant for the coloured hero) — e.g. for a
 * light-card usage pass stroke="var(--acc)" track="var(--line)".
 */
export function Ring({
  pct,
  size = 170,
  width = 16,
  stroke = '#fff',
  track = '#ffffff30',
  label,
  sub,
}: {
  pct: number
  size?: number
  width?: number
  stroke?: string
  track?: string
  label?: string
  sub?: ReactNode
}) {
  const r = (size - width) / 2
  const c = 2 * Math.PI * r
  const gradId = uid('ring')
  const shown = useCountUp(pct)
  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradId}>
            <stop offset="0" stopColor={stroke} />
            <stop offset="1" stopColor="var(--a2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={width} />
        <circle
          className="dg-sw"
          style={{ ['--C' as any]: c }}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {(label ?? true) && (
        <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1.1 }}>
          <strong style={{ fontSize: 34 }}>{label ?? `${shown}%`}</strong>
          {sub && (
            <span style={{ display: 'block', fontSize: 11, color: '#ffffffb8' }}>{sub}</span>
          )}
        </div>
      )}
    </div>
  )
}
