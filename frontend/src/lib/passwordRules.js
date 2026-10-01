// Mirrors backend/apps/accounts/validators.py + Django's built-in validators.
// The server is the authority; this only gives instant feedback.
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'An uppercase letter (A–Z)', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: 'A lowercase letter (a–z)', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'digit', label: 'A number (0–9)', test: (p) => /\d/.test(p) },
  { id: 'edge', label: 'No space at the start or end', test: (p) => p.length === 0 || p === p.trim() },
]

export function checkPassword(password) {
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }))
  return { results, valid: password.length > 0 && results.every((r) => r.ok) }
}
