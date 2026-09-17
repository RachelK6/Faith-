import { useState, useCallback } from 'react'
import { api, getTokens, setTokens, clearTokens, decodeToken } from '../lib/api.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const tokens = getTokens()
    if (!tokens?.access) return null
    const payload = decodeToken(tokens.access)
    if (!payload) return null
    // exp is in seconds since epoch; if the access token has expired,
    // don't trust it — treat as logged out rather than showing a role
    // that's no longer valid.
    if (payload.exp * 1000 < Date.now()) return null
    return { role: payload.role, email: payload.email }
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
      if (tokens?.refresh) await api.logout(tokens.refresh)
    } finally {
      clearTokens()
      setAuth(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
