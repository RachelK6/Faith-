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

async function request(path, { method = 'GET', body, auth = true, isFormData = false } = {}) {
  const headers = {}
  if (!isFormData) headers['Content-Type'] = 'application/json'

  if (auth) {
    const tokens = getTokens()
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }
  }

  const buildBody = () => (isFormData ? body : body ? JSON.stringify(body) : undefined)

  let res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: buildBody(),
  })

  if (res.status === 401 && auth) {
    const tokens = getTokens()
    if (tokens?.refresh && path !== '/auth/login/refresh/') {
      const refreshResponse = await fetch(`${API_URL}/auth/login/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })
      const refreshed = await refreshResponse.json().catch(() => null)
      if (refreshResponse.ok && refreshed?.access) {
        const updatedTokens = { ...tokens, ...refreshed }
        setTokens(updatedTokens)
        headers.Authorization = `Bearer ${updatedTokens.access}`
        res = await fetch(`${API_URL}${path}`, {
          method,
          headers,
          body: buildBody(),
        })
      }
    }

    if (res.status === 401) {
      clearTokens()
      window.location.href = '/login'
      return null
    }
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail || Object.values(data || {})[0] || 'Request failed'
    throw new Error(Array.isArray(message) ? message[0] : message)
  }

  return data
}

export const api = {
  login: (email, password) =>
    request('/auth/login/', { method: 'POST', body: { email, password }, auth: false }),

  logout: (refresh) =>
    request('/auth/logout/', { method: 'POST', body: { refresh } }),

  register: (payload) =>
    request('/auth/register/', { method: 'POST', body: payload, auth: false }),

  me: () => request('/auth/me/'),

  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),

  // File uploads (PDFs, etc.) — must NOT set Content-Type manually; the
  // browser sets it (including the multipart boundary) when the body is
  // a real FormData object. Setting it ourselves breaks the upload.
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
}

export { getTokens, setTokens, clearTokens, decodeToken }
