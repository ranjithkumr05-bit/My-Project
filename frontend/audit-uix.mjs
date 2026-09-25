// audit-uix.mjs â€” UI/UX audit sweep: all routes Ã— 5 viewports, rendered via Playwright.
// Run from frontend/: node audit-uix.mjs   (BASE_URL env overrides the origin)
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5174'
const SLUGS = [
  'corporate-office-apparel', 'sportswear-team-jerseys', 'school-college-tshirts',
  'workwear-staff-apparel', 'retail-store-apparel', 'hoodies-sweatshirts',
  'group-event-tshirts', 'private-label',
]
const ROUTES = ['/', '/about', '/services', ...SLUGS.map((s) => `/services/${s}`), '/process', '/portfolio', '/blog', '/contact']
const KNOWN = new Set(ROUTES)
// /blog/:slug posts are real routes (Blog.jsx POSTS + router.jsx), so treat their
// slugs as known destinations instead of flagging them as unknown links.
const BLOG_SLUGS = [
  'choosing-gsm-for-your-programme', 'why-sample-before-bulk',
  'screen-print-vs-embroidery', 'what-is-in-a-tech-pack',
]
for (const s of BLOG_SLUGS) KNOWN.add(`/blog/${s}`)
const VIEWPORTS = [[1440, 900], [1280, 800], [768, 1024], [390, 844], [360, 800]]
const SHOT_ROUTES = new Set(['/', '/services', '/services/corporate-office-apparel', '/portfolio', '/blog', '/contact', '/process', '/about'])
const INTENTIONAL = /\/showcase\/gpt\/group-event\./
const PROHIBITED = ['uniform', 'safety jacket', 'reflective', 'hi-vis', 'high-vis', 'tote bag', 'welcome kit']

const SHOTS = path.join(process.cwd(), 'audit-shots')
fs.mkdirSync(SHOTS, { recursive: true })

const findings = []
const add = (sev, route, vp, kind, detail) => findings.push({ sev, route, vp, kind, detail })

// Computed WCAG checks: text contrast (4.5:1 normal / 3:1 large), focus-visible
// style presence, and interactive target size. Runs in the page context.
const A11Y_FN = `(vw) => {
  const parse = (value) => {
    const m = String(value).match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const parts = m[1].split(',').map((n) => parseFloat(n))
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }
  const lum = ({ r, g, b }) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const bgFor = (el) => {
    let node = el
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor)
      if (c && c.a > 0.9) return c
      node = node.parentElement
    }
    return { r: 255, g: 255, b: 255, a: 1 }
  }
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  const out = { contrast: [], focus: [], targets: [] }
  // Text sitting on a photo/video backdrop cannot be scored from CSS colours alone
  // (the hero is white text over a dark video), so skip it instead of a false failure.
  const overMedia = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (getComputedStyle(n).backgroundImage !== 'none') return true
      if (n.querySelector(':scope > video')) return true
    }
    return false
  }
  const hasFocusVisible = [...document.styleSheets].some((sheet) => {
    try {
      return [...sheet.cssRules].some((rule) => rule.cssText && rule.cssText.includes(':focus-visible'))
    } catch { return false }
  })
  if (!hasFocusVisible) out.focus.push({ selector: 'document' })
  const els = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  })
  for (const el of els) {
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim()
    if (!text) continue
    if (overMedia(el)) continue
    const cs = getComputedStyle(el)
    const fg = parse(cs.color)
    if (!fg) continue
    const bg = bgFor(el)
    const composited = fg.a < 1 ? over(fg, bg) : fg
    const fontSize = parseFloat(cs.fontSize)
    const bold = parseInt(cs.fontWeight, 10) >= 700
    const large = fontSize >= 24 || (bold && fontSize >= 18.66)
    const need = large ? 3 : 4.5
    const got = ratio(composited, bg)
    if (got + 0.01 < need) {
      out.contrast.push({ selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), text: text.slice(0, 80), ratio: +got.toFixed(2), need, color: cs.color, bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')' })
    }
  }
  // 44px touch targets are enforced at mobile widths; desktop pointer targets can be smaller.
  if (vw <= 640) {
    for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      // Visually-hidden radios/checkboxes are not the tap target — their wrapping
      // <label> is, and that label is measured as its own element.
      if (cs.opacity === '0' && r.width <= 1) continue
      if (r.height < 44 || r.width < 44) out.targets.push({ selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), w: Math.round(r.width), h: Math.round(r.height) })
    }
  }
  return out
}`

const browser = await chromium.launch()
const page = await browser.newPage()

let consoleErrors = []
let pageErrors = []
let failedReqs = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('requestfailed', (r) => { if (!INTENTIONAL.test(r.url())) failedReqs.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`) })
page.on('response', (r) => { if (r.status() >= 400 && !INTENTIONAL.test(r.url())) failedReqs.push(`HTTP ${r.status()} ${r.url()}`) })

async function fresh(route, w, h) {
  consoleErrors = []; pageErrors = []; failedReqs = []
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
}


for (const [w, h] of VIEWPORTS) {
  const vp = `${w}x${h}`
  for (const route of ROUTES) {
    await fresh(route, w, h)

    const layout = await page.evaluate((vw) => {
      const de = document.documentElement
      const out = []
      for (const sel of ['#main > *', '.cw-header > *', '.cw-footer > *', '.cw-cards > *', '.cw-work > *', '.cw-posts > *', '.cw-hero-inner > *', '.cw-grid2 > *', '.cw-strip > *', '.cw-filter > *', '.cw-cta-row > *']) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          if (r.right > vw + 1 || r.left < -1) out.push({ sel: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], left: Math.round(r.left), right: Math.round(r.right) })
        }
      }
      return {
        overflow: de.scrollWidth - de.clientWidth,
        out,
        hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        deadAnchors: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((x) => !x || x === '#' || x === 'javascript:void(0)'),
        headings: [...document.querySelectorAll('h1, h2, h3')].map((e) => [e.tagName, e.textContent.trim()]),
        imgs: [...document.querySelectorAll('img')].map((i) => {
          const r = i.getBoundingClientRect()
          const cs = getComputedStyle(i)
          return {
            src: (i.currentSrc || i.src).replace(location.origin, ''),
            broken: i.complete && i.naturalWidth === 0,
            rw: Math.round(r.width), rh: Math.round(r.height),
            fit: cs.objectFit,
            arRender: r.height ? +(r.width / r.height).toFixed(2) : 0,
            arNat: i.naturalHeight ? +(i.naturalWidth / i.naturalHeight).toFixed(2) : 0,
            overTall: r.height > window.innerHeight * 0.7,
          }
        }),
        h1Count: document.querySelectorAll('h1').length,
        mainOk: !!document.querySelector('#main'),
        bodyText: (document.querySelector('#main')?.innerText || '').toLowerCase(),
        headerChildren: [...document.querySelectorAll('.cw-header > *')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => {
          const r = e.getBoundingClientRect()
          return { t: (e.textContent || e.className || e.tagName).trim().slice(0, 24), l: Math.round(r.left), r: Math.round(r.right) }
        }),
      }
    }, w)

    if (layout.overflow > 1) add('high', route, vp, 'h-overflow', `${layout.overflow}px`)
    for (const o of layout.out) add('high', route, vp, 'out-of-bounds', `${o.sel} [${o.l}..${o.r}] vs vw ${w}`)
    for (const d of layout.deadAnchors) add('high', route, vp, 'dead-link', d)
    if (layout.h1Count !== 1) add('med', route, vp, 'h1-count', String(layout.h1Count))
    if (!layout.mainOk) add('high', route, vp, 'landmark', 'missing #main')

    // A11Y_FN is source text, so compile and invoke it inside the page: passing a
    // function-string straight to page.evaluate returns the function object (which
    // serialises to undefined) instead of calling it.
    const a11y = await page.evaluate(([src, width]) => (0, eval)(src)(width), [A11Y_FN, w])
    for (const c of a11y.contrast) add('high', route, vp, 'contrast', `${c.selector} "${c.text}" ${c.ratio}:1 < ${c.need}:1 (${c.color} on ${c.bg})`)
    for (const f of a11y.focus) add('med', route, vp, 'focus-visible', f.selector)
    for (const t of a11y.targets) add('med', route, vp, 'touch-target', `${t.selector} ${t.w}x${t.h}`)

    for (const href of new Set(layout.hrefs)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue
      const p = href.split('?')[0].replace(/\/$/, '') || '/'
      if (!KNOWN.has(p)) add('high', route, vp, 'unknown-dest', href)
    }

    const seen = new Map()
    for (const [tag, txt] of layout.headings) {
      if (!txt) continue
      const k = `${tag}:${txt}`
      seen.set(k, (seen.get(k) || 0) + 1)
    }
    for (const [k, n] of seen) if (n > 1) add('med', route, vp, 'dup-heading', `${k} Ã—${n}`)

    for (const im of layout.imgs) {
      if (im.broken && !INTENTIONAL.test(im.src)) add('high', route, vp, 'broken-img', im.src)
      if (im.rw === 0 || im.rh === 0) continue
      if (im.fit === 'fill' && im.arNat && Math.abs(im.arRender - im.arNat) / im.arNat > 0.08) add('med', route, vp, 'distorted-img', `${im.src} render ${im.arRender} vs natural ${im.arNat}`)
      if (im.overTall) add('med', route, vp, 'oversized-img', `${im.src} ${im.rw}x${im.rh} (>70vh)`)
      if (im.rw > w + 1) add('high', route, vp, 'img-wider-than-vp', `${im.src} ${im.rw}px`)
    }

    for (let i = 0; i < layout.headerChildren.length; i++) {
      for (let j = i + 1; j < layout.headerChildren.length; j++) {
        const a = layout.headerChildren[i], b = layout.headerChildren[j]
        if (a.l < b.r && b.l < a.r) add('high', route, vp, 'header-overlap', `"${a.t}" âˆ© "${b.t}"`)
      }
    }

    for (const bad of PROHIBITED) if (layout.bodyText.includes(bad)) add('high', route, vp, 'prohibited', bad)

    for (const e of pageErrors) add('high', route, vp, 'pageerror', e)
    for (const e of consoleErrors) add('high', route, vp, 'console-error', e.slice(0, 200))
    for (const f of failedReqs) add('high', route, vp, 'failed-req', f)

    if (SHOT_ROUTES.has(route)) {
      const name = `${route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')}_${vp}.png`
      await page.screenshot({ path: path.join(SHOTS, name), fullPage: true })
    }

    // Capture evidence when this route/viewport produced a high-severity finding.
    if (findings.some((f) => f.route === route && f.vp === vp && f.sev === 'high')) {
      const name = `FAIL_${route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')}_${vp}.png`
      await page.screenshot({ path: path.join(SHOTS, name), fullPage: true })
    }
  }
}


// --- mobile menu behaviour at 360 ---
{
  await fresh('/', 360, 800)
  const burgerShown = await page.locator('.cw-burger').isVisible()
  if (!burgerShown) add('high', '/', '360x800', 'mobile-menu', 'burger not visible at 360')
  else {
    await page.locator('.cw-burger').click()
    if (!(await page.locator('.cw-nav.open').isVisible())) add('high', '/', '360x800', 'mobile-menu', 'nav did not open')
    await page.locator('.cw-nav.open').getByRole('link', { name: 'Portfolio' }).click()
    await page.waitForTimeout(250)
    if (!page.url().endsWith('/portfolio')) add('high', '/', '360x800', 'mobile-menu', `nav click landed on ${page.url()}`)
    if (await page.locator('.cw-nav.open').count()) add('med', '/', '360x800', 'mobile-menu', 'nav stayed open after navigate')
  }
}

// --- navigation integrity: every header/footer link resolves to its own page ---
{
  await fresh('/', 1440, 900)
  const links = await page.evaluate(() => [...document.querySelectorAll('.cw-header a[href], .cw-footer a[href]')].map((a) => ({ t: a.textContent.trim(), h: a.getAttribute('href') })))
  for (const { t, h } of links) {
    if (/^(https?:|mailto:)/.test(h)) continue
    const dest = h.split('?')[0].replace(/\/$/, '') || '/'
    if (!KNOWN.has(dest)) { add('high', '/header-footer', '1440x900', 'bad-nav-href', `${t} â†’ ${h}`); continue }
    await page.goto(`${BASE}${h}`, { waitUntil: 'load' })
    await page.waitForTimeout(120)
    const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || ''
    if (!h1.trim()) add('high', '/header-footer', '1440x900', 'nav-no-h1', `${t} â†’ ${h}`)
  }
}

// --- CTA flows ---
{
  await fresh('/', 1440, 900)
  const headerQuote = page.locator('.cw-nav a', { hasText: 'Get a Quote' })
  if (!(await headerQuote.count())) add('high', '/', '1440x900', 'missing-cta', 'header Get a Quote absent')
  else {
    await headerQuote.click(); await page.waitForTimeout(200)
    if (!page.url().includes('/contact?type=quote')) add('high', '/', '1440x900', 'cta-dest', `Get a Quote â†’ ${page.url()}`)
    const kind = (await page.locator('.cw-kind label.on').textContent().catch(() => '')) || ''
    if (!kind.includes('Get a Quote')) add('med', '/', '1440x900', 'cta-prefill', `quote chip state: "${kind}"`)
  }
  await fresh('/', 1440, 900)
  await page.locator('a', { hasText: 'Request a Sample' }).first().click(); await page.waitForTimeout(200)
  if (!page.url().includes('type=sample')) add('high', '/', '1440x900', 'cta-dest', `Request a Sample â†’ ${page.url()}`)
  await fresh('/services/private-label', 1440, 900)
  if (!(await page.locator('a[href="/services"]').first().count())) add('high', '/services/private-label', '1440x900', 'missing-back', 'no Back to Services link')
}

await browser.close()

// --- report ---
const rollup = {}
for (const f of findings) {
  const k = `${f.kind} @ ${f.route} ${f.vp}`
  rollup[k] = (rollup[k] || 0) + 1
}
fs.writeFileSync(path.join(process.cwd(), 'audit-uix.report.json'), JSON.stringify({ count: findings.length, findings, rollup }, null, 2))

// Human-readable report for quick review without opening JSON.
const sevOrder = { high: 0, med: 1, low: 2 }
const lines = [
  'Customwear UI/UX audit report',
  `Generated: ${new Date().toISOString()}`,
  `Routes: ${ROUTES.length} | Viewports: ${VIEWPORTS.map(([w, h]) => `${w}x${h}`).join(', ')}`,
  `Total findings: ${findings.length} (high: ${findings.filter((f) => f.sev === 'high').length}, med: ${findings.filter((f) => f.sev === 'med').length})`,
  '',
]
for (const f of [...findings].sort((a, b) => (sevOrder[a.sev] ?? 9) - (sevOrder[b.sev] ?? 9))) {
  lines.push(`[${f.sev.toUpperCase()}] ${f.kind} | ${f.route} ${f.vp} | ${f.detail}`)
}
if (!findings.length) lines.push('No findings — all checks passed.')
fs.writeFileSync(path.join(process.cwd(), 'audit-uix.report.txt'), lines.join('\n') + '\n')

console.log(`\n=== ${findings.length} findings ===`)
for (const f of findings) console.log(`[${f.sev}] ${f.kind} | ${f.route} ${f.vp} | ${f.detail}`)
console.log('\nReport: audit-uix.report.json / audit-uix.report.txt | Screenshots: audit-shots/')
