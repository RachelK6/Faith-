import { useState } from 'react'
import { Eye, EyeOff, Lock, TriangleAlert } from 'lucide-react'

/**
 * Password field: show/hide toggle, Caps Lock warning, and settings that stop
 * phones from capitalising / autocorrecting what people type.
 */
export default function PasswordInput({ id, label, value, onChange, autoComplete = 'current-password', placeholder = '••••••••', required = true, describedBy, extra, labelClassName = 'text-xs font-medium text-text-secondary' }) {
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const track = (e) => setCaps(e.getModifierState?.('CapsLock') ?? false)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className={labelClassName}>{label}</label>
        {extra}
      </div>
      <div className="relative">
        <Lock size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          onKeyDown={track}
          onKeyUp={track}
          onBlur={() => setCaps(false)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={describedBy}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-10 pr-11 text-sm text-text-primary placeholder:text-text-secondary outline-none transition focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {caps && (
        <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <TriangleAlert size={13} aria-hidden="true" /> Caps Lock is on — passwords are case-sensitive.
        </p>
      )}
    </div>
  )
}
