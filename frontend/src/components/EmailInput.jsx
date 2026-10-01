import { Mail } from 'lucide-react'

/** Email field tuned so phones don't capitalise the first letter ("Ann@…") or autocorrect it. */
export default function EmailInput({ id = 'email', label = 'Email address', value, onChange, placeholder = 'you@optimum.co.ke', autoFocus = false }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-secondary">{label}</label>
      <div className="relative">
        <Mail size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          id={id}
          type="email"
          inputMode="email"
          required
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-secondary outline-none transition focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}
