import { smoothPath, uid } from './chartMath'

export function AreaChart({
  values,
  labels,
  width = 560,
  height = 220,
  ariaLabel,
}: {
  values: number[]
  labels: string[]
  width?: number
  height?: number
  ariaLabel?: string
}) {
  if (values.length < 2) return <div className="dg-sub">Not enough data yet</div>
  const { d, fill, x, y } = smoothPath(values, width, height - 26, 22)
  const gradId = uid('area')
  const gridLines = [0, 1, 2, 3].map((i) => (8 + (i * (height - 50)) / 3))
  const last = values.length - 1

  return (
    <svg
      className="dg-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? `Line chart: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}
    >
      {gridLines.map((gy, i) => (
        <line key={i} x1={0} x2={width} y1={gy} y2={gy} stroke="var(--line)" />
      ))}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--acc)" stopOpacity=".4" />
          <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(0 8)">
        <path className="dg-fade" d={fill} fill={`url(#${gradId})`} />
        <path className="dg-draw" pathLength={1} d={d} fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinecap="round" />
        {values.map((v, i) => (
          <circle
            key={i}
            className="dg-dot"
            style={{ animationDelay: `${0.9 + i * 0.08}s` }}
            data-tip={`${labels[i]}: ${v}`}
            cx={x(i)}
            cy={y(v)}
            r={3.5}
            fill="var(--card)"
            stroke="var(--acc)"
            strokeWidth={2}
          />
        ))}
        {/* pulsing "live" marker on the most recent point */}
        <circle className="dg-ping" cx={x(last)} cy={y(values[last])} r={4} fill="var(--acc)" />
        <circle cx={x(last)} cy={y(values[last])} r={3} fill="#fff" stroke="var(--acc)" strokeWidth="1.5" />
      </g>
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 4} textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  )
}
