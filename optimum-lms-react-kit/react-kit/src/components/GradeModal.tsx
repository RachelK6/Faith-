import { useState } from 'react'
import { Modal } from './ui/Modal'

export function GradeModal({
  open,
  onClose,
  studentName,
  assignmentTitle,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  studentName: string
  assignmentTitle: string
  onSubmit: (score: number, feedback: string) => Promise<void> | void
}) {
  const [score, setScore] = useState(80)
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title={`Grade ${studentName}`}>
      <div className="dg-sub">{assignmentTitle}</div>
      <div className="dg-gv">
        <b>{score}</b>
        <span> / 100</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={score}
        aria-label="Score"
        style={{ ['--p' as any]: `${score}%` }}
        onChange={(e) => setScore(Number(e.target.value))}
      />
      <label htmlFor="gf">Feedback</label>
      <textarea id="gf" rows={3} placeholder="What went well, what to improve" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <div className="dg-bt" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="dg-gb dg-g2" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="dg-gb"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onSubmit(score, feedback)
              onClose()
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Submitting…' : 'Submit grade'}
        </button>
      </div>
    </Modal>
  )
}
