import { api } from '../lib/api.js'

/** GET /api/risk/cohort/ — every student across the instructor's (or, for
 * an admin, every) course, scored by the risk-engine and sorted highest-risk
 * first. See backend/apps/risk/services.py for how this is computed. */
export async function getCohortRisk() {
  return api.get('/risk/cohort/')
}

/** GET /api/risk/student/:studentId/course/:courseId/ — one student's risk
 * card. The backend returns 204 (no body) when there isn't enough weekly
 * history yet to score them — callers should treat that as "not scored",
 * not an error. */
export async function getStudentRisk(studentId, courseId) {
  return api.get(`/risk/student/${studentId}/course/${courseId}/`)
}
