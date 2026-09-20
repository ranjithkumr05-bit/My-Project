// server.mjs - dependency-free HTTP server for the Customwear platform API.
// Phase: SAMPLE DATA. No database is connected (see README.md). Set PERSIST=1
// to write mutations to data/runtime.json, or leave it unset for pure memory.
import http from 'node:http'
import { routes, statusOf, STATUS } from './src/routes.mjs'
import { ApiError, applyCors, parseQuery, readJson, sendJson } from './src/http.mjs'
import { EVENTS, webhookConfigured } from './src/notify.mjs'
import { sessionCount } from './src/auth.mjs'
import { counts, PERSIST } from './src/store.mjs'

const PORT = Number(process.env.PORT || 4300)
const HOST = process.env.HOST || '0.0.0.0'

/** Turn '/api/rfqs/:id/status' into a regex plus the ordered param names. */
const compile = (template) => {
  const names = []
  const body = template.replace(/:[A-Za-z0-9_]+/g, (m) => { names.push(m.slice(1)); return '([^/]+)' })
  return { re: new RegExp(`^${body}/?$`), names }
}

const table = routes.map((route) => ({ ...route, ...compile(route.path) }))

/** First path match wins; a path match with the wrong verb yields 405. */
const resolve = (method, pathname) => {
  let pathMatched = false
  for (const route of table) {
    const m = route.re.exec(pathname)
    if (!m) continue
    pathMatched = true
    if (route.method !== method) continue
    const params = Object.fromEntries(route.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]))
    return { route, params }
  }
  return pathMatched ? { methodMismatch: true } : null
}

const allowFor = (pathname) => [...new Set(table.filter((r) => r.re.test(pathname)).map((r) => r.method))].sort()

const index = () => ({
  name: 'Customwear platform API',
  phase: 'sample-data',
  database: 'not connected',
  persistence: PERSIST ? 'data/runtime.json' : 'in-memory only',
  counts: counts(),
  webhookConfigured: webhookConfigured(),
  endpoints: table.map((r) => `${r.method} ${r.path}`).sort(),
})

async function handle(req, res) {
  const started = Date.now()
  applyCors(res, req)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  let status = 500
  try {
    if (url.pathname === '/' || url.pathname === '/api') {
      status = 200
      sendJson(res, status, index())
      return
    }
    const hit = resolve(req.method, url.pathname)
    if (!hit) throw new ApiError(404, `No route for ${req.method} ${url.pathname}`, { hint: 'GET / lists every endpoint' })
    if (hit.methodMismatch) throw new ApiError(405, `${req.method} is not allowed on ${url.pathname}`, { allow: allowFor(url.pathname) })

    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readJson(req) : {}
    const result = await hit.route.handler({ req, res, params: hit.params, query: parseQuery(url), body })
    const wrapped = statusOf(result)
    status = wrapped ? wrapped[STATUS] : 200
    sendJson(res, status, wrapped ? wrapped.data : result)
  } catch (err) {
    if (err instanceof ApiError) {
      status = err.status
      sendJson(res, status, { error: err.message, status, details: err.details ?? null })
    } else {
      console.error('[error]', err)
      status = 500
      sendJson(res, status, { error: 'Internal server error', status, detail: String(err?.message || err) })
    }
  } finally {
    console.log(`${req.method} ${url.pathname} -> ${status} (${Date.now() - started}ms)`)
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error('[fatal]', err)
    try { sendJson(res, 500, { error: 'Internal server error' }) } catch { /* headers already sent */ }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Customwear API listening on http://localhost:${PORT} (bound ${HOST})`)
  if (HOST === '0.0.0.0') console.log('LAN access: use this machine\'s IPv4 address with the same port.')
  console.log(`Routes: ${routes.length} | sessions: ${sessionCount()} | webhook: ${webhookConfigured() ? 'configured' : 'not configured'}`)
  console.log(`Database: NOT connected (sample data). Events so far: ${EVENTS.length}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} received - shutting down.`)
    server.close(() => process.exit(0))
  })
}
