import { api } from '../lib/api.js'

export async function createMessage(payload) {
  return api.post('/messages/', payload)
}
