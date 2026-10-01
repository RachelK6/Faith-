import { apiFetch } from './client'

export type WeeklyProgressPoint = { label: string; pct: number }
export type GradeBand = { label: string; count: number }
export type PendingSubmission = { student_id: string; student_name: string; assignment: string; type: 'lab' | 'quiz'; submitted: string }

export type InstructorDashboardData = {
  enrolledCount: number
  enrolledDeltaThisWeek: number
  pendingReviewCount: number
  cohortAverageGradePct: number
  cohortAverageGradeDeltaPct: number
  atRiskCount: number
  weeklyProgress: { '8w': WeeklyProgressPoint[]; '12w': WeeklyProgressPoint[]; term: WeeklyProgressPoint[] }
  gradeDistribution: GradeBand[]
  pendingSubmissions: PendingSubmission[]
}

// Expected contract: GET /dashboard/instructor/ (instructor/admin, auth'd, scoped
// to the requesting instructor's current cohort) -> InstructorDashboardData.
// This endpoint does not exist yet — the current build hardcodes this content
// in the frontend (the "Dr. Kim" greeting bug, hardcoded pending submissions,
// hardcoded "falling behind" list). Build it server-side rather than deriving
// it ad hoc in the client so every instructor sees their own real numbers.
export async function getInstructorDashboard(): Promise<InstructorDashboardData> {
  return apiFetch<InstructorDashboardData>('/dashboard/instructor/')
}

export type GradeSubmissionPayload = { submissionId: string; score: number; feedback: string }

// Expected contract: POST /submissions/{id}/grade/ (instructor/admin) ->
// { ok: true }. Used by GradeModal. Confirm the real URL shape/field names
// against your Django serializer and adjust here rather than in the component.
export async function submitGrade(payload: GradeSubmissionPayload): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/submissions/${payload.submissionId}/grade/`, {
    method: 'POST',
    body: JSON.stringify({ score: payload.score, feedback: payload.feedback }),
  })
}
