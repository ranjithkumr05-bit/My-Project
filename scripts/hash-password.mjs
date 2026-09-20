#!/usr/bin/env node
/**
 * hash-password.mjs - produce a scrypt hash for a demo account password.
 *
 *   node scripts/hash-password.mjs "my-password"
 *   npm run hash-password -- "my-password"
 *
 * Copy the printed `scrypt$...` value into data/accounts.json. src/auth.mjs
 * accepts either that format (hashed, preferred) or a plain string (accepted
 * only because this phase ships fictional sample accounts).
 */
import { randomBytes, scryptSync } from 'node:crypto'

const N = 16384, r = 8, p = 1, KEYLEN = 32

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = scryptSync(String(password), salt, KEYLEN, { N, r, p }).toString('hex')
  return `scrypt$${N}$${r}$${p}$${salt}$${key}`
}

export function verifyPassword(password, stored) {
  const parts = String(stored).split('$')
  if (parts[0] !== 'scrypt' || parts.length !== 6) return String(password) === String(stored)
  const [, n, rr, pp, salt, key] = parts
  const derived = scryptSync(String(password), salt, key.length / 2, { N: Number(n), r: Number(rr), p: Number(pp) }).toString('hex')
  return derived === key
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href
if (isMain || process.argv[1]?.endsWith('hash-password.mjs')) {
  const pw = process.argv[2]
  if (!pw) {
    console.error('Usage: node scripts/hash-password.mjs "your password"')
    process.exit(1)
  }
  console.log(hashPassword(pw))
}
