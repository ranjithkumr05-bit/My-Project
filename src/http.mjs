// src/http.mjs - tiny HTTP helpers: JSON responses, body parsing, CORS, errors.
export const MAX_BODY_BYTES = 256 * 1024

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details)
export const unauthorized = (msg = 'Authentication required') => new ApiError(401, msg)
export const forbidden = (msg = 'Not allowed for this role') => new ApiError(403, msg)
export const notFound = (msg = 'Not found') => new ApiError(404, msg)
export const unprocessable = (msg, details) => new ApiError(422, msg, details)

export function applyCors(res, req) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Max-Age', '600')
}

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

export function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new ApiError(413, `Request body larger than ${MAX_BODY_BYTES} bytes`))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('error', reject)
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      const raw = Buffer.concat(chunks).toString('utf8')
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(badRequest('Body must be valid JSON'))
      }
    })
  })
}

export function parseQuery(url) {
  const q = {}
  for (const [k, v] of url.searchParams.entries()) q[k] = v
  return q
}

export const nowIso = () => new Date().toISOString()
