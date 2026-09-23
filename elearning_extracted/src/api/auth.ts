import { apiFetch, setTokens, clearTokens } from './client'

export type Role = 'student' | 'instructor' | 'admin'

export type CurrentUser = {
  id: number
  name: string
  email: string
  role: Role
  studentId?: string
}

// Adjust these paths to match your Django REST + SimpleJWT setup if different.
// Expected contract:
//   POST /auth/token/   { email, password } -> { access, refresh }
//   GET  /auth/me/       (auth'd)            -> CurrentUser
export async function login(email: string, password: string): Promise<CurrentUser> {
  const tokens = await apiFetch<{ access: string; refresh: string }>('/auth/token/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setTokens(tokens.access, tokens.refresh)
  return getCurrentUser()
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/auth/me/')
}

export function logout() {
  clearTokens()
}
