// probe2.mjs — find the 360px horizontal overflow source via text ranges.
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:5174'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 360, height: 800 })

for (const route of ['/', '/blog']) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' })
  await page.waitForTimeout(400)
  const res = await page.evaluate((vw) => {
    const hits = []
    // text-node rects
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      const r = range.getBoundingClientRect()
      if (r.right > vw + 1 || r.left < -1) {
        hits.push({ type: 'text', right: Math.round(r.right), text: n.textContent.trim().slice(0, 50), parent: n.parentElement.tagName.toLowerCase() + '.' + String(n.parentElement.className).split(' ').join('.') })
      }
    }
    // elements whose own scrollWidth overflows with visible overflow-x
    const scrollers = []
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el)
      if (cs.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        scrollers.push({ el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ').join('.'), sw: el.scrollWidth, cw: el.clientWidth })
      }
    }
    return { docSW: document.documentElement.scrollWidth, bodySW: document.body.scrollWidth, hits: hits.slice(0, 15), scrollers: scrollers.slice(0, 15) }
  }, 360)
  console.log(`\n=== ${route} @360 docSW=${res.docSW} bodySW=${res.bodySW} ===`)
  console.log('TEXT HITS:'); for (const h of res.hits) console.log(JSON.stringify(h))
  console.log('SCROLLERS:'); for (const s of res.scrollers) console.log(JSON.stringify(s))
}
await browser.close()
