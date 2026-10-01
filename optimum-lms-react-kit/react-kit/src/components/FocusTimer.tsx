import { useEffect, useRef, useState } from 'react'
import { Ring } from './ui/Ring'
import { fmtTime } from './ui/chartMath'
import { useToast } from '../hooks/useToast'

const DURATION = 25 * 60

export function FocusTimer() {
  const [remaining, setRemaining] = useState(DURATION)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!)
          setRunning(false)
          toast('Focus session complete')
          return DURATION
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running, toast])

  const pct = ((DURATION - remaining) / DURATION) * 100

  return (
    <div className="dg-card dg-c4">
      <h3>Focus session</h3>
      <div className="dg-sub">25 minute sprint</div>
      <div style={{ margin: '8px 0 12px', display: 'grid', placeItems: 'center', color: 'var(--ink)', position: 'relative' }}>
        <Ring pct={pct} size={150} width={12} stroke="var(--acc)" track="var(--line)" label={fmtTime(remaining)} />
      </div>
      <div className="dg-bt" style={{ justifyContent: 'center', marginTop: 8 }}>
        <button className="dg-gb" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          className="dg-gb dg-g2"
          onClick={() => {
            setRunning(false)
            setRemaining(DURATION)
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
