import fs from 'fs'
import path from 'path'

const showcase = 'public/showcase'
const gpt = path.join(showcase, 'gpt')

console.log('=== gpt/ directory ===')
if (fs.existsSync(gpt)) fs.readdirSync(gpt).forEach((f) => console.log('  ' + f))
else console.log('  MISSING DIRECTORY')

console.log('\n=== showcase/ root (files only) ===')
fs.readdirSync(showcase)
  .filter((f) => fs.statSync(path.join(showcase, f)).isFile())
  .forEach((f) => console.log('  ' + f))

// Gather image keys referenced in source
const svc = fs.readFileSync('src/data/services.js', 'utf8')
const home = fs.readFileSync('src/pages/Home.jsx', 'utf8')

const keys = new Set()
const reImg = /image:\s*'([^']+)'/g
const reGal = /galleryImages:\s*\[([^\]]+)\]/g
let m
while ((m = reImg.exec(svc))) keys.add(m[1])
while ((m = reGal.exec(svc))) {
  m[1]
    .split(',')
    .map((s) => s.trim().replace(/'/g, ''))
    .filter(Boolean)
    .forEach((k) => keys.add(k))
}
// Portfolio covers/alternates derive from galleryImages (captured above); no extra keys here.

// Home video
const vids = [...home.matchAll(/src="(\/showcase\/[^"]+)"/g)].map((x) => x[1])
console.log('\n=== Home video/asset refs ===')
vids.forEach((v) => {
  const p = path.join('public', v.replace(/^\//, ''))
  console.log(`  ${fs.existsSync(p) ? 'OK     ' : 'MISSING'} ${v}`)
})

console.log('\n=== Image key resolution (jpg/webp with png fallback) ===')
let missingBoth = []
;[...keys].sort().forEach((k) => {
  const exts = ['jpg', 'webp', 'png']
  const found = exts.filter((e) => fs.existsSync(path.join(showcase, `${k}.${e}`)))
  const label = found.length ? `has: ${found.join('+')}` : 'MISSING ALL'
  if (!found.length) missingBoth.push(k)
  console.log(`  ${label.padEnd(24)} ${k}`)
})

console.log('\n=== Summary ===')
console.log('Total distinct image keys:', keys.size)
console.log('Keys with NO file at all:', missingBoth.length ? missingBoth : 'none')
