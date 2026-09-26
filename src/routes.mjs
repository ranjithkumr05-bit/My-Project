// src/routes.mjs - every HTTP endpoint. Handlers return plain data (sent as
// 200) or withStatus(201, data). Throwing ApiError is handled by server.mjs.
import {
  store, stages, nextId, validateItems, moqFor, persist, counts,
  productById, customerById, userById, RFQ_STATUSES, ORDER_STATUSES,
  LEAD_STATUSES, SAMPLE_STATUSES, LEAD_SOURCES,
} from './store.mjs'
import { login, logout, toPublicUser, requireAuth, requireRole, scopeToUser, revokeUserSessions, SESSION_TTL_SECONDS } from './auth.mjs'
import { hashPassword } from './password.mjs'
import { badRequest, notFound, unprocessable, forbidden, unauthorized } from './http.mjs'
import { emit, EVENTS, webhookConfigured } from './notify.mjs'
import { nowIso } from './http.mjs'

export const STATUS = Symbol('status')
const withStatus = (status, data) => ({ [STATUS]: status, data })
export const statusOf = (result) => (result && typeof result === 'object' && STATUS in result ? result : null)

const mustBeIn = (value, allowed, field) => {
  if (!allowed.includes(value)) throw unprocessable(`"${value}" is not a valid ${field}. Allowed: ${allowed.join(', ')}`)
  return value
}

// Customer registered contact. These two rules mirror the tracker match in
// POST /api/track exactly - email compared case-insensitively, phone by digits
// with a 6-digit floor - so any contact accepted here is one the buyer can
// actually verify on /track.
const phoneDigits = (s) => String(s || '').replace(/\D/g, '')
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim())

/**
 * Resolve + validate a customer email/phone pair. Any field the body omits
 * falls back to the current value, so PATCH can change one field alone.
 * At least one contact is required: without it the customer can never pass
 * order-tracking verification.
 */
const resolveContact = (body, current = {}) => {
  const pick = (k) => (body[k] === undefined ? (current[k] || null) : (String(body[k]).trim() || null))
  const email = pick('email')
  const phone = pick('phone')
  if (!email && !phone) {
    throw unprocessable('A registered email or phone is required - the customer uses it to verify their orders')
  }
  if (email && !isEmail(email)) throw unprocessable(`"${email}" is not a valid email address`)
  if (phone && phoneDigits(phone).length < 6) {
    throw unprocessable('phone must contain at least 6 digits - that is the minimum the order tracker can match on')
  }
  return { email, phone }
}

/**
 * Reject a contact already registered to a different customer. Both fields are
 * tracker credentials, so a shared one would let two accounts verify each
 * other's orders given an order id.
 */
const assertContactFree = (contact, selfId) => {
  for (const [field, value] of Object.entries(contact)) {
    if (!value) continue
    const same = store.customers.find((c) => c.id !== selfId && (field === 'email'
      ? String(c.email || '').trim().toLowerCase() === value.toLowerCase()
      : phoneDigits(c.phone) === phoneDigits(value)))
    if (same) throw unprocessable(`${field} "${value}" is already registered to ${same.company} (${same.id})`)
  }
}

// ---- customer portal accounts -------------------------------------------------
// user.email (login) and customer.email (order tracking) are deliberately
// separate fields and are never synchronised: the tracker must keep working even
// if the buyer's portal login lives at a different address.
const PASSWORD_MIN = 8
const CUSTOMER_ROLE = 'customer'

const assertEmailFree = (email, selfId) => {
  const clash = store.users.find((u) => u.id !== selfId
    && String(u.email || '').trim().toLowerCase() === String(email).trim().toLowerCase())
  if (clash) throw unprocessable(`email "${email}" is already used by account ${clash.id}`)
}

/** 1 customer : 1 portal account. */
const assertCustomerFree = (customerId, selfId) => {
  const clash = store.users.find((u) => u.id !== selfId && u.customerId === customerId)
  if (clash) throw unprocessable(`${customerId} already has a portal account (${clash.id})`)
}

const readPassword = (raw) => {
  const pw = String(raw ?? '')
  if (pw.length < PASSWORD_MIN) throw unprocessable(`password must be at least ${PASSWORD_MIN} characters`)
  return pw
}

/** Never let the last admin disappear - otherwise nobody can manage accounts. */
const assertNotLastAdmin = (user) => {
  if (user.role !== 'admin') return
  const admins = store.users.filter((u) => u.role === 'admin')
  if (admins.length <= 1) throw unprocessable('This is the last admin account — promote another admin before removing it')
}


const enrich = (rfq) => ({
  ...rfq,
  customer: customerById(rfq.customerId)?.company || rfq.customerId,
  stages: stages(),
  items: rfq.items.map((it) => ({
    ...it,
    productName: productById(it.productId)?.name || it.productId,
    moq: moqFor(productById(it.productId)),
    indicativePrice: productById(it.productId)?.indicativePrice ?? null,
    indicativeLineTotal: productById(it.productId)?.indicativePrice
      ? productById(it.productId).indicativePrice * Number(it.qty || 0)
      : null,
  })),
})

/** Attach customer name, stage labels and a progress percentage to an order. */
const withProgress = (order) => {
  const list = stages()
  const index = Math.max(0, list.findIndex((s) => s.id === order.stage))
  const current = list[index] || null
  return {
    ...order,
    customer: customerById(order.customerId)?.company || order.customerId,
    stageLabel: current?.label || order.stage,
    stageIndex: index,
    stageCount: list.length,
    progressPercent: list.length > 1 ? Math.round((index / (list.length - 1)) * 100) : 0,
  }
}

// Ponytail: in-memory sliding window per IP, shared by every public limiter.
// allowHits spends a slot per call (used by the tracker); login instead peeks
// with hitsExhausted and only records on failure, so a good login is never rate limited.
const clientIp = (req) => req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
const prune = (map, ip, windowMs) => {
  const now = Date.now()
  const hits = (map.get(ip) || []).filter((t) => now - t < windowMs)
  return { now, hits }
}
/** True when this IP is under `max` hits inside `windowMs`. */
const allowHits = (req, map, max, windowMs) => {
  const ip = clientIp(req)
  const { now, hits } = prune(map, ip, windowMs)
  if (hits.length >= max) return false
  hits.push(now)
  map.set(ip, hits)
  return true
}
/** Has this IP already spent `max` slots? Records nothing. */
const hitsExhausted = (req, map, max, windowMs) => prune(map, clientIp(req), windowMs).hits.length >= max
/** Record one failure against this IP. */
const recordHit = (req, map, windowMs) => {
  const ip = clientIp(req)
  const { now, hits } = prune(map, ip, windowMs)
  hits.push(now)
  map.set(ip, hits)
}

// Public tracker: unchanged budget — 30 requests / 60s / IP.
const trackHits = new Map()
const trackAllowed = (req) => allowHits(req, trackHits, 30, 60 * 1000)

// Login: 10 FAILED attempts / 5 min / IP. Successes are free, and the reply is
// always the same generic message, so this never reveals whether an account exists.
const loginHits = new Map()
const LOGIN_WINDOW_MS = 5 * 60 * 1000
const LOGIN_MAX_FAILS = 10
const loginBlocked = (req) => hitsExhausted(req, loginHits, LOGIN_MAX_FAILS, LOGIN_WINDOW_MS)
const loginFailed = (req) => recordHit(req, loginHits, LOGIN_WINDOW_MS)

/**
 * Public tracking serializer — explicit allowlist only. Never returns the raw
 * order object: no customerId, no rfq internals, no quoted totals, no notes.
 * Product summary and dispatch come from linked records only when present.
 */
const toPublicTrackingResponse = (order) => {
  const p = withProgress(order)
  const list = stages()
  const byStage = new Map((order.statusHistory || []).map((h) => [h.stage, h.at]))
  const rfq = order.rfqId ? store.rfqs.find((r) => r.id === order.rfqId) : null
  const firstItem = rfq?.items?.[0] || null
  const product = firstItem ? productById(firstItem.productId) : null
  const productSummary = product?.name || firstItem?.category || null
  const quantity = Number.isFinite(Number(order.qty)) ? Number(order.qty) : null
  const timeline = list.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: i < p.stageIndex ? 'completed' : i === p.stageIndex ? 'in_progress' : 'upcoming',
    at: byStage.get(s.id) || null,
  }))
  const dispatch = (order.courier || order.tracking)
    ? { courier: order.courier || null, trackingNumber: order.tracking || null }
    : null
  return {
    orderId: order.id,
    productSummary,
    quantity,
    status: order.status,
    currentStage: order.stage,
    stageLabel: p.stageLabel,
    stageIndex: p.stageIndex,
    stageCount: p.stageCount,
    progressPercent: p.progressPercent,
    expectedDelivery: order.dueDate || null,
    createdAt: order.createdAt || null,
    timeline,
    dispatch,
  }
}

/** Attach product/customer labels and the allowed status list to a sample. */
const enrichSample = (sample) => ({
  ...sample,
  customer: customerById(sample.customerId)?.company || sample.customerId,
  productName: productById(sample.productId)?.name || sample.productId,
  category: productById(sample.productId)?.category || null,
  statuses: SAMPLE_STATUSES,
})

const OPEN_ORDER_STATUSES = ['pending', 'in_production', 'on_hold']
const isOpenOrder = (order) => OPEN_ORDER_STATUSES.includes(order.status)

/** Products a customer has asked for before - powers a "reorder" list. */
const recurringItems = (customerId) => {
  const seen = new Map()
  for (const rfq of store.rfqs.filter((r) => r.customerId === customerId)) {
    for (const item of rfq.items) {
      const product = productById(item.productId)
      const entry = seen.get(item.productId) || {
        productId: item.productId,
        productName: product?.name || item.productId,
        moq: moqFor(product),
        indicativePrice: product?.indicativePrice ?? null,
        requestedQty: 0,
        timesRequested: 0,
        lastRequestedAt: rfq.createdAt,
      }
      entry.requestedQty += Number(item.qty || 0)
      entry.timesRequested += 1
      if (String(rfq.createdAt) > String(entry.lastRequestedAt)) entry.lastRequestedAt = rfq.createdAt
      seen.set(item.productId, entry)
    }
  }
  return [...seen.values()].sort((a, b) => b.timesRequested - a.timesRequested || b.requestedQty - a.requestedQty)
}

/** Everything the customer dashboard needs, scoped to a single customer. */
const customerDashboard = (customerId) => {
  const today = new Date().toISOString().slice(0, 10)
  const rfqs = store.rfqs.filter((r) => r.customerId === customerId)
  const orders = store.orders.filter((o) => o.customerId === customerId)
  const samples = store.samples.filter((s) => s.customerId === customerId)
  const openOrders = orders.filter(isOpenOrder)
  return {
    customer: customerById(customerId),
    kpis: {
      rfqs: rfqs.length,
      rfqsAwaitingQuote: rfqs.filter((r) => ['submitted', 'in_review'].includes(r.status)).length,
      quotesToReview: rfqs.filter((r) => r.status === 'quoted').length,
      openOrders: openOrders.length,
      overdueOrders: openOrders.filter((o) => o.dueDate && o.dueDate < today).length,
      samplesInProgress: samples.filter((s) => !['delivered', 'rejected'].includes(s.status)).length,
    },
    activeRfqs: rfqs.filter((r) => !['converted', 'rejected'].includes(r.status)).map(enrich),
    ordersInProduction: openOrders.map(withProgress),
    recentSamples: samples.slice(0, 5).map(enrichSample),
    recurringItems: recurringItems(customerId),
  }
}

export const routes = [
  // ---------- health ----------
  {
    method: 'GET', path: '/api/health',
    handler: () => ({
      ok: true,
      phase: 'sample-data',
      database: 'not connected',
      persistence: process.env.PERSIST === '1' ? 'data/runtime.json' : 'in-memory only',
      uptimeSeconds: Math.round(process.uptime()),
      counts: counts(),
    }),
  },

  // ---------- auth ----------
  {
    method: 'POST', path: '/api/auth/login',
    handler: async ({ req, body }) => {
      if (!body.email || !body.password) throw badRequest('email and password are required')
      // A blocked IP gets the SAME message as a bad credential, so the limiter
      // never reveals whether the email or account exists.
      if (loginBlocked(req)) throw unauthorized('Invalid email or password')
      const session = login(body.email, body.password)
      if (!session) { loginFailed(req); throw unauthorized('Invalid email or password') }
      return session
    },
  },
  {
    method: 'POST', path: '/api/auth/logout',
    handler: ({ req }) => {
      const token = /^Bearer\s+(.+)$/i.exec((req.headers.authorization || '').trim())?.[1]
      return { loggedOut: token ? logout(token) : false }
    },
  },
  {
    method: 'GET', path: '/api/auth/me',
    handler: ({ req }) => {
      const user = requireAuth(req)
      return { user: toPublicUser(user), sessionTtlSeconds: SESSION_TTL_SECONDS }
    },
  },

  // ---------- catalogue ----------
  {
    method: 'GET', path: '/api/catalogue/categories',
    handler: () => {
      const categories = Object.entries(store.meta.moqRules).map(([id, moq]) => ({
        id,
        label: id === 'private-label' ? 'Private label' : id.charAt(0).toUpperCase() + id.slice(1) + 's',
        moq,
        productCount: store.products.filter((p) => p.category === id).length,
        productIds: store.products.filter((p) => p.category === id).map((p) => p.id),
      }))
      return { categories, sizes: store.meta.sizes, currency: store.meta.currency }
    },
  },
  { method: 'GET', path: '/api/catalogue/branding', handler: () => ({ brandingOptions: store.brandingOptions }) },
  { method: 'GET', path: '/api/catalogue/fabrics', handler: () => ({ fabricOptions: store.fabricOptions }) },
  { method: 'GET', path: '/api/catalogue/stages', handler: () => ({ productionStages: stages() }) },

  {
    method: 'GET', path: '/api/products',
    handler: ({ query }) => {
      let items = store.products
      if (query.category) items = items.filter((p) => p.category === query.category)
      if (query.q) {
        const needle = query.q.toLowerCase()
        items = items.filter((p) => `${p.name} ${p.category} ${p.fabric} ${p.colors.join(' ')}`.toLowerCase().includes(needle))
      }
      if (query.maxMoq) items = items.filter((p) => moqFor(p) <= Number(query.maxMoq))
      return { total: items.length, products: items.map((p) => ({ ...p, moq: moqFor(p) })) }
    },
  },
  {
    method: 'GET', path: '/api/products/:id',
    handler: ({ params }) => {
      const product = productById(params.id)
      if (!product) throw notFound(`No product with id "${params.id}"`)
      return {
        product: { ...product, moq: moqFor(product) },
        brandingOptions: store.brandingOptions.filter((o) => product.branding.includes(o.id)),
      }
    },
  },

  // ---------- WhatsApp enquiry CTA ----------
  {
    method: 'GET', path: '/api/whatsapp/cta',
    handler: ({ query }) => {
      const number = process.env.WHATSAPP_NUMBER || null
      const product = query.product ? productById(query.product) : null
      const lines = [
        'Hello Customwear, I would like a quotation.',
        product ? `Product: ${product.name} (${product.id})` : query.category ? `Category: ${query.category}` : null,
        query.qty ? `Quantity: ${query.qty} pcs` : null,
        query.company ? `Company: ${query.company}` : null,
        query.message || null,
      ].filter(Boolean)
      const text = lines.join('\n')
      return {
        configured: Boolean(number),
        number,
        message: text,
        url: number ? `https://wa.me/${String(number).replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}` : null,
        note: number ? null : 'Set WHATSAPP_NUMBER to emit a live wa.me deep link.',
      }
    },
  },

  // ---------- reference data (drives frontend selects) ----------
  {
    method: 'GET', path: '/api/reference',
    handler: () => ({
      rfqStatuses: RFQ_STATUSES,
      orderStatuses: ORDER_STATUSES,
      leadStatuses: LEAD_STATUSES,
      sampleStatuses: SAMPLE_STATUSES,
      leadSources: LEAD_SOURCES,
      productionStages: stages(),
      brandingOptions: store.brandingOptions,
      fabricOptions: store.fabricOptions,
      sizes: store.meta.sizes,
      moqRules: store.meta.moqRules,
      currency: store.meta.currency,
    }),
  },

  // ---------- RFQ / quotation requests ----------
  {
    method: 'POST', path: '/api/rfqs',
    handler: async ({ req, body }) => {
      const user = requireAuth(req)
      const customerId = user.role === 'admin' ? body.customerId : user.customerId
      if (!customerId) throw badRequest('customerId is required')
      if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
      const items = (body.items || []).map((it) => ({
        productId: it.productId,
        category: productById(it.productId)?.category ?? it.category ?? null,
        qty: Number(it.qty),
        sizes: it.sizes || {},
        branding: it.branding || [],
        notes: it.notes || null,
      }))
      const { errors, warnings } = validateItems(items)
      if (errors.length) throw unprocessable('Line items failed validation', { errors, warnings })
      const status = body.status === 'draft' ? 'draft' : mustBeIn('submitted', ['draft', 'submitted'], 'status')
      const rfq = {
        id: nextId(store.rfqs, 'rfq-'),
        customerId,
        status,
        createdAt: nowIso(),
        items,
        quotedTotal: null,
        quoteValidUntil: null,
        adminNote: null,
      }
      store.rfqs.unshift(rfq)
      await persist()
      await emit(status === 'draft' ? 'rfq.draft_saved' : 'rfq.submitted', {
        rfqId: rfq.id, customerId, lines: items.length,
        totalQty: items.reduce((s, i) => s + i.qty, 0), warnings,
      })
      return withStatus(201, { rfq: enrich(rfq), warnings })
    },
  },
  {
    method: 'GET', path: '/api/rfqs',
    handler: ({ req, query }) => {
      const user = requireAuth(req)
      let items = scopeToUser(user, store.rfqs)
      if (query.status) items = items.filter((r) => r.status === query.status)
      if (query.customerId && user.role === 'admin') items = items.filter((r) => r.customerId === query.customerId)
      return { total: items.length, rfqs: items.map(enrich) }
    },
  },
  {
    method: 'GET', path: '/api/rfqs/:id',
    handler: ({ req, params }) => {
      const user = requireAuth(req)
      const rfq = store.rfqs.find((r) => r.id === params.id)
      if (!rfq) throw notFound(`No RFQ with id "${params.id}"`)
      if (user.role !== 'admin' && rfq.customerId !== user.customerId) throw forbidden('This RFQ belongs to another customer')
      return { rfq: enrich(rfq) }
    },
  },
  {
    method: 'PATCH', path: '/api/rfqs/:id',
    handler: async ({ req, params, body }) => {
      const user = requireAuth(req)
      const rfq = store.rfqs.find((r) => r.id === params.id)
      if (!rfq) throw notFound(`No RFQ with id "${params.id}"`)
      const isOwner = user.role === 'admin' || rfq.customerId === user.customerId
      if (!isOwner) throw forbidden('This RFQ belongs to another customer')
      if (body.items) {
        if (user.role !== 'admin' && rfq.status !== 'draft') throw forbidden('Only draft RFQs can be edited')
        const items = body.items.map((it) => ({
          productId: it.productId,
          category: productById(it.productId)?.category ?? it.category ?? null,
          qty: Number(it.qty),
          sizes: it.sizes || {},
          branding: it.branding || [],
          notes: it.notes || null,
        }))
        const { errors, warnings } = validateItems(items)
        if (errors.length) throw unprocessable('Line items failed validation', { errors, warnings })
        rfq.items = items
        if (body.status === 'submitted' && rfq.status === 'draft') rfq.status = 'submitted'
        await persist()
        await emit('rfq.updated', { rfqId: rfq.id, warnings })
        return { rfq: enrich(rfq), warnings }
      }
      if (body.adminNote !== undefined) {
        if (user.role !== 'admin') throw forbidden('Only admins can set adminNote')
        rfq.adminNote = body.adminNote
      }
      await persist()
      return { rfq: enrich(rfq) }
    },
  },
  {
    method: 'PATCH', path: '/api/rfqs/:id/status',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const rfq = store.rfqs.find((r) => r.id === params.id)
      if (!rfq) throw notFound(`No RFQ with id "${params.id}"`)
      rfq.status = mustBeIn(body.status, RFQ_STATUSES, 'RFQ status')
      if (body.quotedTotal !== undefined) rfq.quotedTotal = body.quotedTotal === null ? null : Number(body.quotedTotal)
      if (body.quoteValidUntil !== undefined) rfq.quoteValidUntil = body.quoteValidUntil
      if (body.adminNote !== undefined) rfq.adminNote = body.adminNote
      await persist()
      await emit('rfq.status_changed', { rfqId: rfq.id, status: rfq.status, quotedTotal: rfq.quotedTotal })
      return { rfq: enrich(rfq) }
    },
  },


  // ---------- bulk orders / production workflow ----------
  {
    method: 'POST', path: '/api/orders',
    handler: async ({ req, body }) => {
      requireRole(req, 'admin')
      const customerId = body.customerId
      if (!customerId) throw badRequest('customerId is required')
      if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
      if (body.rfqId && !store.rfqs.some((r) => r.id === body.rfqId)) throw unprocessable(`Unknown RFQ "${body.rfqId}"`)
      const qty = Number(body.qty)
      if (!Number.isFinite(qty) || qty <= 0) throw badRequest('qty must be a positive number')
      const order = {
        id: nextId(store.orders, 'ord-'),
        rfqId: body.rfqId || null,
        customerId,
        qty,
        status: body.status ? mustBeIn(body.status, ORDER_STATUSES, 'order status') : 'pending',
        stage: body.stage ? mustBeIn(body.stage, stages().map((s) => s.id), 'production stage') : 'sourcing',
        createdAt: nowIso(),
        dueDate: body.dueDate || null,
        statusHistory: [{ stage: body.stage || 'sourcing', at: nowIso() }],
      }
      store.orders.unshift(order)
      await persist()
      await emit('order.created', { orderId: order.id, rfqId: order.rfqId, customerId, qty, dueDate: order.dueDate })
      return withStatus(201, { order: withProgress(order) })
    },
  },
  {
    method: 'GET', path: '/api/orders',
    handler: ({ req, query }) => {
      const user = requireAuth(req)
      let items = scopeToUser(user, store.orders)
      if (query.status) items = items.filter((o) => o.status === query.status)
      if (query.stage) items = items.filter((o) => o.stage === query.stage)
      if (query.customerId && user.role === 'admin') items = items.filter((o) => o.customerId === query.customerId)
      const today = new Date().toISOString().slice(0, 10)
      return {
        total: items.length,
        orders: items.map((o) => ({ ...withProgress(o), overdue: Boolean(o.dueDate && o.dueDate < today && o.status !== 'completed' && o.status !== 'cancelled') })),
      }
    },
  },
  {
    method: 'GET', path: '/api/orders/:id',
    handler: ({ req, params }) => {
      const user = requireAuth(req)
      const order = store.orders.find((o) => o.id === params.id)
      if (!order) throw notFound(`No order with id "${params.id}"`)
      if (user.role !== 'admin' && order.customerId !== user.customerId) throw forbidden('This order belongs to another customer')
      const rfq = order.rfqId ? store.rfqs.find((r) => r.id === order.rfqId) : null
      return { order: withProgress(order), rfq: rfq ? enrich(rfq) : null, timeline: order.statusHistory }
    },
  },
  {
    method: 'POST', path: '/api/track',
    handler: ({ req, body }) => {
      if (!trackAllowed(req)) throw unprocessable('Too many tracking attempts — please wait a minute and try again')
      const orderId = String(body.orderId || '').replace(/^#/, '').trim().toLowerCase()
      const contact = String(body.contact || '').trim()
      if (!orderId) throw badRequest('Order ID is required')
      if (!contact) throw badRequest('Registered email or phone is required')
      // Ponytail: generic 404 for unknown id OR contact mismatch — no order enumeration.
      const fail = () => notFound('Order not found. Check your order number and registered email or phone number.')
      const order = store.orders.find((o) => String(o.id).toLowerCase() === orderId)
      if (!order) throw fail()
      const customer = customerById(order.customerId)
      if (!customer) throw fail()
      const norm = (s) => String(s || '').toLowerCase()
      const digits = (s) => String(s || '').replace(/\D/g, '')
      const emailOk = norm(contact) === norm(customer.email)
      const phoneOk = contact && digits(contact).length >= 6 && digits(contact) === digits(customer.phone)
      if (!emailOk && !phoneOk) throw fail()
      return { tracking: toPublicTrackingResponse(order) }
    },
  },
  {
    method: 'PATCH', path: '/api/orders/:id/stage',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const order = store.orders.find((o) => o.id === params.id)
      if (!order) throw notFound(`No order with id "${params.id}"`)
      const stage = mustBeIn(body.stage, stages().map((s) => s.id), 'production stage')
      order.stage = stage
      order.statusHistory = [...(order.statusHistory || []), { stage, at: nowIso(), note: body.note || null }]
      if (!body.status) {
        if (stage === 'dispatched') order.status = 'completed'
        else if (order.status === 'pending' || order.status === 'on_hold') order.status = 'in_production'
      } else {
        order.status = mustBeIn(body.status, ORDER_STATUSES, 'order status')
      }
      await persist()
      await emit('order.stage_changed', { orderId: order.id, stage, status: order.status, customerId: order.customerId })
      return { order: withProgress(order) }
    },
  },
  {
    method: 'PATCH', path: '/api/orders/:id/status',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const order = store.orders.find((o) => o.id === params.id)
      if (!order) throw notFound(`No order with id "${params.id}"`)
      order.status = mustBeIn(body.status, ORDER_STATUSES, 'order status')
      await persist()
      await emit('order.status_changed', { orderId: order.id, status: order.status, customerId: order.customerId })
      return { order: withProgress(order) }
    },
  },
  {
    method: 'POST', path: '/api/rfqs/:id/convert',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const rfq = store.rfqs.find((r) => r.id === params.id)
      if (!rfq) throw notFound(`No RFQ with id "${params.id}"`)
      if (rfq.status === 'converted') throw unprocessable('This RFQ has already been converted to an order')
      if (!['accepted', 'quoted'].includes(rfq.status)) throw unprocessable(`Only accepted or quoted RFQs can be converted (current status: ${rfq.status})`)
      const qty = Number(body.qty) || rfq.items.reduce((s, i) => s + Number(i.qty || 0), 0)
      // Optional explicit customer. Defaults to the RFQ's own customer so the
      // existing flow is unchanged; an admin can only override it to a customer
      // that actually exists - nothing is guessed or auto-matched.
      const customerId = body.customerId === undefined ? rfq.customerId : String(body.customerId)
      if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
      const order = {
        id: nextId(store.orders, 'ord-'),
        rfqId: rfq.id,
        customerId,
        qty,
        status: 'pending',
        stage: 'sourcing',
        createdAt: nowIso(),
        dueDate: body.dueDate || null,
        statusHistory: [{ stage: 'sourcing', at: nowIso() }],
      }
      store.orders.unshift(order)
      rfq.status = 'converted'
      await persist()
      await emit('order.created_from_rfq', { orderId: order.id, rfqId: rfq.id, customerId, qty })
      return withStatus(201, { order: withProgress(order), rfq: enrich(rfq) })
    },
  },

  // ---------- leads: public enquiry intake + admin management ----------
  {
    method: 'POST', path: '/api/leads',
    handler: async ({ body }) => {
      const name = String(body.name || '').trim()
      if (!name) throw badRequest('name is required')
      if (!body.phone && !body.email) throw badRequest('Provide a phone number or an email address')
      const lead = {
        id: nextId(store.leads, 'lead-'),
        source: body.source ? mustBeIn(body.source, LEAD_SOURCES, 'lead source') : 'website_form',
        name,
        company: body.company || null,
        phone: body.phone || null,
        email: body.email || null,
        message: body.message || null,
        status: 'new',
        assignedTo: null,
        createdAt: nowIso(),
      }
      store.leads.unshift(lead)
      await persist()
      await emit('lead.created', { leadId: lead.id, source: lead.source, company: lead.company, phone: lead.phone })
      return withStatus(201, { lead })
    },
  },
  {
    method: 'GET', path: '/api/leads',
    handler: ({ req, query }) => {
      requireRole(req, 'admin')
      let items = [...store.leads]
      if (query.status) items = items.filter((l) => l.status === query.status)
      if (query.source) items = items.filter((l) => l.source === query.source)
      if (query.assignedTo) items = items.filter((l) => l.assignedTo === query.assignedTo)
      if (query.q) {
        const needle = query.q.toLowerCase()
        items = items.filter((l) => `${l.name} ${l.company || ''} ${l.email || ''} ${l.message || ''}`.toLowerCase().includes(needle))
      }
      const countBy = (field, values) => Object.fromEntries(values.map((v) => [v, store.leads.filter((l) => l[field] === v).length]))
      return {
        total: items.length,
        byStatus: countBy('status', LEAD_STATUSES),
        bySource: countBy('source', LEAD_SOURCES),
        unassigned: store.leads.filter((l) => !l.assignedTo && !['won', 'lost'].includes(l.status)).length,
        leads: items,
      }
    },
  },
  {
    method: 'GET', path: '/api/leads/:id',
    handler: ({ req, params }) => {
      requireRole(req, 'admin')
      const lead = store.leads.find((l) => l.id === params.id)
      if (!lead) throw notFound(`No lead with id "${params.id}"`)
      return { lead, owner: lead.assignedTo ? toPublicUser(userById(lead.assignedTo)) : null }
    },
  },
  {
    method: 'PATCH', path: '/api/leads/:id',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const lead = store.leads.find((l) => l.id === params.id)
      if (!lead) throw notFound(`No lead with id "${params.id}"`)
      if (body.status !== undefined) lead.status = mustBeIn(body.status, LEAD_STATUSES, 'lead status')
      if (body.assignedTo !== undefined) {
        if (body.assignedTo === null) {
          lead.assignedTo = null
        } else {
          const owner = userById(body.assignedTo)
          if (!owner || owner.role !== 'admin') throw unprocessable(`"${body.assignedTo}" is not an admin user`)
          lead.assignedTo = owner.id
        }
      }
      if (body.note !== undefined) lead.note = body.note
      await persist()
      await emit('lead.updated', { leadId: lead.id, status: lead.status, assignedTo: lead.assignedTo })
      return { lead, owner: lead.assignedTo ? toPublicUser(userById(lead.assignedTo)) : null }
    },
  },

  // ---------- customers: admin book of business + self-service dashboard ----------
  {
    method: 'GET', path: '/api/customers',
    handler: ({ req, query }) => {
      requireRole(req, 'admin')
      let items = [...store.customers]
      if (query.tier) items = items.filter((c) => c.tier === query.tier)
      if (query.country) items = items.filter((c) => c.country === query.country)
      if (query.q) {
        const needle = query.q.toLowerCase()
        items = items.filter((c) => `${c.company} ${c.contactName} ${c.email} ${c.city}`.toLowerCase().includes(needle))
      }
      return {
        total: items.length,
        tiers: [...new Set(store.customers.map((c) => c.tier))],
        countries: [...new Set(store.customers.map((c) => c.country))].sort(),
        customers: items.map((c) => ({
          ...c,
          stats: {
            rfqs: store.rfqs.filter((r) => r.customerId === c.id).length,
            openOrders: store.orders.filter((o) => o.customerId === c.id && isOpenOrder(o)).length,
            samples: store.samples.filter((s) => s.customerId === c.id).length,
          },
        })),
      }
    },
  },
  {
    // Admin book-of-business entry. A registered contact is mandatory because
    // POST /api/track resolves the buyer's email/phone through this record.
    method: 'POST', path: '/api/customers',
    handler: async ({ req, body }) => {
      requireRole(req, 'admin')
      const company = String(body.company || '').trim()
      if (!company) throw badRequest('company is required')
      const contact = resolveContact(body)
      assertContactFree(contact, null)
      const text = (k) => (String(body[k] || '').trim() || null)
      const customer = {
        id: nextId(store.customers, 'c-'),
        company,
        contactName: text('contactName'),
        email: contact.email,
        phone: contact.phone,
        city: text('city'),
        country: text('country') || 'IN',
        tier: text('tier') || 'standard',
        since: new Date().toISOString().slice(0, 10),
      }
      store.customers.push(customer)
      await persist()
      await emit('customer.created', { customerId: customer.id, company: customer.company, email: customer.email, phone: customer.phone })
      return withStatus(201, { customer })
    },
  },

  {
    // Must stay above '/api/customers/:id' so "me" is not parsed as an id.
    method: 'GET', path: '/api/customers/me',
    handler: ({ req }) => {
      const user = requireAuth(req)
      if (!user.customerId) throw forbidden('This account is not linked to a customer record')
      return { dashboard: customerDashboard(user.customerId), user: toPublicUser(user) }
    },
  },
  {
    method: 'GET', path: '/api/customers/:id',
    handler: ({ req, params }) => {
      const user = requireAuth(req)
      if (user.role !== 'admin' && user.customerId !== params.id) throw forbidden('This customer record belongs to someone else')
      const customer = customerById(params.id)
      if (!customer) throw notFound(`No customer with id "${params.id}"`)
      const contacts = store.users.filter((u) => u.customerId === customer.id).map(toPublicUser)
      return { customer, contacts, dashboard: customerDashboard(customer.id) }
    },
  },
  {
    // Admin-only contact maintenance. Order tracking verifies against
    // customer.email / customer.phone, so these are the fields an admin has to
    // be able to correct; id and since stay immutable.
    method: 'PATCH', path: '/api/customers/:id',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const customer = customerById(params.id)
      if (!customer) throw notFound(`No customer with id "${params.id}"`)
      const contact = resolveContact(body, customer)
      assertContactFree(contact, customer.id)
      if (body.company !== undefined) {
        const company = String(body.company).trim()
        if (!company) throw badRequest('company cannot be empty')
        customer.company = company
      }
      const text = (k) => (body[k] === undefined ? customer[k] : (String(body[k]).trim() || null))
      customer.contactName = text('contactName')
      customer.email = contact.email
      customer.phone = contact.phone
      customer.city = text('city')
      customer.country = text('country')
      if (body.tier !== undefined) customer.tier = String(body.tier).trim() || customer.tier
      await persist()
      await emit('customer.updated', { customerId: customer.id, company: customer.company, email: customer.email, phone: customer.phone })
      return { customer }
    },
  },

  // ---------- customer portal accounts (admin manages, customers only log in) ----------
  {
    method: 'GET', path: '/api/users',
    handler: ({ req }) => {
      requireRole(req, 'admin')
      return {
        total: store.users.length,
        users: store.users.map((u) => ({
          ...toPublicUser(u),
          customer: u.customerId ? (customerById(u.customerId)?.company || u.customerId) : null,
          customerEmail: u.customerId ? (customerById(u.customerId)?.email || null) : null,
        })),
      }
    },
  },
  {
    // Customer portal accounts only. An admin must never be minted here, so role
    // is forced to "customer" and any other value is rejected outright.
    method: 'POST', path: '/api/users',
    handler: async ({ req, body }) => {
      requireRole(req, 'admin')
      if (body.role !== undefined && body.role !== CUSTOMER_ROLE) {
        throw unprocessable(`role must be "${CUSTOMER_ROLE}" — admin accounts cannot be created here`)
      }
      const email = String(body.email || '').trim()
      if (!email) throw badRequest('email is required')
      if (!isEmail(email)) throw unprocessable(`"${email}" is not a valid email address`)
      assertEmailFree(email, null)
      const name = String(body.name || '').trim()
      if (!name) throw badRequest('name is required')
      const customerId = String(body.customerId || '').trim()
      if (!customerId) throw badRequest('customerId is required')
      if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
      assertCustomerFree(customerId, null)
      const password = readPassword(body.password)
      const user = {
        // 'u-cust-' continues the existing naming; plain 'u-' would yield "u-1"
        // because the seed ids (u-admin-1, u-cust-1) do not parse as numbers.
        id: nextId(store.users, 'u-cust-'),
        role: CUSTOMER_ROLE,
        name,
        email,
        customerId,
        password: hashPassword(password),
      }
      store.users.push(user)
      await persist()
      // No password or hash in the event payload.
      await emit('user.created', { userId: user.id, customerId, email, role: user.role })
      return withStatus(201, { user: toPublicUser(user) })
    },
  },
  {
    // No role change here by design: admin demotion is not supported, which is
    // what keeps this endpoint from ever being able to create one.
    method: 'PATCH', path: '/api/users/:id',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const user = userById(params.id)
      if (!user) throw notFound(`No user with id "${params.id}"`)
      if (body.role !== undefined && body.role !== user.role) {
        throw unprocessable('role cannot be changed here')
      }
      if (body.email !== undefined) {
        const email = String(body.email).trim()
        if (!email) throw unprocessable('email cannot be empty')
        if (!isEmail(email)) throw unprocessable(`"${email}" is not a valid email address`)
        assertEmailFree(email, user.id)
        user.email = email
      }
      if (body.name !== undefined) {
        const name = String(body.name).trim()
        if (!name) throw unprocessable('name cannot be empty')
        user.name = name
      }
      if (body.customerId !== undefined) {
        const customerId = String(body.customerId).trim()
        if (!customerId) throw unprocessable('customerId cannot be empty')
        if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
        assertCustomerFree(customerId, user.id)
        user.customerId = customerId
      }
      let passwordChanged = false
      // Blank / omitted means unchanged, so an edit never needs the current password.
      if (body.password !== undefined && String(body.password).trim() !== '') {
        user.password = hashPassword(readPassword(body.password))
        passwordChanged = true
      }
      if (passwordChanged) revokeUserSessions(user.id)
      await persist()
      await emit('user.updated', { userId: user.id, customerId: user.customerId, email: user.email, role: user.role })
      return { user: toPublicUser(user) }
    },
  },
  {
    // Permanent removal: the schema has no active/deactivated flag, and inventing
    // one would change the account model.
    method: 'DELETE', path: '/api/users/:id',
    handler: async ({ req, params }) => {
      const actor = requireRole(req, 'admin')
      const user = userById(params.id)
      if (!user) throw notFound(`No user with id "${params.id}"`)
      if (user.id === actor.id) throw unprocessable('You cannot delete your own account')
      assertNotLastAdmin(user)
      store.users = store.users.filter((u) => u.id !== user.id)
      revokeUserSessions(user.id)
      await persist()
      await emit('user.deleted', { userId: user.id, customerId: user.customerId, role: user.role })
      return { deleted: user.id }
    },
  },



  // ---------- sample requests ----------
  {
    method: 'POST', path: '/api/samples',
    handler: async ({ req, body }) => {
      const user = requireAuth(req)
      const customerId = user.role === 'admin' ? body.customerId : user.customerId
      if (!customerId) throw badRequest('customerId is required')
      if (!customerById(customerId)) throw unprocessable(`Unknown customer "${customerId}"`)
      const product = productById(body.productId)
      if (!product) throw unprocessable(`Unknown product "${body.productId}"`)
      if (body.rfqId && !store.rfqs.some((r) => r.id === body.rfqId)) throw unprocessable(`Unknown RFQ "${body.rfqId}"`)
      const sample = {
        id: nextId(store.samples, 'smp-'),
        customerId,
        productId: product.id,
        rfqId: body.rfqId || null,
        status: 'requested',
        courier: null,
        tracking: null,
        createdAt: nowIso(),
      }
      store.samples.unshift(sample)
      await persist()
      await emit('sample.requested', { sampleId: sample.id, customerId, productId: product.id, rfqId: sample.rfqId })
      return withStatus(201, { sample: enrichSample(sample) })
    },
  },
  {
    method: 'GET', path: '/api/samples',
    handler: ({ req, query }) => {
      const user = requireAuth(req)
      let items = scopeToUser(user, store.samples)
      if (query.status) items = items.filter((s) => s.status === query.status)
      if (query.customerId && user.role === 'admin') items = items.filter((s) => s.customerId === query.customerId)
      return {
        total: items.length,
        byStatus: Object.fromEntries(SAMPLE_STATUSES.map((v) => [v, items.filter((s) => s.status === v).length])),
        samples: items.map(enrichSample),
      }
    },
  },
  {
    method: 'GET', path: '/api/samples/:id',
    handler: ({ req, params }) => {
      const user = requireAuth(req)
      const sample = store.samples.find((s) => s.id === params.id)
      if (!sample) throw notFound(`No sample request with id "${params.id}"`)
      if (user.role !== 'admin' && sample.customerId !== user.customerId) throw forbidden('This sample request belongs to another customer')
      return { sample: enrichSample(sample), statuses: SAMPLE_STATUSES }
    },
  },
  {
    method: 'PATCH', path: '/api/samples/:id/status',
    handler: async ({ req, params, body }) => {
      requireRole(req, 'admin')
      const sample = store.samples.find((s) => s.id === params.id)
      if (!sample) throw notFound(`No sample request with id "${params.id}"`)
      sample.status = mustBeIn(body.status, SAMPLE_STATUSES, 'sample status')
      if (body.courier !== undefined) sample.courier = body.courier
      if (body.tracking !== undefined) sample.tracking = body.tracking
      await persist()
      await emit('sample.status_changed', {
        sampleId: sample.id, status: sample.status, courier: sample.courier, tracking: sample.tracking,
      })
      return { sample: enrichSample(sample) }
    },
  },

  // ---------- admin dashboard + event log ----------
  {
    method: 'GET', path: '/api/admin/dashboard',
    handler: ({ req }) => {
      requireRole(req, 'admin')
      const today = new Date().toISOString().slice(0, 10)
      const num = (v) => Number(v || 0)
      const sum = (rows, pick) => rows.reduce((total, row) => total + num(pick(row)), 0)
      const countBy = (rows, field, values) =>
        Object.fromEntries(values.map((v) => [v, rows.filter((r) => r[field] === v).length]))

      const openOrders = store.orders.filter(isOpenOrder)
      const openRfqs = store.rfqs.filter((r) => !['converted', 'rejected'].includes(r.status))
      const quoted = store.rfqs.filter((r) => r.status === 'quoted')
      const booked = store.rfqs.filter((r) => ['accepted', 'converted'].includes(r.status))
      const openLeads = store.leads.filter((l) => !['won', 'lost'].includes(l.status))
      const overdue = openOrders.filter((o) => o.dueDate && o.dueDate < today)
      const pendingSamples = store.samples.filter((s) => ['requested', 'approved', 'in_production'].includes(s.status))

      return {
        generatedAt: nowIso(),
        kpis: {
          customers: store.customers.length,
          products: store.products.length,
          openRfqs: openRfqs.length,
          quotesAwaitingDecision: quoted.length,
          pipelineValue: sum(quoted, (r) => r.quotedTotal),
          bookedValue: sum(booked, (r) => r.quotedTotal),
          openOrders: openOrders.length,
          unitsInProduction: sum(openOrders, (o) => o.qty),
          overdueOrders: overdue.length,
          openLeads: openLeads.length,
          unassignedLeads: openLeads.filter((l) => !l.assignedTo).length,
          pendingSamples: pendingSamples.length,
        },
        funnels: {
          rfq: countBy(store.rfqs, 'status', RFQ_STATUSES),
          order: countBy(store.orders, 'status', ORDER_STATUSES),
          lead: countBy(store.leads, 'status', LEAD_STATUSES),
          sample: countBy(store.samples, 'status', SAMPLE_STATUSES),
          leadSource: countBy(store.leads, 'source', LEAD_SOURCES),
        },
        production: {
          stages: stages(),
          byStage: Object.fromEntries(stages().map((s) => [s.id, openOrders.filter((o) => o.stage === s.id).length])),
          orders: openOrders.map(withProgress),
        },
        attention: {
          overdueOrders: overdue.map(withProgress),
          quotesAwaitingDecision: quoted.slice(0, 5).map(enrich),
          unassignedLeads: openLeads.filter((l) => !l.assignedTo).slice(0, 5),
          samplesToAction: pendingSamples.slice(0, 5).map(enrichSample),
        },
        recentActivity: EVENTS.slice(0, 10),
        webhookConfigured: webhookConfigured(),
      }
    },
  },
  {
    method: 'GET', path: '/api/admin/events',
    handler: ({ req, query }) => {
      requireRole(req, 'admin')
      let items = [...EVENTS]
      if (query.type) items = items.filter((e) => e.type === query.type)
      const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)
      return {
        total: EVENTS.length,
        types: [...new Set(EVENTS.map((e) => e.type))].sort(),
        webhookConfigured: webhookConfigured(),
        events: items.slice(0, limit),
      }
    },
  },
]
