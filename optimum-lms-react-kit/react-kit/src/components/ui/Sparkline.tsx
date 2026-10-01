import { smoothPath, uid } from './chartMath'

export function Sparkline({ values, width = 110, height = 44 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null
  const { d, fill } = smoothPath(values, width, height, 4)
  const gradId = uid('spark')
  return (
    <svg className="dg-sp" width={width} height={height} style={{ position: 'absolute', right: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--acc)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke="var(--acc)" strokeWidth="2" />
    </svg>
  )
}
