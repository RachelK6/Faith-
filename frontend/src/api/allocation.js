import { api } from '../lib/api.js'

/** GET /api/allocation/recommendations/ — admin only. Instructor load
 * scores and rebalancing recommendations. See
 * backend/apps/allocation/services.py for the full algorithm. */
export async function getAllocationPlan() {
  return api.get('/allocation/recommendations/')
}
