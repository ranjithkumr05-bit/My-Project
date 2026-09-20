// Thin API client for the Customwear backend. Same-origin /api in dev
// (vite proxy) and prod; override with VITE_API_BASE for split deploys.
const BASE = import.meta.env.VITE_API_BASE || ''

let token = null
try { token = sessionStorage.getItem('cw_token') || null } catch { /* private mode */ }

export function getToken() { return token }

export function setToken(next) {
  token = next
  try {
    if (next) sessionStorage.setItem('cw_token', next)
    else sessionStorage.removeItem('cw_token')
  } catch { /* ignore */ }
}

async function request(method, path, body) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(json?.error || `HTTP ${res.status}`)
    err.status = res.status
    err.details = json?.details
    throw err
  }
  return json
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, body) => request('POST', p, body),
  patch: (p, body) => request('PATCH', p, body),
}

// ---- Domain calls ----
export const Auth = {
  async login(email, password) {
    const res = await api.post('/api/auth/login', { email, password })
    setToken(res.token)
    return res.user
  },
  async logout() {
    try { await api.post('/api/auth/logout') } catch { /* token may be dead */ }
    setToken(null)
  },
  me: () => api.get('/api/auth/me'),
}

export const Catalogue = {
  categories: () => api.get('/api/catalogue/categories'),
  products: (query = '') => api.get(`/api/products${query}`),
  product: (id) => api.get(`/api/products/${id}`),
  branding: () => api.get('/api/catalogue/branding'),
  fabrics: () => api.get('/api/catalogue/fabrics'),
  stages: () => api.get('/api/catalogue/stages'),
  reference: () => api.get('/api/reference'),
}

export const Rfqs = {
  list: () => api.get('/api/rfqs'),
  get: (id) => api.get(`/api/rfqs/${id}`),
  create: (body) => api.post('/api/rfqs', body),
  setStatus: (id, status) => api.patch(`/api/rfqs/${id}/status`, { status }),
}

export const Orders = {
  list: () => api.get('/api/orders'),
  get: (id) => api.get(`/api/orders/${id}`),
  setStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }),
}

export const Leads = {
  list: () => api.get('/api/leads'),
  create: (body) => api.post('/api/leads', body),
  update: (id, body) => api.patch(`/api/leads/${id}`, body),
}

export const Samples = {
  list: () => api.get('/api/samples'),
  create: (body) => api.post('/api/samples', body),
  setStatus: (id, status) => api.patch(`/api/samples/${id}/status`, { status }),
}

export const Dashboard = {
  customer: () => api.get('/api/customers/me'),
  admin: () => api.get('/api/admin/dashboard'),
}

export const WhatsApp = {
  cta: () => api.get('/api/whatsapp/cta'),
}

// Enum reference for forms (statuses, MOQ rules, sizes, sources).
export const Reference = {
  get: () => api.get('/api/reference'),
}

