// all-pages.spec.mjs — full-site sweep across every route (project-local @playwright/test).
// Run from frontend/: npx playwright test all-pages.spec.mjs --reporter=list
import os from 'node:os'
import { test, expect } from '@playwright/test'
import { REQUIRED_SLUGS, serviceBySlug } from './src/data/services.js'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4300'
// LAN URL resolves this machine's current IPv4 (override with WIFI_URL); the IP can
// change when the network changes, so never hardcode it here.
const LAN_URL = process.env.WIFI_URL || (() => {
  const ip = Object.values(os.networkInterfaces()).flat()
    .find((i) => i && !i.internal && i.family === 'IPv4')?.address
  return ip ? `http://${ip}:4300` : null
})()
const PUBLIC_ROUTES = ['/', '/about', '/services', '/process', '/portfolio', '/blog', '/contact']
const SERVICE_ROUTES = REQUIRED_SLUGS.map((s) => `/services/${s}`)
const ALL_ROUTES = [...PUBLIC_ROUTES, ...SERVICE_ROUTES]
// Intentional placeholder: no genuine group/event photo exists yet (renders "Photo coming soon").
const INTENTIONAL = /\/showcase\/gpt\/group-event\./

// Navigate, force lazy images to load, then return to top.
async function load(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(350)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
}

test.describe.configure({ mode: 'parallel' })

test('site sweep: every route renders main + h1, no broken images, no console errors, no failed requests', async ({ page }) => {
  const problems = []
  const failed = []
  page.on('requestfailed', (r) => { if (!INTENTIONAL.test(r.url())) failed.push(r.url()) })

  for (const route of ALL_ROUTES) {
    const errs = []
    const eh = (e) => errs.push(String(e))
    page.on('pageerror', eh)
    await load(page, route)
    page.off('pageerror', eh)

    if (!(await page.locator('#main').count())) problems.push(`${route}: missing #main landmark`)
    if ((await page.locator('h1').count()) < 1) problems.push(`${route}: no h1 heading`)

    const broken = await page.$$eval('img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    )
    if (broken.length) problems.push(`${route}: broken images -> ${broken.join(', ')}`)

    const text = (await page.locator('#main').innerText()).toLowerCase()
    for (const bad of ['uniform', 'safety jacket', 'reflective', 'hi-vis', 'high-vis', 'tote bag', 'welcome kit']) {
      if (text.includes(bad)) problems.push(`${route}: prohibited wording "${bad}"`)
    }
    for (const e of errs) problems.push(`${route}: pageerror ${e}`)
  }

  expect(problems, problems.join('\n')).toEqual([])
  expect(failed, `failed requests: ${failed.join(', ')}`).toEqual([])
})

test('each service page shows exactly 8 subcategories and a quote link to /contact', async ({ page }) => {
  for (const slug of REQUIRED_SLUGS) {
    const svc = serviceBySlug(slug)
    await load(page, `/services/${slug}`)
    await expect(page.locator('.cw-subcard'), slug).toHaveCount(8)
    await expect(page.locator('a[href^="/contact"].btn-gold').first(), slug).toBeVisible()
    await expect(page.locator('h1', { hasText: svc.heroHeadline })).toBeVisible()
  }
})

test('primary nav covers all 7 pages and each navigates', async ({ page }) => {
  await load(page, '/')
  const navLinks = ['Home', 'About', 'Services', 'Process', 'Portfolio', 'Blog', 'Contact']
  for (const label of navLinks) {
    await expect(page.locator('.cw-nav').getByRole('link', { name: label })).toBeVisible()
  }
  for (const [label, path] of [['About', '/about'], ['Process', '/process'], ['Blog', '/blog']]) {
    await page.locator('.cw-nav').getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    await page.goBack()
  }
})

test('mobile menu opens, navigates and closes at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await load(page, '/')
  await expect(page.locator('.cw-nav.open')).toHaveCount(0)
  await page.locator('.cw-burger').click()
  await expect(page.locator('.cw-nav.open')).toHaveCount(1)
  await page.locator('.cw-nav').getByRole('link', { name: 'Portfolio' }).click()
  await expect(page).toHaveURL(/\/portfolio$/)
  await expect(page.locator('.cw-nav.open')).toHaveCount(0)
})

test('no horizontal overflow on key pages at 390 / 768 / 1440', async ({ page }) => {
  for (const route of ['/', '/services', '/services/group-event-tshirts', '/portfolio', '/blog', '/contact']) {
    for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width: w, height: h })
      await load(page, route)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${route} overflow ${overflow}px at ${w}x${h}`).toBeLessThanOrEqual(1)
    }
  }
})

test('services page: 8 cards in approved order, 4-column grid, card click opens its detail page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await load(page, '/services')
  const cols = await page.evaluate(
    () => getComputedStyle(document.querySelector('.cw-cards')).gridTemplateColumns.split(' ').length,
  )
  expect(cols, `expected 4 columns on desktop, got ${cols}`).toBe(4)

  const titles = await page.$$eval('.cw-cards .cw-card h3', (els) => els.map((e) => e.textContent))
  expect(titles).toEqual(REQUIRED_SLUGS.map((s) => serviceBySlug(s).name))

  // click-through: card -> its own detail page -> its 8 subcategories are present
  await page.locator('.cw-cards .cw-card a').first().click()
  await expect(page).toHaveURL(/\/services\/corporate-office-apparel$/)
  await expect(page.locator('.cw-subcard')).toHaveCount(8)
  await expect(page.locator('h2', { hasText: 'Subcategories' })).toBeVisible()
})

test('contact form: empty contact info shows error, valid submission reaches /api/leads', async ({ page }) => {
  await load(page, '/contact')
  await page.locator('input[name="name"]').fill('Playwright Check')
  await page.locator('button', { hasText: 'Send Enquiry' }).click()
  await expect(page.locator('.cw-formerr')).toContainText('Add an email or a phone')

  let posted = null
  page.on('request', (r) => { if (r.url().endsWith('/api/leads') && r.method() === 'POST') posted = r })
  await page.locator('input[name="phone"]').fill('9000000000')
  await page.locator('button', { hasText: 'Send Enquiry' }).click()
  await expect(page.locator('.cw-thanks')).toContainText('Enquiry received')
  await expect.poll(() => posted?.method()).toBe('POST')
})

test('unknown route falls back to Home for browsers', async ({ page }) => {
  await load(page, '/no-such-page-xyz')
  await expect(page).toHaveURL(/\/no-such-page-xyz$/)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('home hero: 10 pcs MOQ card and category arrow points to /services', async ({ page }) => {
  await load(page, '/')
  await expect(page.locator('.cw-hero-card').filter({ hasText: 'minimum order quantity' })).toContainText('10 pcs')
  await expect(page.locator('a[aria-label="View services"]')).toHaveAttribute('href', '/services')
  await page.locator('a[aria-label="View services"]').click()
  await expect(page).toHaveURL(/\/services$/)
})

test('shared WiFi URL is reachable and serves the site', async ({ request }) => {
  test.skip(!LAN_URL, 'no non-internal IPv4 address on this machine')
  const res = await request.get(`${LAN_URL}/portfolio`, { headers: { accept: 'text/html' } })
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/html')
})