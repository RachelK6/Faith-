import type React from 'react'
/** `values` should have weeks*7 entries, 0-3 intensity, oldest first. */
export function Heatmap({ values, weeks = 14 }: { values: number[]; weeks?: number }) {
  const cells: React.ReactElement[] = []
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const k = w * 7 + d
      const v = values[k] ?? 0
      const opacity = v > 2 ? 1 : v > 1.5 ? 0.65 : v > 0.8 ? 0.35 : v > 0.2 ? 0.16 : 0.06
      cells.push(
        <rect
          key={k}
          className="dg-hc"
          style={{ animationDelay: `${0.3 + k * 9}ms` }}
          data-tip={`${v} activities`}
          x={w * 22}
          y={d * 22}
          width={18}
          height={18}
          rx={5}
          fill="var(--acc)"
          fillOpacity={opacity}
        />,
      )
    }
  }
  return (
    <svg className="dg-chart" viewBox={`0 0 ${weeks * 22} 152`} role="img" aria-label="Activity heatmap, last few weeks">
      {cells}
    </svg>
  )
}
