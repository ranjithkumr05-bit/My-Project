// probe.mjs — one-off diagnostics for audit-uix findings.
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:5174'
const browser = await chromium.launch()
const page = await browser.newPage()

// 1. find horizontal-overflow culprits at 360 on / and /blog
for (const route of ['/', '/blog', '/about', '/portfolio', '/contact', '/services']) {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  const res = await page.evaluate((vw) => {
    const bad = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0) continue
      if (r.right > vw + 1 || r.left < -1) {
        bad.push({
          el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
          parent: el.parentElement ? el.parentElement.tagName.toLowerCase() + '.' + String(el.parentElement.className).split(' ')[0] : '',
          text: (el.textContent || '').trim().slice(0, 40),
        })
      }
    }
    return { scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 25) }
  }, 360)
  console.log(`\n=== ${route} @360 scrollW=${res.scrollW} ===`)
  for (const b of res.bad) console.log(JSON.stringify(b))
}

// 2. card text-vs-image alignment + duplicate rule evidence at 1440
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(`${BASE}/services`, { waitUntil: 'load' })
const cards = await page.evaluate(() => {
  return [...document.querySelectorAll('.cw-card')].slice(0, 3).map((c) => {
    const img = c.querySelector('img, .cw-img-missing')
    const h3 = c.querySelector('h3')
    const p = c.querySelector('p')
    const cs = getComputedStyle(c)
    const h3cs = getComputedStyle(h3)
    const pcs = getComputedStyle(p)
    return {
      cardPad: cs.padding, cardBg: cs.backgroundColor, cardBorder: cs.borderColor,
      imgLeft: img ? Math.round(img.getBoundingClientRect().left) : null,
      imgH: img ? Math.round(img.getBoundingClientRect().height) : null,
      h3Left: Math.round(h3.getBoundingClientRect().left), h3Pad: h3cs.padding, h3Margin: h3cs.margin,
      pLeft: Math.round(p.getBoundingClientRect().left), pPad: pcs.padding,
      cardH: Math.round(c.getBoundingClientRect().height),
    }
  })
})
console.log('\n=== /services card metrics 1440 ===')
for (const c of cards) console.log(JSON.stringify(c))

// 3. portfolio workcard image computed style (aspect-ratio dead?)
await page.goto(`${BASE}/portfolio`, { waitUntil: 'load' })
const wc = await page.evaluate(() => {
  const img = document.querySelector('.cw-workcard img')
  const cs = getComputedStyle(img)
  const r = img.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height), aspectRatio: cs.aspectRatio, cssHeight: cs.height, objectFit: cs.objectFit, attrH: img.getAttribute('height') }
})
console.log('\n=== portfolio workcard img ===')
console.log(JSON.stringify(wc))

// 4. header quote CTA computed style
await page.goto(`${BASE}/`, { waitUntil: 'load' })
const q = await page.evaluate(() => {
  const el = document.querySelector('.cw-quote-cta')
  if (!el) return null
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  return { color: cs.color, textDecoration: cs.textDecorationLine, pad: cs.padding, border: cs.border, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height) }
})
console.log('\n=== .cw-quote-cta ===')
console.log(JSON.stringify(q))

// 5. header overall: does it wrap/overflow at 1024-1100?
for (const w of [1024, 1100, 1200, 900]) {
  await page.setViewportSize({ width: w, height: 800 })
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(250)
  const h = await page.evaluate((vw) => {
    const hdr = document.querySelector('.cw-header')
    const r = hdr.getBoundingClientRect()
    const kids = [...hdr.children].filter((e) => getComputedStyle(e).display !== 'none').map((e) => {
      const b = e.getBoundingClientRect()
      return { t: (e.textContent || e.className).trim().slice(0, 18), l: Math.round(b.left), r: Math.round(b.right) }
    })
    const overlaps = []
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (kids[i].l < kids[j].r && kids[j].l < kids[i].r) overlaps.push(`${kids[i].t} ∩ ${kids[j].t}`)
    return { hdrH: Math.round(r.height), scrollW: document.documentElement.scrollWidth, overlaps, kids }
  }, w)
  console.log(`\n=== header @${w} ===`)
  console.log(JSON.stringify(h))
}

await browser.close()
