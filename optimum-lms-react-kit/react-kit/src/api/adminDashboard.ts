import { apiFetch } from './client'

export type GrowthPoint = { label: string; count: number }
export type CompletionRow = { label: string; pct: number }
export type HealthMetric = { label: string; pct: number }

export type AdminDashboardData = {
  totalStudents: number
  totalStudentsDeltaThisWeek: number
  liveCoursesCount: number
  launchingSoonCount: number
  activeEnrollmentsCount: number
  activeEnrollmentsDeltaThisMonth: number
  inactive7dCount: number
  inactive7dDeltaFromLastWeek: number
  completionRatePct: number
  onlineNowCount: number
  enrollmentGrowth: { '12mo': GrowthPoint[]; '6mo': GrowthPoint[]; '30d': GrowthPoint[] }
  usersByRole: { students: number; instructors: number; admins: number }
  courseCompletion: CompletionRow[]
  systemHealth: HealthMetric[]
}

// Expected contract: GET /dashboard/admin/ (admin only, auth'd) -> AdminDashboardData.
// New endpoint — doesn't exist yet. `onlineNowCount` can be a simple "sessions
// active in the last N minutes" count to start; a websocket/polling upgrade
// can come later without changing this contract.
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>('/dashboard/admin/')
}

export type NewUserPayload = { name: string; email: string; role: 'student' | 'instructor' | 'admin' }

// Expected contract: POST /users/ (admin only) -> the created user. Confirm
// field names against your Django user-creation serializer.
export async function createUser(payload: NewUserPayload): Promise<void> {
  await apiFetch<unknown>('/users/', { method: 'POST', body: JSON.stringify(payload) })
}
