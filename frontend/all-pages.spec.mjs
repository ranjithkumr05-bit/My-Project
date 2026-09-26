// all-pages.spec.mjs — full-site sweep across every route (project-local @playwright/test).
// Run from frontend/: npx playwright test all-pages.spec.mjs --reporter=list
import os from 'node:os'
import {test, expect} from '@playwright/test'
import {REQUIRED_SLUGS, serviceBySlug} from './src/data/services.js'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4300'
// LAN URL resolves this machine's current IPv4 (override with WIFI_URL); the IP can
// change when the network changes, so never hardcode it here. Same server as BASE,
// just reached over the LAN interface — so take the port from BASE too, or a dev
// server on a non-default port (Vite 5174, backend 4399) fails this check.
const LAN_URL =
  process.env.WIFI_URL ||
  (() => {
    const ip = Object.values(os.networkInterfaces())
      .flat()
      .find((i) => i && !i.internal && i.family === 'IPv4')?.address
    return ip ? `http://${ip}:${new URL(BASE).port || 80}` : null
  })()
const PUBLIC_ROUTES = ['/', '/about', '/services', '/process', '/portfolio', '/blog', '/contact']
const SERVICE_ROUTES = REQUIRED_SLUGS.map((s) => `/services/${s}`)
const ALL_ROUTES = [...PUBLIC_ROUTES, ...SERVICE_ROUTES]
// Intentional placeholder: no genuine group/event photo exists yet (renders "Photo coming soon").
const INTENTIONAL = /\/showcase\/gpt\/group-event\./

// Navigate, force lazy images to load, then return to top.
async function load(page, route) {
  await page.goto(`${BASE}${route}`, {waitUntil: 'load'})
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(350)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
}

test.describe.configure({mode: 'parallel'})

test('site sweep: every route renders main + h1, no broken images, no console errors, no failed requests', async ({
  page,
}) => {
  const problems = []
  const failed = []
  page.on('requestfailed', (r) => {
    if (!INTENTIONAL.test(r.url())) failed.push(r.url())
  })

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
    // Out-of-scope product words: the catalogue is apparel only, so safety/PPE goods,
    // bags and gift kits must never be advertised. "uniform" was dropped from this
    // list when two categories were renamed to "School Uniforms" / "Retail Uniforms" —
    // the bare substring now collides with approved category names, so guarding on it
    // would ban our own headings. Outfit scope is still covered by the PPE words.
    for (const bad of [
      'safety jacket',
      'reflective',
      'hi-vis',
      'high-vis',
      'tote bag',
      'welcome kit',
    ]) {
      if (text.includes(bad)) problems.push(`${route}: prohibited wording "${bad}"`)
    }
    for (const e of errs) problems.push(`${route}: pageerror ${e}`)
  }

  expect(problems, problems.join('\n')).toEqual([])
  expect(failed, `failed requests: ${failed.join(', ')}`).toEqual([])
})

test('each service page shows exactly 8 subcategories and a quote link to /contact', async ({
  page,
}) => {
  for (const slug of REQUIRED_SLUGS) {
    const svc = serviceBySlug(slug)
    await load(page, `/services/${slug}`)
    await expect(page.locator('.cw-subcard'), slug).toHaveCount(8)
    await expect(page.locator('a[href^="/contact"].btn-gold').first(), slug).toBeVisible()
    await expect(page.locator('h1', {hasText: svc.heroHeadline})).toBeVisible()
  }
})

test('roles: admin reaches the portal, a registered buyer stays public and is locked out of /admin', async ({
  page,
}) => {
  // Sample accounts that ship in data/accounts.json. They are deliberately not
  // printed on /login any more, so they are read from here instead.
  const ADMIN = {email: 'admin@customwear.sample', password: 'admin123'}
  const BUYER = {email: 'buyer@greenfield.sample', password: 'buyer123'}
  const clearSession = async () => {
    await page.goto(`${BASE}/`, {waitUntil: 'load'})
    await page.evaluate(() => sessionStorage.clear())
  }
  const signIn = async ({email, password}) => {
    await page.goto(`${BASE}/login`, {waitUntil: 'load'})
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('button.btn-primary')
    await page.waitForURL((u) => !u.pathname.startsWith('/login'))
  }

  // Admin: sign-in goes to the portal, and the admin API is readable.
  await clearSession()
  await signIn(ADMIN)
  await expect(page).toHaveURL(/\/admin$/)
  const adminStatus = await page.evaluate(async () => {
    const r = await fetch('/api/leads', {
      headers: {Authorization: `Bearer ${sessionStorage.getItem('cw_token')}`},
    })
    return r.status
  })
  expect(adminStatus, 'admin should read /api/leads').toBe(200)

  // Buyer: sign-in lands on the public home page, and the Account link must not
  // point at the portal (it used to, which bounced them via /admin -> /).
  await clearSession()
  await signIn(BUYER)
  await expect(page).toHaveURL(new RegExp(`${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`))
  await expect(page.locator('.cw-header-actions .cw-loginlink')).toHaveAttribute('href', '/')

  // Buyer: every admin API is refused, and every portal route bounces home.
  const api = await page.evaluate(async () => {
    const t = sessionStorage.getItem('cw_token')
    const out = {}
    for (const p of ['/api/leads', '/api/customers', '/api/users']) {
      out[p] = (await fetch(p, {headers: {Authorization: `Bearer ${t}`}})).status
    }
    return out
  })
  for (const [p, status] of Object.entries(api))
    expect(status, `buyer must not read ${p}`).toBe(403)

  for (const route of ['/admin', '/admin/leads', '/admin/customers']) {
    await page.goto(`${BASE}${route}`, {waitUntil: 'load'})
    await expect(page, `buyer must not reach ${route}`).toHaveURL(
      new RegExp(`${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`),
    )
  }

  // Registering creates a lead, not a login, and returns the visitor home.
  await clearSession()
  await page.goto(`${BASE}/register`, {waitUntil: 'load'})
  await page.fill('input[name=name]', 'Role Flow Test')
  await page.fill('input[name=email]', 'roleflow@example.com')
  await page.fill('input[name=phone]', '9876543210')
  await page.click('button.btn-gold')
  await expect(page.locator('.cw-thanks')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`), {
    timeout: 8000,
  })
  // Still a visitor: no session was created by registering.
  expect(
    await page.evaluate(() => !!sessionStorage.getItem('cw_token')),
    'register must not sign anyone in',
  ).toBe(false)
})

test('primary nav drops Process from the header but keeps every route navigable', async ({
  page,
}) => {
  await load(page, '/')
  // Track Order is a nav item with no dedicated page test below, so assert it here.
  const headerLinks = ['Home', 'About', 'Services', 'Portfolio', 'Blog', 'Track Order']
  for (const label of headerLinks) {
    await expect(page.locator('.cw-nav').getByRole('link', {name: label})).toBeVisible()
  }
  // The desktop gold "Get a Quote" CTA was replaced by the Register link, so
  // .cw-header-actions now holds Register + burger. The only Get a Quote in .cw-nav
  // is the mobile-only twin, which must stay hidden at desktop width.
  await expect(page.locator('.cw-header-actions .cw-loginlink')).toHaveText(/Register/)
  await expect(page.locator('.cw-nav .cw-nav-cta-mobile')).toBeHidden()
  await expect(page.locator('.cw-nav').getByRole('link', {name: 'Process'})).toHaveCount(0)
  for (const [label, path] of [
    ['About', '/about'],
    ['Portfolio', '/portfolio'],
    ['Blog', '/blog'],
  ]) {
    await page.locator('.cw-nav').getByRole('link', {name: label}).click()
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    await page.goBack()
  }
  // Process now sits in neither nav — the footer links the public routes but not
  // /process — so the route stays navigable through the Home journey CTA instead.
  await expect(
    page.locator('footer nav[aria-label="footer"]').getByRole('link', {name: 'Process'}),
  ).toHaveCount(0)
  await page.getByRole('link', {name: 'Full process'}).click()
  await expect(page).toHaveURL(/\/process$/)
})

test('service cards: CTA reads just "Explore" while staying uniquely labelled', async ({page}) => {
  // The product name already sits in the h3, so the button dropped it. Eight
  // links all reading "Explore" are ambiguous to a screen reader, so the
  // aria-label has to carry the name while the visible text stays short.
  await load(page, '/services')
  const ctas = page.locator('.cw-card-ctas a.btn-gold')
  await expect(ctas).toHaveCount(8)
  for (const text of await ctas.allTextContents()) expect(text.trim()).toBe('Explore')
  const labels = await ctas.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
  expect(labels).toEqual(REQUIRED_SLUGS.map((s) => `Explore ${serviceBySlug(s).name}`))
})

test('home: services sits above the trust story, the order the brief asked for', async ({page}) => {
  // Regression: the services grid and the Tiruppur trust block were swapped, so
  // the eight categories lead and the story follows.
  await load(page, '/')
  const order = await page.$$eval('main > section', (secs) =>
    secs.map((s) => s.querySelector('h1, h2')?.textContent?.trim() || s.className),
  )
  expect(order[0]).toBe('We build exactly to your spec.')
  expect(order[1]).toBe('Every category is made on one manufacturing floor')
  expect(order[2]).toBe('Two decades around garments, one team on your order')
  // Exactly one services grid, not a leftover duplicate from the move.
  await expect(page.locator('main .cw-cards .cw-service-card')).toHaveCount(8)
})

test('the login page is not a dead end: it offers Register and a way back', async ({page}) => {
  // Regression: /login renders outside PageShell, so it had no header, no footer
  // and no links at all — the header CTA dropped visitors into an admin-only console
  // with no route to self-registration and no way out.
  await page.goto(`${BASE}/login`, {waitUntil: 'load'})
  await expect(page.getByRole('link', {name: 'Register'})).toBeVisible()
  await expect(page.getByRole('link', {name: 'Back to site'})).toBeVisible()

  // Register is the public entry point, so the header CTA must land there.
  await page.goto(`${BASE}/`, {waitUntil: 'load'})
  await page.evaluate(() => sessionStorage.clear())
  await page.locator('.cw-header-actions .cw-loginlink').click()
  await expect(page).toHaveURL(/\/register$/)

  // Registering files a lead and returns the visitor to the home page.
  await page.fill('input[name=name]', 'Wants A Quote')
  await page.fill('input[name=email]', 'quote-seeker@example.com')
  await page.click('button.btn-gold')
  await expect(page.locator('.cw-thanks')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`), {
    timeout: 8000,
  })
  // Registration must not quietly sign anyone in.
  expect(
    await page.evaluate(() => !!sessionStorage.getItem('cw_token')),
    'register must not sign anyone in',
  ).toBe(false)
})

test('the public site never links to the admin login page', async ({page}) => {
  // Regression: the header CTA used to read "Account" and point at /login, which
  // is the admin console — and that page printed the sample admin password. The
  // public site must offer Register and stay clear of the login route entirely.
  await page.goto(`${BASE}/`, {waitUntil: 'load'})
  await page.evaluate(() => sessionStorage.clear())
  const account = page.locator('.cw-header-actions .cw-loginlink')
  await expect(account).toHaveText(/Register/)
  await expect(account).toHaveAttribute('href', '/register')

  // No public route may link a visitor into /login (header, nav, footer, body).
  for (const route of [...PUBLIC_ROUTES, '/register', '/track']) {
    await page.goto(`${BASE}${route}`, {waitUntil: 'load'})
    const hrefs = await page
      .locator('a[href="/login"], a[href*="/login"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs, `${route} must not link to /login`).toEqual([])
  }

  // The page itself stays reachable by direct URL, but prints no credentials.
  await page.goto(`${BASE}/login`, {waitUntil: 'load'})
  await expect(page.locator('#email')).toBeVisible()
  const body = await page.locator('body').innerText()
  for (const secret of ['admin123', 'buyer123', 'admin@customwear.sample'])
    expect(body, `/login must not print ${secret}`).not.toContain(secret)
})

test('the price calculator lives on /services only, never on a service page', async ({page}) => {
  // One copy on /services: the calculator has a service picker, so putting the
  // same form on all eight detail pages just repeated it eight times over.
  await load(page, '/services')
  await expect(page.locator('.cw-cost-calc')).toHaveCount(1)
  await expect(page.locator('.cw-cost-calc select').first()).toHaveValue(REQUIRED_SLUGS[0])

  for (const slug of REQUIRED_SLUGS) {
    await load(page, `/services/${slug}`)
    await expect(
      page.locator('.cw-cost-calc'),
      `${slug} must not repeat the calculator`,
    ).toHaveCount(0)
    // The page still has to hand the visitor back to the one calculator.
    await expect(page.getByRole('link', {name: 'Services', exact: true}).first()).toBeVisible()
  }
})

test('mobile menu opens, navigates and closes at 390px', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844})
  await load(page, '/')
  await expect(page.locator('.cw-nav.open')).toHaveCount(0)
  await page.locator('.cw-burger').click()
  await expect(page.locator('.cw-nav.open')).toHaveCount(1)
  await page.locator('.cw-nav').getByRole('link', {name: 'Portfolio'}).click()
  await expect(page).toHaveURL(/\/portfolio$/)
  await expect(page.locator('.cw-nav.open')).toHaveCount(0)
})

test('no horizontal overflow on key pages at 390 / 768 / 1440', async ({page}) => {
  for (const route of [
    '/',
    '/services',
    '/services/group-event-tshirts',
    '/portfolio',
    '/blog',
    '/contact',
  ]) {
    for (const [w, h] of [
      [390, 844],
      [768, 1024],
      [1440, 900],
    ]) {
      await page.setViewportSize({width: w, height: h})
      await load(page, route)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${route} overflow ${overflow}px at ${w}x${h}`).toBeLessThanOrEqual(1)
    }
  }
})

test('footer columns align with the content band above at every width', async ({page}) => {
  // Regression: the footer used to carry max-width:1180px (copied from the admin
  // .shell), so past ~1280px it floated as a narrow centred block under
  // full-width content. Its edges must now match the page gutter at all widths.
  for (const w of [390, 768, 1280, 1920]) {
    await page.setViewportSize({width: w, height: 900})
    await load(page, '/')
    const edges = await page.evaluate(() => {
      const sec = document.querySelector('main .cw-section, main .cw-hero')
      const cs = getComputedStyle(sec)
      const r = sec.getBoundingClientRect()
      const g = document.querySelector('.cw-foot-grid').getBoundingClientRect()
      const b = document.querySelector('.cw-foot-bottom').getBoundingClientRect()
      const contentL = r.x + parseFloat(cs.paddingLeft)
      const contentR = r.right - parseFloat(cs.paddingRight)
      return {
        contentL: Math.round(contentL),
        contentR: Math.round(contentR),
        gridL: Math.round(g.x),
        gridR: Math.round(g.right),
        botL: Math.round(b.x),
        botR: Math.round(b.right),
      }
    })
    expect(Math.abs(edges.gridL - edges.contentL), `footer grid left @${w}`).toBeLessThanOrEqual(1)
    expect(Math.abs(edges.gridR - edges.contentR), `footer grid right @${w}`).toBeLessThanOrEqual(1)
    expect(Math.abs(edges.botL - edges.contentL), `footer bottom left @${w}`).toBeLessThanOrEqual(1)
    expect(Math.abs(edges.botR - edges.contentR), `footer bottom right @${w}`).toBeLessThanOrEqual(
      1,
    )
  }
})

test('services page: 8 cards in approved order, 4-column grid, card click opens its detail page', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 900})
  await load(page, '/services')
  const cols = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.cw-cards')).gridTemplateColumns.split(' ').length,
  )
  expect(cols, `expected 4 columns on desktop, got ${cols}`).toBe(4)

  const titles = await page.$$eval('.cw-cards .cw-card h3', (els) => els.map((e) => e.textContent))
  expect(titles).toEqual(REQUIRED_SLUGS.map((s) => serviceBySlug(s).name))

  // click-through: card -> its own detail page -> its 8 subcategories are present
  await page.locator('.cw-cards .cw-card a').first().click()
  await expect(page).toHaveURL(/\/services\/corporate-office-apparel$/)
  await expect(page.locator('.cw-subcard')).toHaveCount(8)
  await expect(page.locator('h2', {hasText: 'Subcategories'})).toBeVisible()
})

test('contact form: empty contact info shows error, valid submission reaches /api/leads', async ({
  page,
}) => {
  await load(page, '/contact')
  await page.locator('input[name="name"]').fill('Playwright Check')
  await page.locator('button', {hasText: 'Send Enquiry'}).click()
  await expect(page.locator('.cw-formerr')).toContainText('Add an email or a phone')

  let posted = null
  page.on('request', (r) => {
    if (r.url().endsWith('/api/leads') && r.method() === 'POST') posted = r
  })
  await page.locator('input[name="phone"]').fill('9000000000')
  await page.locator('button', {hasText: 'Send Enquiry'}).click()
  await expect(page.locator('.cw-thanks')).toContainText('Enquiry received')
  await expect.poll(() => posted?.method()).toBe('POST')
})

test('unknown route falls back to Home for browsers', async ({page}) => {
  await load(page, '/no-such-page-xyz')
  await expect(page).toHaveURL(/\/no-such-page-xyz$/)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('home hero: 10 pcs MOQ card and category card has no overlapping action icon', async ({
  page,
}) => {
  await load(page, '/')
  // One metric area only: the split hero keeps the right column, no duplicate bottom row.
  await expect(page.locator('.cw-hero-card')).toHaveCount(4)
  await expect(page.locator('.cw-hero-stats')).toHaveCount(0)
  await expect(
    page.locator('.cw-hero-card').filter({hasText: 'minimum order quantity'}),
  ).toContainText('10 pcs')
  await expect(
    page.locator('.cw-hero-card').filter({hasText: 'product categories'}).locator('svg'),
  ).toHaveCount(0)
})

test('service cards: CTA buttons share a bottom baseline in each desktop row', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900})
  await load(page, '/services')
  const bottoms = await page.$$eval('.cw-cards .cw-service-card', (cards) =>
    cards.map((c) => c.querySelector('.cw-card-ctas').getBoundingClientRect().bottom),
  )
  expect(bottoms).toHaveLength(8)
  for (let row = 0; row < 2; row += 1) {
    const slice = bottoms.slice(row * 4, row * 4 + 4)
    expect(
      Math.max(...slice) - Math.min(...slice),
      `row ${row + 1} CTA bottoms: ${slice.join(', ')}`,
    ).toBeLessThanOrEqual(1)
  }
})

test('shared WiFi URL is reachable and serves the site', async ({request}) => {
  test.skip(!LAN_URL, 'no non-internal IPv4 address on this machine')
  const res = await request.get(`${LAN_URL}/portfolio`, {headers: {accept: 'text/html'}})
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/html')
})

test('footer: 4 columns collapse to 1, with social, contact, WhatsApp and legal links wired up', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 900})
  await load(page, '/')
  const cols = () =>
    page
      .locator('.cw-foot-grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(await cols(), 'desktop footer should be 4 columns').toBe(4)

  // Products stays the curated five + the "view all" escape hatch, not the full catalogue.
  await expect(page.locator('footer nav[aria-label="footer products"] a')).toHaveCount(6)
  await expect(page.locator('footer nav[aria-label="footer products"]')).toContainText(
    'View all products',
  )
  // Seven: the six public routes plus /track (Track Order joined the header nav after
  // this test was written). Assert the labels too, so a dropped link fails here rather
  // than being absorbed by a count-only check.
  const quick = page.locator('footer nav[aria-label="footer"] a')
  await expect(quick).toHaveCount(7)
  await expect(quick).toHaveText([
    'Home',
    'About',
    'Services',
    'Portfolio',
    'Blog',
    'Track Order',
    'Contact',
  ])

  await expect(page.locator('.cw-foot-social a')).toHaveCount(3)
  await expect(
    page.locator('.cw-foot-social a[aria-label="Customwear on Instagram"]'),
  ).toBeVisible()
  await expect(page.locator('.cw-foot-contact a[href^="tel:"]')).toHaveCount(1)
  await expect(page.locator('.cw-foot-contact a[href^="mailto:"]')).toHaveAttribute(
    'href',
    'mailto:sales@customwear.in',
  )
  await expect(page.locator('.cw-foot-gstin')).toContainText('GSTIN')

  // Green brand button with navy ink — white on #25d366 is only 1.9:1.
  const wa = await page.locator('.cw-foot-wa').evaluate((el) => {
    const s = getComputedStyle(el)
    return `${s.backgroundColor}|${s.color}`
  })
  expect(wa).toBe('rgb(37, 211, 102)|rgb(10, 22, 40)')
  await expect(page.locator('.cw-foot-wa')).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+/)
  await expect(page.locator('.cw-foot-legal a')).toHaveCount(2)

  await page.setViewportSize({width: 390, height: 844})
  expect(await cols(), 'footer should stack on mobile').toBe(1)
})
