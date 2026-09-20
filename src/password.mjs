// src/password.mjs - scrypt password hashing (Node built-ins only).
// Format: scrypt$N$r$p$salt$key   |   verifyPassword also accepts a plain
// string so early sample data keeps working during the demo phase.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 }

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt}$${key.toString('hex')}`
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$')
  if (parts[0] !== 'scrypt' || parts.length !== 6) return String(password) === String(stored)
  const [, n, r, p, salt, key] = parts
  const expected = Buffer.from(key, 'hex')
  let derived
  try {
    derived = scryptSync(String(password), salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) })
  } catch {
    return false
  }
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
