import { apiFetch } from './client'

export type CourseModule = { id: string; title: string; status: 'done' | 'current' | 'locked' }

// Expected contract: GET /courses/current/modules/ (student, auth'd) ->
// CourseModule[] for the student's active course, in order. Drives the
// learning-path visual and the "Module N of M" text — derive both from
// this single list rather than hardcoding the count separately (this was
// the "Module 3 / 9" vs "3 of 8" inconsistency bug in the previous build).
export async function getCurrentCourseModules(): Promise<CourseModule[]> {
  return apiFetch<CourseModule[]>('/courses/current/modules/')
}

export type LessonVideo = { id: string; title: string; source: string; video_url: string }

// Expected contract: GET /lessons/{id}/ -> must include `video_url`.
export async function getLesson(lessonId: string): Promise<LessonVideo> {
  return apiFetch<LessonVideo>(`/lessons/${lessonId}/`)
}

// Expected contract: PATCH /lessons/{id}/ (instructor/admin only) ->
// updated lesson. Used by the instructor's "attach a YouTube link" flow.
export async function updateLessonVideo(lessonId: string, video_url: string): Promise<void> {
  await apiFetch<unknown>(`/lessons/${lessonId}/`, { method: 'PATCH', body: JSON.stringify({ video_url }) })
}
