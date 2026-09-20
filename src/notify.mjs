// src/notify.mjs - fire-and-forget event bus. Every state change is appended to
// an in-memory log and, when EVENTS_WEBHOOK_URL is set, POSTed to n8n (or any
// webhook) so automations can react. Failures NEVER break a request.
// No database, no dependencies.
import { nowIso } from './http.mjs'

export const EVENTS = []
const MAX_EVENTS = 200
const WEBHOOK = process.env.EVENTS_WEBHOOK_URL || ''

export const webhookConfigured = () => Boolean(WEBHOOK)

export async function emit(type, payload = {}) {
  const event = { id: `evt-${EVENTS.length + 1}`, type, at: nowIso(), payload }
  EVENTS.unshift(event)
  if (EVENTS.length > MAX_EVENTS) EVENTS.length = MAX_EVENTS
  if (WEBHOOK) {
    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5000),
      })
      event.webhookStatus = res.status
    } catch (e) {
      event.webhookError = String(e?.message || e)
    }
  }
  return event
}
