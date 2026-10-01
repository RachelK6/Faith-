import { api } from '../lib/api.js'

export async function fetchStudentDashboardData() {
  const [dashboard, student, engagement] = await Promise.all([
    api.get('/dashboard/student/'),
    api.me(),
    api.get('/engagement/me/').catch(() => null),
  ])

  return { ...dashboard, student, engagement }
}
