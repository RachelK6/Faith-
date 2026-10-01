export function Skeleton({ height = 120 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--line), color-mix(in srgb, var(--line) 40%, var(--card)), var(--line))',
        backgroundSize: '200% 100%',
        animation: 'dg-skel 1.3s ease-in-out infinite',
      }}
    />
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '10px 0', color: 'var(--mut)', fontSize: 13 }}>
      <p style={{ margin: '0 0 8px' }}>{message}</p>
      <button className="dg-gb dg-g2" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p style={{ color: 'var(--mut)', fontSize: 13 }}>{message}</p>
}

// Add once globally (e.g. in dashboard-tokens.css) — included here as a
// runtime-injected fallback so Skeleton works even if you forget to copy it.
if (typeof document !== 'undefined' && !document.getElementById('dg-skel-kf')) {
  const style = document.createElement('style')
  style.id = 'dg-skel-kf'
  style.textContent = '@keyframes dg-skel{0%{background-position:200% 0}100%{background-position:-200% 0}}'
  document.head.appendChild(style)
}
