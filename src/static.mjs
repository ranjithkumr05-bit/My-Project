// src/static.mjs — serve frontend/dist safely + SPA fallback with content negotiation.
// Only GET/HEAD. Only non-/api paths. API routes are handled before this module.
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
export const DIST_ROOT = process.env.FRONTEND_DIST || path.join(ROOT, 'frontend', 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

export const acceptsHtml = (req) => {
  const a = String(req.headers.accept || '')
  return a.includes('text/html') || a.includes('application/xhtml+xml')
}

/** Resolve a URL pathname inside dist; null = outside root (traversal). */
export const resolveDistPath = (pathname) => {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  const abs = path.normalize(path.join(DIST_ROOT, rel))
  if (abs !== DIST_ROOT && !abs.startsWith(DIST_ROOT + path.sep)) return null
  return abs
}

const sendFile = async (res, abs) => {
  const st = await stat(abs).catch(() => null)
  if (!st || !st.isFile()) return false
  const ext = path.extname(abs).toLowerCase()
  const body = await readFile(abs)
  const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': body.length }
  if (abs.includes(`${path.sep}assets${path.sep}`)) headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  else if (ext === '.html') headers['Cache-Control'] = 'no-cache'
  else headers['Cache-Control'] = 'public, max-age=3600'
  res.writeHead(200, headers)
  res.end(body)
  return true
}

export const serveStaticFile = (req, res, pathname) => sendFile(res, resolveDistPath(pathname) || '')

export const serveIndex = async (res) => {
  const body = await readFile(path.join(DIST_ROOT, 'index.html'))
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-cache' })
  res.end(body)
}

export const distHasIndex = async () => {
  const st = await stat(path.join(DIST_ROOT, 'index.html')).catch(() => null)
  return Boolean(st && st.isFile())
}
