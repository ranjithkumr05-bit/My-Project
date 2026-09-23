// shot360.mjs — fresh confirmation screenshot + header state at 360.
import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 360, height: 800 })
await page.goto('http://127.0.0.1:5174/blog', { waitUntil: 'load' })
await page.waitForTimeout(400)
const state = await page.evaluate(() => {
  const nav = document.querySelector('.cw-nav')
  const burger = document.querySelector('.cw-burger')
  const wa = document.querySelector('.cw-wa-cta')
  const quote = document.querySelector('.cw-quote-cta')
  const d = (el) => el ? getComputedStyle(el).display : 'ABSENT'
  return { vw: innerWidth, nav: d(nav), burger: d(burger), wa: d(wa), quote: d(quote), scrollW: document.documentElement.scrollWidth }
})
console.log(JSON.stringify(state))
await page.screenshot({ path: 'audit-shots/FRESH_blog_360_top.png' })
await browser.close()
