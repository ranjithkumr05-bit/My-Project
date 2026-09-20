// src/auth.mjs - demo session auth. Tokens live in memory and expire.
// This is intentionally simple: swap login()/currentUser() for a real provider
// (n8n, Auth0, Supabase, a JWT issuer) without touching route handlers.
import { randomUUID } from 'node:crypto'
import { store } from './store.mjs'
import { verifyPassword } from './password.mjs'
import { unauthorized, forbidden } from './http.mjs'

const SESSIONS = new Map()
export const SESSION_TTL_SECONDS = 8 * 60 * 60

export function toPublicUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export function login(email, password) {
  const needle = String(email || '').trim().toLowerCase()
  const user = store.users.find((u) => String(u.email).toLowerCase() === needle)
  if (!user || !verifyPassword(password, user.password)) return null
  const token = randomUUID()
  SESSIONS.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })
  return { token, tokenType: 'Bearer', expiresIn: SESSION_TTL_SECONDS, user: toPublicUser(user) }
}

export function logout(token) {
  return SESSIONS.delete(token)
}

export function currentUser(req) {
  const header = req.headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) return null
  const session = SESSIONS.get(match[1])
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    SESSIONS.delete(match[1])
    return null
  }
  return store.users.find((u) => u.id === session.userId) || null
}

export function requireAuth(req) {
  const user = currentUser(req)
  if (!user) throw unauthorized()
  return user
}

export function requireRole(req, role) {
  const user = requireAuth(req)
  if (user.role !== role) throw forbidden(`This endpoint requires the "${role}" role`)
  return user
}

/** Customers may only read their own records; admins read everything. */
export function scopeToUser(user, records, field = 'customerId') {
  if (user.role === 'admin') return records
  return records.filter((r) => r[field] === user.customerId)
}

export function sessionCount() {
  return SESSIONS.size
}
