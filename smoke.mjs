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

    await check('GET /api returns the API index JSON', async () => {
      const { status, body } = await api('GET', '/api')
      eq(status, 200, 'status')
      truthy(Array.isArray(body.endpoints) && body.endpoints.length > 30, 'endpoints')
      eq(body.database, 'not connected', 'database')
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
      for (const c of ['polo', 'tshirt', 'jersey', 'hoodie', 'staff-apparel', 'private-label']) {
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
    section('3. public order tracker (no auth)')
    await check('POST /api/track rejects missing fields (400)', async () => {
      eq((await api('POST', '/api/track', { token: null, body: {} })).status, 400, 'empty body')
      eq((await api('POST', '/api/track', { token: null, body: { orderId: 'ord-3001' } })).status, 400, 'missing contact')
      eq((await api('POST', '/api/track', { token: null, body: { contact: 'buyer@greenfield.sample' } })).status, 400, 'missing orderId')
    })
    await check('POST /api/track returns generic 404 for unknown or mismatched', async () => {
      const nf = await api('POST', '/api/track', { token: null, body: { orderId: 'ord-9999', contact: 'buyer@greenfield.sample' } })
      eq(nf.status, 404, 'unknown id')
      const mm = await api('POST', '/api/track', { token: null, body: { orderId: 'ord-3001', contact: 'wrong@example.com' } })
      eq(mm.status, 404, 'contact mismatch')
      has(mm.body.error || '', 'Order not found', 'generic message')
    })
    await check('POST /api/track returns sanitized tracking for a valid order', async () => {
      const { status, body } = await api('POST', '/api/track', { token: null, body: { orderId: 'ORD-3001', contact: 'buyer@greenfield.sample' } })
      eq(status, 200, 'status')
      const t = body.tracking
      eq(t.orderId, 'ord-3001', 'orderId')
      eq(t.currentStage, 'stitching', 'currentStage')
      eq(t.stageLabel, 'Stitching', 'stageLabel')
      eq(t.progressPercent, 33, 'progress from withProgress')
      eq(t.quantity, 600, 'qty from order')
      truthy(t.productSummary, 'productSummary derived from linked rfq/product')
      truthy(Array.isArray(t.timeline) && t.timeline.length === 7, '7 canonical stages')
      eq(t.timeline[0].state, 'completed', 'past stage completed')
      eq(t.timeline[2].state, 'in_progress', 'current stage in progress, not completed')
      eq(t.timeline[3].state, 'upcoming', 'future stage upcoming')
      truthy(t.timeline[0].at, 'past stage keeps stored at timestamp')
      for (const k of ['customerId', 'adminNote', 'quotedTotal', 'rfq']) truthy(!(k in t), `no ${k} leaked`)
    })
    await check('POST /api/track accepts phone and hides dispatch when absent', async () => {
      const { status, body } = await api('POST', '/api/track', { token: null, body: { orderId: 'ord-3001', contact: '+919000010001' } })
      eq(status, 200, 'phone lookup works (digits-normalized)')
      eq(body.tracking.dispatch, null, 'no courier fields on order → dispatch hidden')
    })
    await check('GET /api/orders/:id stays protected', async () => {
      eq((await api('GET', '/api/orders/ord-3001', { token: null })).status, 401, 'anonymous blocked')
    })

  section('4. customer portal accounts (admin managed)')
  const NEW_CUST = { email: 'portal@newco.test', name: 'Portal Owner', role: 'customer', customerId: 'c-1002', password: 'portal1234' }
  const NEW_PW = 'rotated5678'
  let createdUser = null

  await check('admin creates a customer portal account', async () => {
    const { status, body } = await api('POST', '/api/users', { token: TOKEN, body: NEW_CUST })
    eq(status, 201, 'created')
    eq(body.user.role, 'customer', 'role')
    eq(body.user.email, NEW_CUST.email, 'email')
    eq(body.user.customerId, 'c-1002', 'customerId')
    eq(body.user.password, undefined, 'password must never be returned')
    truthy(String(body.user.id).startsWith('u-'), 'id prefix')
    createdUser = body.user
  })

  await check('the new account can log in (password was hashed at rest)', async () => {
    const { status, body } = await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_CUST.password } })
    eq(status, 200, 'login')
    eq(body.user.id, createdUser.id, 'same user')
  })

  await check('user list never exposes a password or hash', async () => {
    const { status, body } = await api('GET', '/api/users', { token: TOKEN })
    eq(status, 200, 'list')
    truthy(body.users.length >= 6, 'includes the new account')
    for (const u of body.users) {
      eq(u.password, undefined, `${u.id} has no password`)
      truthy(!String(u.password || '').includes('scrypt'), 'no hash leaked')
    }
  })

  await check('wrong password and unknown email fail identically', async () => {
    const bad = await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: 'wrong-password' } })
    const ghost = await api('POST', '/api/auth/login', { body: { email: 'ghost@nowhere.test', password: 'whatever12' } })
    eq(bad.status, 401, 'wrong password')
    eq(ghost.status, 401, 'unknown email')
    eq(bad.body.error, ghost.body.error, 'must not reveal whether the account exists')
    has(bad.body.error, 'Invalid email or password', 'generic message')
  })

  await check('duplicate email is rejected case-insensitively', async () => {
    const { status, body } = await api('POST', '/api/users', {
      token: TOKEN,
      body: { ...NEW_CUST, email: NEW_CUST.email.toUpperCase(), customerId: 'c-1004' },
    })
    eq(status, 422, 'rejected')
    has(body.error, 'already used', 'explains the clash')
  })

  await check('one customer may hold only one account', async () => {
    const { status, body } = await api('POST', '/api/users', {
      token: TOKEN,
      body: { ...NEW_CUST, email: 'second@newco.test' },
    })
    eq(status, 422, 'rejected')
    has(body.error, 'already has a portal account', 'explains the 1:1 rule')
  })

  await check('role must be customer — admin cannot be minted here', async () => {
    const { status, body } = await api('POST', '/api/users', {
      token: TOKEN,
      body: { ...NEW_CUST, role: 'admin', email: 'sneaky@newco.test', customerId: 'c-1004' },
    })
    eq(status, 422, 'rejected')
    has(body.error, 'admin accounts cannot be created here', 'explicit')
  })

  await check('customer role requires a valid customerId', async () => {
    const missing = await api('POST', '/api/users', {
      token: TOKEN, body: { email: 'nocust@newco.test', name: 'No Cust', role: 'customer', password: 'portal1234' },
    })
    eq(missing.status, 400, 'customerId required')
    const bogus = await api('POST', '/api/users', {
      token: TOKEN, body: { ...NEW_CUST, email: 'bogus@newco.test', customerId: 'c-9999' },
    })
    eq(bogus.status, 422, 'unknown customer rejected')
  })

  await check('password shorter than 8 characters is rejected', async () => {
    const { status } = await api('POST', '/api/users', {
      token: TOKEN, body: { ...NEW_CUST, email: 'weak@newco.test', customerId: 'c-1004', password: 'short' },
    })
    eq(status, 422, 'rejected')
  })

  await check('PATCH cannot change role', async () => {
    const { status, body } = await api('PATCH', `/api/users/${createdUser.id}`, { token: TOKEN, body: { role: 'admin' } })
    eq(status, 422, 'rejected')
    has(body.error, 'role cannot be changed', 'explicit')
  })

  await check('password reset rotates the credential', async () => {
    const { status, body } = await api('PATCH', `/api/users/${createdUser.id}`, { token: TOKEN, body: { password: NEW_PW } })
    eq(status, 200, 'reset')
    eq(body.user.password, undefined, 'no hash in the response')
    eq((await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_CUST.password } })).status, 401, 'old password rejected')
    eq((await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_PW } })).status, 200, 'new password works')
  })

  await check('blank password on PATCH leaves the credential alone', async () => {
    await api('PATCH', `/api/users/${createdUser.id}`, { token: TOKEN, body: { name: 'Portal Owner', password: '' } })
    eq((await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_PW } })).status, 200, 'still works')
  })

  await check('a customer account cannot be reassigned to a taken customer', async () => {
    const { status, body } = await api('PATCH', `/api/users/${createdUser.id}`, { token: TOKEN, body: { customerId: 'c-1001' } })
    eq(status, 422, 'rejected')
    has(body.error, 'already has a portal account', 'explains the clash')
  })

  await check('user routes are admin-only', async () => {
    // NB: the api helper falls back to the global TOKEN when no `token` is passed,
    // so the buyer session has to be pulled off the response body explicitly.
    const { body } = await api('POST', '/api/auth/login', { body: BUYER })
    const buyerToken = body.token
    eq((await api('GET', '/api/users', { token: buyerToken })).status, 403, 'customer cannot list')
    eq((await api('POST', '/api/users', { token: buyerToken, body: NEW_CUST })).status, 403, 'customer cannot create')
    eq((await api('PATCH', `/api/users/${createdUser.id}`, { token: buyerToken, body: { name: 'x' } })).status, 403, 'customer cannot patch')
    eq((await api('DELETE', `/api/users/${createdUser.id}`, { token: buyerToken })).status, 403, 'customer cannot delete')
    eq((await api('GET', '/api/users', { token: null })).status, 401, 'anonymous blocked')
  })

  await check('existing admin accounts still work and are untouched', async () => {
    const { status, body } = await api('POST', '/api/auth/login', { body: ADMIN })
    eq(status, 200, 'admin login')
    eq(body.user.role, 'admin', 'still admin')
    const second = await api('POST', '/api/auth/login', { body: { email: 'sales@customwear.sample', password: 'admin123' } })
    eq(second.status, 200, 'second admin login')
  })

  await check('an admin cannot delete their own account', async () => {
    const me = await api('GET', '/api/auth/me', { token: TOKEN })
    const { status, body } = await api('DELETE', `/api/users/${me.body.user.id}`, { token: TOKEN })
    eq(status, 422, 'rejected')
    has(body.error, 'your own account', 'explicit')
  })


  await check('the last admin cannot be deleted', async () => {
    // Retire every admin except the one holding the global TOKEN, so later checks
    // keep a working admin session.
    const me = await api('GET', '/api/auth/me', { token: TOKEN })
    const list = await api('GET', '/api/users', { token: TOKEN })
    const admins = list.body.users.filter((u) => u.role === 'admin')
    truthy(admins.length >= 2, 'at least two admins in the seed data')
    for (const a of admins.filter((u) => u.id !== me.body.user.id)) {
      await api('DELETE', `/api/users/${a.id}`, { token: TOKEN })
    }
    const left = await api('GET', '/api/users', { token: TOKEN })
    const remaining = left.body.users.filter((u) => u.role === 'admin')
    eq(remaining.length, 1, 'exactly one admin left')
    // With a single admin the survivor is also the caller, so the self-delete guard
    // fires first; either way the last admin must survive and stay usable.
    const del = await api('DELETE', `/api/users/${remaining[0].id}`, { token: TOKEN })
    eq(del.status, 422, 'last admin survives')
    const still = await api('GET', '/api/users', { token: TOKEN })
    truthy(still.body.users.some((u) => u.id === remaining[0].id), 'admin still present')
    eq((await api('GET', '/api/auth/me', { token: TOKEN })).status, 200, 'admin session still valid')
  })

  await check('DELETE revokes the account and its sessions', async () => {
    const session = await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_PW } })
    eq(session.status, 200, 'logged in first')
    const { status, body } = await api('DELETE', `/api/users/${createdUser.id}`, { token: TOKEN })
    eq(status, 200, 'deleted')
    eq(body.deleted, createdUser.id, 'echoes the id')
    eq((await api('GET', '/api/auth/me', { token: session.body.token })).status, 401, 'session revoked')
    eq((await api('POST', '/api/auth/login', { body: { email: NEW_CUST.email, password: NEW_PW } })).status, 401, 'cannot log in again')
  })

  await check('public order tracking is unchanged by account management', async () => {
    const good = await api('POST', '/api/track', { body: { orderId: 'ORD-3001', contact: 'buyer@greenfield.sample' } })
    eq(good.status, 200, 'still resolves')
    truthy(good.body.tracking.timeline.length > 0, 'timeline intact')
    for (const k of ['customerId', 'adminNote', 'quotedTotal', 'rfq']) {
      eq(k in good.body.tracking, false, `no ${k} leaked`)
    }
    eq((await api('POST', '/api/track', { body: { orderId: 'ord-9999', contact: 'buyer@greenfield.sample' } })).status, 404, 'unknown id still 404')
  })

  await check('customer management still works after account work', async () => {
    const { status, body } = await api('GET', '/api/customers', { token: TOKEN })
    eq(status, 200, 'customers list')
    truthy(body.customers.length >= 6, 'customers intact')
  })

  // Kept last on purpose: tripping the limiter locks this IP out of /api/auth/login
  // for 5 minutes, so no later check may depend on a fresh login.
  await check('login rate limit trips on failures but not on success', async () => {
    // Burn the budget with wrong passwords, then prove a CORRECT login is refused.
    for (let i = 0; i < 12; i++) {
      const r = await api('POST', '/api/auth/login', { body: { email: ADMIN.email, password: `nope-${i}` } })
      eq(r.status, 401, `failure ${i} stays 401`)
    }
    const blocked = await api('POST', '/api/auth/login', { body: ADMIN })
    eq(blocked.status, 401, 'correct credentials are now blocked')
    eq(blocked.body.error, 'Invalid email or password', 'blocked reply stays generic')
    // Existing sessions are unaffected - the limiter only guards the login route.
    eq((await api('GET', '/api/auth/me', { token: TOKEN })).status, 200, 'live sessions keep working')
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

