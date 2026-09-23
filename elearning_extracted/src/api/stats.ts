import { apiFetch } from './client'

export type PlatformStats = {
  courses: number
  students: number
  modules: number
  instructors: number
}

// Expected contract: GET /stats/overview/ -> PlatformStats
// This endpoint is public (no auth) since it powers the landing page.
export async function getPlatformStats(): Promise<PlatformStats> {
  return apiFetch<PlatformStats>('/stats/overview/')
}
