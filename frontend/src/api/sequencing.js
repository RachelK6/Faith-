import { api } from '../lib/api.js'

/** GET /api/sequencing/me/ — the logged-in student's personalized
 * next-step recommendation per enrolled course. See
 * backend/apps/sequencing/services.py for the mastery-based logic. */
export async function getMySequencing() {
  return api.get('/sequencing/me/')
}
