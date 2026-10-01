// Pure geometry helpers, ported from the optimum-lms-dashboards.html reference.
// No dependencies — every chart component in this folder is hand-drawn SVG.

let uidCounter = 0
export function uid(prefix = 'g') {
  uidCounter += 1
  return `${prefix}${uidCounter}`
}

/** Smooth cubic-bezier path through evenly-spaced points, plus a closed "fill" variant down to the baseline. */
export function smoothPath(values: number[], w: number, h: number, pad = 6) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const n = values.length
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(n - 1, 1)
  const y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad)
  let d = `M${x(0)} ${y(values[0])}`
  for (let i = 1; i < n; i++) {
    const cx = (x(i - 1) + x(i)) / 2
    d += `C${cx} ${y(values[i - 1])} ${cx} ${y(values[i])} ${x(i)} ${y(values[i])}`
  }
  const fill = `${d}L${x(n - 1)} ${h}L${x(0)} ${h}Z`
  return { d, fill, x, y }
}

/** Points for a radar/spider chart polygon. */
export function radarPoint(i: number, n: number, k: number, cx: number, cy: number, r: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
  return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k] as const
}

export const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
