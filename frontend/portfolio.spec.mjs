// portfolio.spec.mjs — Portfolio browser tests (project-local @playwright/test).
// Run from frontend/: npx playwright test portfolio.spec.mjs
// Gallery pics/contents are intentionally absent (to be set separately).
import { test, expect } from '@playwright/test'

// Override for a dev server on a non-default port: BASE_URL=http://localhost:5174
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4300'

test.describe.configure({ mode: 'parallel' })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
})

test('portfolio page renders hero + CTA band, with no gallery yet', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const failed = []
  page.on('requestfailed', (r) => failed.push(r.url()))

  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' })

  await expect(page.getByRole('heading', { name: 'Real Apparel. Made with Care.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Have an Apparel Project in Mind?' })).toBeVisible()

  // gallery + category filters are set separately — page must ship without them
  await expect(page.locator('.cw-filter')).toHaveCount(0)
  await expect(page.locator('.cw-workcard')).toHaveCount(0)
  await expect(page.locator('.cw-workcard img')).toHaveCount(0)

  expect(failed, `failed requests: ${failed.join(', ')}`).toEqual([])
  expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([])
})

test('CTA band links target valid routes', async ({ page }) => {
  await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' })
  const band = page.locator('.cw-cta-band')
  await expect(band.locator('a.cw-gold-btn', { hasText: 'Get a Quote' })).toHaveAttribute('href', /\/contact\?type=quote/)
  await expect(band.locator('a.btn', { hasText: 'Request a Sample' })).toHaveAttribute('href', /\/contact\?type=sample/)
  for (const h of ['/contact?type=quote', '/contact?type=sample']) {
    const res = await page.request.get(`${BASE}${h}`, { headers: { accept: 'text/html' } })
    expect(res.status(), `${h} should serve the SPA`).toBe(200)
  }
})

test('responsive: no horizontal overflow at 390/768/1440', async ({ page }) => {
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow ${overflow}px at ${w}px`).toBeLessThanOrEqual(1)
  }
})
