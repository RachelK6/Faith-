export type DonutSlice = { label: string; value: number; color: string }

export function Donut({ slices, size = 150, width = 22 }: { slices: DonutSlice[]; size?: number; width?: number }) {
  const r = (size - width) / 2
  const c = 2 * Math.PI * r
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  let offset = 0
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Donut chart: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}
    >
      {slices.map((s, i) => {
        const len = (c * s.value) / total
        const el = (
          <circle
            key={i}
            className="dg-sw"
            style={{ ['--C' as any]: c, animationDelay: `${0.2 + (offset / c) * 0.9}s` }}
            data-tip={`${s.label}: ${s.value}`}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={width}
            strokeDasharray={`${Math.max(len - 3, 1)} ${c}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  return (
    <div className="dg-leg">
      {slices.map((s) => (
        <span key={s.label}>
          <i style={{ background: s.color }} />
          {s.label} {s.value}
        </span>
      ))}
    </div>
  )
}
