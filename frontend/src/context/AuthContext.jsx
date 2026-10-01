import { useState, useCallback } from 'react'
import { api, getTokens, setTokens, clearTokens, decodeToken } from '../lib/api.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const tokens = getTokens()
    if (tokens?.access === 'mock-jwt-token' || tokens?.refresh === 'mock-jwt-refresh') {
      clearTokens()
      return null
    }
    if (!tokens?.access && !tokens?.refresh) return null
    // The access token only lives 15 minutes; the refresh token lives 7 days.
    // If only the access token has expired, keep the session: the first API
    // call refreshes it transparently. Only a dead refresh token means "logged out".
    const now = Date.now()
    const live = [tokens.access, tokens.refresh]
      .map((t) => (t ? decodeToken(t) : null))
      .filter((p) => p && p.exp * 1000 > now)
    if (!live.length) {
      clearTokens()
      return null
    }
    return { role: live[0].role, email: live[0].email }
  })

  const login = useCallback(async (email, password) => {
    const tokens = await api.login(email, password)
    setTokens(tokens)
    const payload = decodeToken(tokens.access)
    const session = { role: payload.role, email: payload.email }
    setAuth(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    const tokens = getTokens()
    try {
      if (tokens?.refresh) {
        try {
          await api.logout(tokens.refresh)
        } catch {
          // Ignore backend logout failures and still clear the client session.
        }
      }
    } finally {
      clearTokens()
      setAuth(null)

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
