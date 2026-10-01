import { radarPoint } from './chartMath'

export function Radar({
  labels,
  values,
  size = 300,
}: {
  labels: string[]
  values: number[] // 0-100, same order as labels
  size?: number
}) {
  const c = size / 2
  const r = c - 46
  const n = labels.length
  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg
      className="dg-chart"
      style={{ maxWidth: 340, margin: 'auto' }}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Radar chart: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}
    >
      {rings.map((k, i) => (
        <polygon
          key={i}
          points={labels.map((_, j) => radarPoint(j, n, k, c, c, r).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
        />
      ))}
      {labels.map((_, i) => {
        const [x, y] = radarPoint(i, n, 1, c, c, r)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" />
      })}
      <polygon
        className="dg-rp"
        points={values.map((v, i) => radarPoint(i, n, v / 100, c, c, r).join(',')).join(' ')}
        fill="var(--acc)"
        fillOpacity={0.22}
        stroke="var(--acc)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = radarPoint(i, n, v / 100, c, c, r)
        return <circle key={i} cx={x} cy={y} r={4} fill="var(--acc)" />
      })}
      {labels.map((l, i) => {
        const [x, y] = radarPoint(i, n, 1.2, c, c, r)
        return (
          <text key={i} x={x} y={y + 4} textAnchor="middle">
            {l}
          </text>
        )
      })}
    </svg>
  )
}
