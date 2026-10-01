import { useState } from 'react'
import Modal from './Modal.jsx'

export default function GradeModal({ open, onClose, studentName, assignmentTitle, maxScore = 10, onSubmit }) {
  const [score, setScore] = useState(Math.round(maxScore * 0.8))
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title={`Grade ${studentName || 'submission'}`}>
      <div className="dg-sub">{assignmentTitle}</div>
      <div className="dg-gv">
        <b>{score}</b>
        <span> / {maxScore}</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxScore}
        value={score}
        aria-label="Score"
        style={{ '--p': `${(score / maxScore) * 100}%` }}
        onChange={(e) => setScore(Number(e.target.value))}
      />
      <label htmlFor="gm-feedback">Feedback</label>
      <textarea
        id="gm-feedback"
        rows={3}
        placeholder="What went well, what to improve"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
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
