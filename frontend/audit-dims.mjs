import fs from 'fs'
import path from 'path'

function pngSize(buf) {
  // PNG: 8-byte sig, then IHDR length+type, width @16, height @20 (big-endian)
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue }
    const marker = buf[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const h = buf.readUInt16BE(i + 5)
      const w = buf.readUInt16BE(i + 7)
      return [w, h]
    }
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue }
    const len = buf.readUInt16BE(i + 2)
    i += 2 + len
  }
  return null
}

const showcase = 'public/showcase'
const files = []
const walk = (dir, prefix = '') => {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) walk(full, prefix + f + '/')
    else if (/\.(jpg|jpeg|png)$/i.test(f)) files.push([prefix + f.replace(/\.(jpg|jpeg|png)$/i, ''), full])
  })
}
walk(showcase)

console.log('=== Real image dimensions ===')
const dims = {}
files.forEach(([key, full]) => {
  const buf = fs.readFileSync(full)
  const size = pngSize(buf) || jpegSize(buf)
  dims[key] = size
  const kb = Math.round(buf.length / 1024)
  console.log(`  ${key.padEnd(28)} ${size ? size[0] + 'x' + size[1] : 'UNREADABLE'}  ${kb} KB`)
})

// Compare against IMG_DIMS in source
const src = fs.readFileSync('src/data/services.js', 'utf8')
const dimsBlock = src.match(/export const IMG_DIMS = \{([\s\S]*?)\n\}/)[1]
console.log('\n=== IMG_DIMS vs real ===')
dimsBlock.split('\n').forEach(line => {
  const m = line.match(/'([^']+)':\s*\[(\d+),\s*(\d+)\]/)
  if (!m) return
  const [, key, w, h] = m
  const real = dims[key]
  if (!real) { console.log(`  ${key}: declared ${w}x${h} — NO FILE`); return }
  const okW = Number(w) === real[0]
  const okH = Number(h) === real[1]
  console.log(`  ${okW && okH ? 'OK    ' : 'WRONG '} ${key}: declared ${w}x${h} | real ${real[0]}x${real[1]}`)
})
