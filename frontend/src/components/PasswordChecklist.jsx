import { Check, Circle } from 'lucide-react'
import { checkPassword } from '../lib/passwordRules.js'

/** Live checklist of the password rules; announces nothing until the user starts typing. */
export default function PasswordChecklist({ password, id }) {
  const { results } = checkPassword(password)
  return (
    <ul id={id} className="mt-2 grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {results.map((r) => {
        const touched = password.length > 0
        return (
          <li key={r.id} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-700' : touched ? 'text-red-600' : 'text-text-secondary'}`}>
            {r.ok ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
            <span>{r.label}</span>
            <span className="sr-only">{r.ok ? '— met' : '— not met'}</span>
          </li>
        )
      })}
    </ul>
  )
}
