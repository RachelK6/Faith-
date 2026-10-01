export function BarChart({ data, height = 170 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--mut)' }}>
          <div
            className="dg-gb2"
            data-tip={`${d.label}: ${d.value}`}
            style={{
              animationDelay: `${0.3 + i * 0.09}s`,
              height: `${((height - 26) * d.value) / max}px`,
              borderRadius: '9px 9px 4px 4px',
              background: 'linear-gradient(180deg,var(--acc),var(--a2))',
              marginBottom: 6,
            }}
          />
          {d.label}
        </div>
      ))}
    </div>
  )
}

/** Horizontal labelled progress bars, e.g. course-completion list. */
export function BarList({ data }: { data: { label: string; pct: number }[] }) {
  return (
    <>
      {data.map((d) => (
        <div key={d.label} style={{ margin: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <b>{d.label}</b>
            <span>{d.pct}%</span>
          </div>
          <div className="dg-bar" style={{ marginTop: 6, height: 10 }}>
            <i style={{ width: `${d.pct}%` }} />
          </div>
        </div>
      ))}
    </>
  )
}
