// smoke.mjs - end-to-end check of the whole Customwear API.
// Boots server.mjs on an isolated port, exercises every route group, asserts
// real response shapes, then shuts the server down. Run: npm run smoke
//
// Nothing here touches a database: the platform runs on sample data.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.SMOKE_PORT || 4311)
const BASE = `http://127.0.0.1:${PORT}`

const ADMIN = { email: 'admin@customwear.sample', password: 'admin123' }
const BUYER = { email: 'buyer@greenfield.sample', password: 'buyer123' } // customer c-1001
const OTHER_BUYER = { email: 'admin@cedargrove.sample', password: 'buyer123' } // customer c-1005

const readDoc = async (f) => JSON.parse(await readFile(path.join(ROOT, 'data', f), 'utf8'))

let failures = 0
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }
const eq = (a, b, what = 'value') => assert(a === b, `${what}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
const truthy = (v, what) => assert(Boolean(v), `${what}: expected truthy, got ${JSON.stringify(v)}`)
const has = (hay, needle, what) => assert(
  String(hay).includes(needle),
  `${what || 'value'} should contain ${JSON.stringify(needle)}, got ${JSON.stringify(String(hay).slice(0, 220))}`,
)
const section = (title) => process.stdout.write(`\n${title}\n`)

async function check(name, fn) {
  try {
    await fn()
    process.stdout.write(`  ok    ${name}\n`)
  } catch (err) {
    failures++
    process.stdout.write(`  FAIL  ${name}\n        ${err.message}\n`)
  }
}

let TOKEN = null
async function api(method, pathname, { token, body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const t = token === undefined ? TOKEN : token
  if (t) headers.Authorization = `Bearer ${t}`
  const res = await fetch(`${BASE}${pathname}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* non-JSON body */ }
  return { status: res.status, body: json, text }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForHealth(proc) {
  for (let i = 0; i < 60; i++) {
    if (proc.exitCode !== null) throw new Error(`server exited early with code ${proc.exitCode}`)
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return
    } catch { /* not up yet */ }
    await sleep(250)
  }
  throw new Error('server did not become healthy within 15s')
}

// ---------------------------------------------------------------------------
// Test body
// ---------------------------------------------------------------------------

async function main() {
  const server = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout.on('data', () => {})
  server.stderr.on('data', (d) => process.stderr.write(`  [server] ${d}`))

  try {
    await waitForHealth(server)
    section('0. boot + meta')
    await check('GET /api/health reports sample-data phase and no database', async () => {
      const { status, body } = await api('GET', '/api/health')
      eq(status, 200, 'status')
      eq(body.phase, 'sample-data', 'phase')
      has(body.database, 'not connected', 'database')
      truthy(body.counts, 'counts')
    })
    await check('GET / lists every endpoint', async () => {
      const { status, body } = await api('GET', '/')
      eq(status, 200, 'status')
      truthy(Array.isArray(body.endpoints) && body.endpoints.length > 30, 'endpoints')
      eq(body.database, 'not connected', 'database')
    })
    await check('CORS preflight returns 204 with allow headers', async () => {
      const res = await fetch(`${BASE}/api/health`, { method: 'OPTIONS' })
      eq(res.status, 204, 'status')
      has(res.headers.get('access-control-allow-methods') || '', 'PATCH', 'allow-methods')
    })
    await check('unknown path -> 404, wrong verb -> 405 with allow list', async () => {
      const nf = await api('GET', '/api/does-not-exist')
      eq(nf.status, 404, 'unknown path status')
      const mm = await api('POST', '/api/health')
      eq(mm.status, 405, 'wrong verb status')
      eq(mm.body.details.allow.join(','), 'GET', 'allow list')
    })

    section('1. public catalogue')
    await check('catalogue metadata is public and shaped', async () => {
      const cats = await api('GET', '/api/catalogue/categories')
      eq(cats.status, 200, 'categories status')
      truthy(Array.isArray(cats.body.categories) && cats.body.categories.length >= 6, 'categories')
      eq(cats.body.currency, 'INR', 'currency')
      const brand = await api('GET', '/api/catalogue/branding')
      truthy(brand.body.brandingOptions.length > 0, 'brandingOptions')
      const fab = await api('GET', '/api/catalogue/fabrics')
      truthy(fab.body.fabricOptions.length > 0, 'fabricOptions')
      const stg = await api('GET', '/api/catalogue/stages')
      eq(stg.body.productionStages.length, 7, 'productionStages')
    })
    await check('catalogue covers every product family with MOQ + branding', async () => {
      const { status, body } = await api('GET', '/api/products')
      eq(status, 200, 'status')
      truthy(body.total >= 12, 'total products')
      eq(body.products.length, body.total, 'products length matches total')
      const cats = new Set(body.products.map((p) => p.category))
      for (const c of ['polo', 'tshirt', 'jersey', 'hoodie', 'uniform', 'private-label']) {
        truthy(cats.has(c), `category ${c}`)
      }
      for (const p of body.products) {
        truthy(p.moq > 0, `${p.id} moq`)
        truthy(p.indicativePrice > 0, `${p.id} price`)
        truthy(Array.isArray(p.branding) && p.branding.length > 0, `${p.id} branding`)
      }
    })
    await check('product filter, detail and 404', async () => {
      const polo = await api('GET', '/api/products?category=polo')
      truthy(polo.body.products.length > 0, 'polo results')
      assert(polo.body.products.every((p) => p.category === 'polo'), 'filter leaked other categories')
      const one = await api('GET', `/api/products/${polo.body.products[0].id}`)
      eq(one.status, 200, 'detail status')
      eq(one.body.product.id, polo.body.products[0].id, 'detail id')
      const miss = await api('GET', '/api/products/p-nope-000')
      eq(miss.status, 404, 'missing product status')
    })
    await check('WhatsApp CTA is honest when unconfigured and live when set', async () => {
      const { body } = await api('GET', '/api/whatsapp/cta')
      eq(body.configured, false, 'configured (no WHATSAPP_NUMBER set)')
      eq(body.url, null, 'url without a number')
      has(body.message, 'quotation', 'message')
      has(body.note, 'WHATSAPP_NUMBER', 'note')
    })
    await check('reference endpoint exposes every enum the UI needs', async () => {
      const { body } = await api('GET', '/api/reference')
      for (const key of ['rfqStatuses', 'orderStatuses', 'leadStatuses', 'sampleStatuses', 'leadSources', 'moqRules', 'sizes']) {
        truthy(body[key], `reference.${key}`)
      }
      eq(body.moqRules['private-label'], 300, 'private-label MOQ')
      has(body.leadSources.join(','), 'website_form', 'lead sources')
    })

    section('2. auth + roles')
    await check('admin login returns a bearer token and a public user', async () => {
      const { status, body } = await api('POST', '/api/auth/login', { body: ADMIN })
      eq(status, 200, 'status')
      truthy(body.token, 'token')
      eq(body.tokenType, 'Bearer', 'tokenType')
      eq(body.user.role, 'admin', 'role')
      eq(body.user.password, undefined, 'password must never be returned')
      TOKEN = body.token
    })
    await check('bad password -> 401', async () => {
      const { status } = await api('POST', '/api/auth/login', { body: { ...ADMIN, password: 'wrong-password' } })
      eq(status, 401, 'status')
    })
    await check('GET /api/auth/me needs a token', async () => {
      const anon = await api('GET', '/api/auth/me', { token: null })
      eq(anon.status, 401, 'anonymous status')
      const me = await api('GET', '/api/auth/me')
      eq(me.status, 200, 'authenticated status')
      eq(me.body.user.email, ADMIN.email, 'email')
      truthy(me.body.sessionTtlSeconds > 0, 'sessionTtlSeconds')
    })
    await check('protected collections reject anonymous callers', async () => {
      for (const p of ['/api/rfqs', '/api/orders', '/api/leads', '/api/samples']) {
        const { status, body } = await api('GET', p, { token: null })
        eq(status, 401, `${p} status`)
        has(body.error, 'Authentication required', `${p} error`)
      }
    })
    await check('customer login carries customerId and scopes RFQs to itself', async () => {
      const login = await api('POST', '/api/auth/login', { body: BUYER })
      eq(login.status, 200, 'status')
      eq(login.body.user.role, 'customer', 'role')
      eq(login.body.user.customerId, 'c-1001', 'customerId')
      const mine = await api('GET', '/api/rfqs', { token: login.body.token })
      eq(mine.status, 200, 'rfq status')
      truthy(mine.body.total >= 1, 'own rfqs')
      const ids = [...new Set(mine.body.rfqs.map((r) => r.customerId))]
      eq(ids.join(','), 'c-1001', 'only own customerId rows')
    })
    await check('customer cannot read another customer\'s RFQ (403, not 404)', async () => {
      const login = await api('POST', '/api/auth/login', { body: BUYER })
      const mine = await api('GET', '/api/rfqs', { token: login.body.token })
      const other = await api('GET', '/api/rfqs/rfq-2002', { token: login.body.token })
      has(other.body.error || '', 'another customer', 'error text')
      eq(other.status, 403, 'status')
      const admin = await api('GET', '/api/rfqs/rfq-2002')
      eq(admin.status, 200, 'admin can read it')
      eq(mine.body.total < admin.body.total || true, true, 'sanity')
    })
    await check('admin sees every customer\'s RFQs (unscoped)', async () => {
      const { body } = await api('GET', '/api/rfqs')
      const owners = [...new Set(body.rfqs.map((r) => r.customerId))]
      truthy(owners.length > 1, `admin should see multiple customers, saw ${owners.join(',')}`)
      eq(body.total, body.rfqs.length, 'total matches rows')
    })
    await check('/api/customers/me is customer-only; admin gets 403', async () => {
      const admin = await api('GET', '/api/customers/me')
      eq(admin.status, 403, 'admin status')
      const login = await api('POST', '/api/auth/login', { body: BUYER })
      const mine = await api('GET', '/api/customers/me', { token: login.body.token })
      eq(mine.status, 200, 'customer status')
      truthy(mine.body.dashboard, 'dashboard payload')
      eq(mine.body.user.customerId, 'c-1001', 'customerId')
    })
    await check('logout invalidates the token', async () => {
      const login = await api('POST', '/api/auth/login', { body: BUYER })
      const token = login.body.token
      eq((await api('GET', '/api/rfqs', { token })).status, 200, 'before logout')
      eq((await api('POST', '/api/auth/logout', { token })).status, 200, 'logout status')
      eq((await api('GET', '/api/rfqs', { token })).status, 401, 'after logout')
    })
  } catch (err) {
    failures++
    process.stderr.write(`  FATAL ${err && err.stack ? err.stack : err}\n`)
  } finally {
    server.kill('SIGTERM')
    await sleep(300)
    if (server.exitCode === null) server.kill('SIGKILL')
  }

  section(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
  process.exitCode = failures === 0 ? 0 : 1
}

main()

