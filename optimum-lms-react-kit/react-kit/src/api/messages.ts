import { apiFetch } from './client'

export type SendMessagePayload = { toStudentId?: string; toRole?: 'instructor' | 'class'; body: string }

// Expected contract: POST /messages/ (auth'd) -> { ok: true }. Adjust the
// payload shape to whatever messaging/announcements system already exists
// on the Django side; if none exists yet, this is a good minimum shape to
// build against (a single recipient OR a broadcast target, plus a body).
export async function sendMessage(payload: SendMessagePayload): Promise<void> {
  await apiFetch<{ ok: boolean }>('/messages/', { method: 'POST', body: JSON.stringify(payload) })
}
