import type React from 'react'
export type PathModule = { title: string; status: 'done' | 'current' | 'locked' }

const CHECK = 'M-5 0l4 4 7-8'
const LOCK = 'M-4 -1h8v6h-8zM-2.5 -1v-2a2.5 2.5 0 015 0v2'

export function LearningPath({ modules, completedPct }: { modules: PathModule[]; completedPct: number }) {
  const w = 880
  const h = 150
  const n = modules.length
  let d = ''
  const nodes: React.ReactElement[] = []

  modules.forEach((m, i) => {
    const x = 50 + (i * (w - 100)) / Math.max(n - 1, 1)
    const y = i % 2 ? 54 : 86
    d += (i ? `S${x - 40} ${y + (i % 2 ? 26 : -26)} ` : 'M') + `${x} ${y} `
    const isCurrent = m.status === 'current'
    const isDone = m.status === 'done'
    nodes.push(
      <g key={i} className="dg-nd" style={{ animationDelay: `${0.5 + i * 0.13}s` }}>
        {isCurrent && <circle className="dg-ping" cx={x} cy={y} r={20} fill="var(--acc)" />}
        <circle
          cx={x}
          cy={y}
          r={isCurrent ? 17 : 14}
          fill={m.status === 'locked' ? 'var(--card)' : 'var(--acc)'}
          stroke={m.status === 'locked' ? 'var(--line)' : 'var(--acc)'}
          strokeWidth={3}
        />
        {isDone && <path d={`M${x} ${y}${CHECK}`} stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" />}
        {isCurrent && <circle cx={x} cy={y} r={5} fill="#fff" />}
        {m.status === 'locked' && (
          <path d={`M${x} ${y}${LOCK}`} stroke="var(--mut)" fill="none" strokeWidth={1.5} />
        )}
        <text
          x={x}
          y={y + (i % 2 ? -28 : 38)}
          textAnchor="middle"
          style={isCurrent ? { fill: 'var(--acc)', fontWeight: 700 } : undefined}
        >
          {m.title}
        </text>
      </g>,
    )
  })

  return (
    <svg className="dg-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Learning path: ${modules.map((m) => `${m.title} (${m.status})`).join(', ')}`}>
      <path d={d} fill="none" stroke="var(--line)" strokeWidth={4} strokeLinecap="round" />
      <path className="dg-jp" d={d} fill="none" stroke="var(--acc)" strokeWidth={4} strokeLinecap="round" pathLength={100} strokeDasharray={`${completedPct} 100`} />
      {nodes}
      {/* travelling glow that loops along the completed portion */}
      <circle r={5.5} fill="#fff" stroke="var(--acc)" strokeWidth={3} opacity={0} style={{ filter: 'drop-shadow(0 0 7px var(--acc))' }}>
        <animateMotion
          dur="3.4s"
          begin="2s"
          repeatCount="indefinite"
          keyPoints={`0;${completedPct / 100};${completedPct / 100}`}
          keyTimes="0;.8;1"
          calcMode="linear"
          path={d}
        />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.8;1" dur="3.4s" begin="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
