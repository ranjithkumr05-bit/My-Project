// src/store.mjs - in-memory store seeded from data/*.json.
// NO DATABASE IS CONNECTED. Mutations live in memory (and optionally in
// data/runtime.json when PERSIST=1). This module is the single seam where a
// real database adapter would plug in later - routes never touch files.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data')
const RUNTIME_FILE = path.join(DATA_DIR, 'runtime.json')
export const PERSIST = process.env.PERSIST === '1'

const readDoc = async (file) => JSON.parse(await readFile(path.join(DATA_DIR, file), 'utf8'))

const catalogue = await readDoc('catalogue.json')
const customersDoc = await readDoc('customers.json')
const accountsDoc = await readDoc('accounts.json')
const operations = await readDoc('operations.json')

if (PERSIST) {
  try {
    const overlay = JSON.parse(await readFile(RUNTIME_FILE, 'utf8'))
    for (const key of ['rfqs', 'orders', 'leads', 'samples']) {
      if (Array.isArray(overlay[key])) operations[key] = overlay[key]
    }
    // Customers seed from their own file, not from operations.json, so the
    // overlay has to target customersDoc directly.
    if (Array.isArray(overlay.customers)) customersDoc.customers = overlay.customers
    // Same for accounts: user.password is already a scrypt hash here, never plaintext.
    if (Array.isArray(overlay.users)) accountsDoc.users = overlay.users
  } catch {
    /* first run: no runtime file yet */
  }
}

export const store = {
  meta: catalogue.meta,
  brandingOptions: catalogue.brandingOptions,
  fabricOptions: catalogue.fabricOptions,
  products: catalogue.products,
  customers: customersDoc.customers,
  users: accountsDoc.users,
  rfqs: operations.rfqs,
  orders: operations.orders,
  leads: operations.leads,
  samples: operations.samples,
}

export const RFQ_STATUSES = ['draft', 'submitted', 'in_review', 'quoted', 'accepted', 'rejected', 'converted']
export const ORDER_STATUSES = ['pending', 'in_production', 'on_hold', 'completed', 'cancelled']
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost']
export const SAMPLE_STATUSES = ['requested', 'approved', 'in_production', 'shipped', 'delivered', 'rejected']
export const LEAD_SOURCES = ['whatsapp', 'website_form', 'registration', 'configurator', 'email', 'phone']

export const productById = (id) => store.products.find((p) => p.id === id) || null
export const customerById = (id) => store.customers.find((c) => c.id === id) || null
export const userById = (id) => store.users.find((u) => u.id === id) || null
export const stages = () => store.meta.productionStages

/** Next id in a collection, e.g. nextId(store.rfqs, 'rfq-') -> 'rfq-2007'. */
export function nextId(collection, prefix) {
  const top = collection.reduce((max, r) => {
    const n = Number(String(r.id).replace(`${prefix}`, ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `${prefix}${top + 1}`
}

/** MOQ for a product: the product's own value wins, else the category rule. */
export function moqFor(product, category) {
  if (product && Number.isFinite(product.moq)) return product.moq
  const cat = category || product?.category
  return store.meta.moqRules[cat] ?? 0
}

/**
 * Validate RFQ line items against MOQ rules and branding minimums.
 * errors block creation; warnings are surfaced for the sales team.
 */
export function validateItems(items) {
  const errors = []
  const warnings = []
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ code: 'NO_ITEMS', message: 'At least one line item is required' })
    return { errors, warnings }
  }
  items.forEach((item, index) => {
    const product = productById(item.productId)
    if (!product) {
      errors.push({ code: 'UNKNOWN_PRODUCT', index, message: `Unknown product "${item.productId}"` })
      return
    }
    const qty = Number(item.qty)
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push({ code: 'BAD_QTY', index, message: 'Quantity must be a positive number' })
      return
    }
    const moq = moqFor(product)
    if (qty < moq) {
      errors.push({
        code: 'MOQ_NOT_MET',
        index,
        productId: product.id,
        message: `${product.name} has a minimum order quantity of ${moq} (requested ${qty})`,
        moq,
      })
    }
    for (const b of item.branding || []) {
      const option = store.brandingOptions.find((o) => o.id === b)
      if (!option) {
        errors.push({ code: 'UNKNOWN_BRANDING', index, message: `Unknown branding option "${b}"` })
        continue
      }
      if (!product.branding.includes(b)) {
        warnings.push({ code: 'BRANDING_NOT_STANDARD', index, message: `${option.label} is not standard for ${product.name}` })
      }
      if (qty < option.minQty) {
        warnings.push({ code: 'BRANDING_BELOW_MIN', index, message: `${option.label} needs ${option.minQty} pcs minimum (requested ${qty})` })
      }
    }
  })
  return { errors, warnings }
}

export async function persist() {
  if (!PERSIST) return false
  // customers + users included: admin can now create/edit them, the order tracker
  // resolves the buyer's contact through customers, and portal logins live in users.
  const payload = JSON.stringify({
    rfqs: store.rfqs, orders: store.orders, leads: store.leads,
    samples: store.samples, customers: store.customers, users: store.users,
  }, null, 2)
  await writeFile(RUNTIME_FILE, payload)
  return true
}

export function counts() {
  return {
    products: store.products.length,
    customers: store.customers.length,
    users: store.users.length,
    rfqs: store.rfqs.length,
    orders: store.orders.length,
    leads: store.leads.length,
    samples: store.samples.length,
  }
}
