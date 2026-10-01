import { useState } from 'react'
import { Modal } from './ui/Modal'

export function ComposeModal({
  open,
  onClose,
  title,
  placeholder = 'Write something…',
  onSend,
}: {
  open: boolean
  onClose: () => void
  title: string
  placeholder?: string
  onSend: (message: string) => Promise<void> | void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <label htmlFor="cf">Message</label>
      <textarea id="cf" rows={4} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="dg-bt" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        <button className="dg-gb dg-g2" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="dg-gb"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true)
            try {
              await onSend(text)
              setText('')
              onClose()
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </Modal>
  )
}
