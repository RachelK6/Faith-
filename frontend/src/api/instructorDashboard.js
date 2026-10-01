import { api } from '../lib/api.js'

export async function getInstructorDashboard() {
  return api.get('/dashboard/instructor/')
}

export async function submitGrade({ submissionId, score, feedback }) {
  return api.patch(`/submissions/${submissionId}/grade/`, {
    grade: Number(score),
    feedback,
  })
}
