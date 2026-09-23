// Thin fetch wrapper around your Django REST backend.
// Set VITE_API_URL in a .env file (see .env.example) to point at it,
// e.g. VITE_API_URL=https://api.optimumsystems.co.ke/api

const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api'

function isLocalhost(url: string) {
  try {
    const u = new URL(url)
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

// Security: refuse to send credentials/tokens over plain HTTP in production.
// Localhost is exempted so local dev against `manage.py runserver` still works.
export const isInsecureApiUrl = import.meta.env.PROD && RAW_BASE_URL.startsWith('http://') && !isLocalhost(RAW_BASE_URL)

const BASE_URL = RAW_BASE_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Access tokens live in memory only (cleared on refresh) plus a copy in
// localStorage so a reload doesn't force a re-login. The refresh token is
// the more sensitive of the two (longer-lived) — if your backend supports
// httpOnly refresh cookies instead of returning it in the JSON body, prefer
// that; this client falls back to localStorage when it's given one directly.
function getAccessToken() {
  return localStorage.getItem('access_token')
}
function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function hasSession() {
  return !!getAccessToken()
}

const REQUEST_TIMEOUT_MS = 15000

async function rawFetch(path: string, options: RequestInit, token: string | null): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

let refreshPromise: Promise<boolean> | null = null

// Expected contract: POST /auth/token/refresh/ { refresh } -> { access }
// (djangorestframework-simplejwt default). Dedupes concurrent refreshes so
// ten failed requests at once don't fire ten refresh calls.
async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await rawFetch('/auth/token/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) }, null)
        if (!res.ok) return false
        const data = await res.json()
        if (!data.access) return false
        setTokens(data.access, data.refresh)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

// Generic request helper. Throws ApiError on non-2xx responses so callers
// can show a real error message instead of silently falling back to fake data.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isInsecureApiUrl) {
    throw new ApiError(0, 'Refusing to send credentials over an insecure (http://) connection. Set VITE_API_URL to an https:// address.')
  }

  let res: Response
  try {
    res = await rawFetch(path, options, getAccessToken())
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'The server took too long to respond. Please try again.')
    }
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  // Access token expired: try one silent refresh, then retry the request once.
  if (res.status === 401 && getRefreshToken() && !path.startsWith('/auth/token')) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await rawFetch(path, options, getAccessToken())
    }
  }

  if (res.status === 401) {
    clearTokens()
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  if (!res.ok) {
    // Only surface the backend's own detail message for "your input was
    // wrong" errors. For anything else (server errors, unexpected shapes)
    // show a generic message instead of leaking internals to the UI.
    let detail = `Request failed (${res.status}).`
    if (res.status >= 400 && res.status < 500) {
      try {
        const body = await res.json()
        detail = body.detail || body.message || detail
      } catch {
        /* response wasn't JSON */
      }
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
