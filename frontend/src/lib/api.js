/**
 * Single point of contact with the Django backend.
 * - Reads the API base URL from env (VITE_API_URL), so dev/staging/prod
 *   just swap .env files instead of editing code.
 * - Attaches the JWT access token to every request automatically.
 * - On a 401, clears stored tokens and forces a redirect to /login —
 *   so an expired/invalid token can't leave the app in a broken half-
 *   logged-in state.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function getTokens() {
  const raw = localStorage.getItem('auth')
  return raw ? JSON.parse(raw) : null
}

function setTokens(tokens) {
  localStorage.setItem('auth', JSON.stringify(tokens))
}

function clearTokens() {
  localStorage.removeItem('auth')
}

/**
 * Decode a JWT payload without verifying it (verification happens
 * server-side on every request — this is purely for reading the role/
 * email client-side to decide where to route the user).
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code // machine-readable backend error code
    this.data = data
  }
}

// Refresh tokens rotate and the old one is blacklisted, so two requests that
// hit 401 at the same moment must share ONE refresh call — otherwise the second
// uses an already-blacklisted token, fails, and the user is logged out.
let refreshInFlight = null
function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const tokens = getTokens()
      if (!tokens?.refresh) return null
      const res = await fetch(`${API_URL}/auth/login/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })
      const refreshed = await res.json().catch(() => null)
      if (!res.ok || !refreshed?.access) return null
      const updated = { ...tokens, ...refreshed }
      setTokens(updated)
      return updated.access
    })().finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

/** Flatten DRF error bodies ({field: [msgs]} | {detail}) into one readable string. */
function errorMessage(data) {
  if (!data) return 'Request failed'
  if (typeof data === 'string') return data
  if (data.detail) return typeof data.detail === 'string' ? data.detail : errorMessage(data.detail)
  const parts = []
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    else if (v) parts.push(String(v))
  }
  walk(data)
  return parts.join(' ') || 'Request failed'
}

async function request(path, { method = 'GET', body, auth = true, isFormData = false, blob = false, keepalive = false } = {}) {
  const headers = {}
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (auth) {
    const tokens = getTokens()
    if (tokens?.access) headers.Authorization = `Bearer ${tokens.access}`
  }
  const buildBody = () => (isFormData ? body : body ? JSON.stringify(body) : undefined)
  const send = () => fetch(`${API_URL}${path}`, { method, headers, body: buildBody(), keepalive })

  let res = await send()

  if (res.status === 401 && auth) {
    const access = await refreshAccessToken()
    if (access) {
      headers.Authorization = `Bearer ${access}`
      res = await send()
    }
    if (res.status === 401) {
      clearTokens()
      window.location.href = '/login'
      return null
    }
  }

  if (blob && res.ok) return res.blob()

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(errorMessage(data), { status: res.status, code: data?.code, data })
  }
  return data
}

/** Download a protected file (needs the auth header, so a plain <a href> can't do it). */
async function downloadFile(path, filename) {
  const blob = await request(path, { blob: true })
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  if (filename) a.download = filename
  else a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const api = {
  login: (email, password) =>
    request('/auth/login/', { method: 'POST', body: { email, password }, auth: false }),

  logout: (refresh) =>
    request('/auth/logout/', { method: 'POST', body: { refresh } }),

  register: (payload) =>
    request('/auth/register/', { method: 'POST', body: payload, auth: false }),

  verifyEmail: (uid, token) =>
    request('/auth/email/verify/', { method: 'POST', body: { uid, token }, auth: false }),

  resendVerification: (email) =>
    request('/auth/email/resend-verification/', { method: 'POST', body: { email }, auth: false }),

  requestPasswordReset: (email) =>
    request('/auth/password-reset/', { method: 'POST', body: { email }, auth: false }),

  confirmPasswordReset: (payload) =>
    request('/auth/password-reset/confirm/', { method: 'POST', body: payload, auth: false }),

  me: () => request('/auth/me/'),

  get: (path) => request(path),
  getBlob: (path) => request(path, { blob: true }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  download: downloadFile,
  del: (path) => request(path, { method: 'DELETE' }),

  // File uploads (PDFs, etc.) — must NOT set Content-Type manually; the
  // browser sets it (including the multipart boundary) when the body is
  // a real FormData object. Setting it ourselves breaks the upload.
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
}

export { getTokens, setTokens, clearTokens, decodeToken }
