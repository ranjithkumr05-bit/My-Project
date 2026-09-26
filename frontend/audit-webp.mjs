import fs from 'fs'

function webpSize(buf) {
  if (buf.slice(0, 4).toString('ascii') !== 'RIFF' || buf.slice(8, 12).toString('ascii') !== 'WEBP')
    return null
  let off = 12
  while (off + 8 <= buf.length) {
    const fourcc = buf.slice(off, off + 4).toString('ascii')
    const size = buf.readUInt32LE(off + 4)
    const data = off + 8
    if (fourcc === 'VP8X') {
      const w = 1 + (buf[data + 4] | (buf[data + 5] << 8) | (buf[data + 6] << 16))
      const h = 1 + (buf[data + 7] | (buf[data + 8] << 8) | (buf[data + 9] << 16))
      return [w, h]
    }
    if (fourcc === 'VP8 ') {
      // 3-byte frame tag, then 0x9d 0x01 0x2a start code
      const p = data + 3
      if (buf[p] === 0x9d && buf[p + 1] === 0x01 && buf[p + 2] === 0x2a) {
        const w = buf.readUInt16LE(p + 3) & 0x3fff
        const h = buf.readUInt16LE(p + 5) & 0x3fff
        return [w, h]
      }
    }
    if (fourcc === 'VP8L') {
      const b = buf[data + 1] | (buf[data + 2] << 8) | (buf[data + 3] << 16) | (buf[data + 4] << 24)
      return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]
    }
    off = data + size + (size % 2)
  }
  return null
}

;['sportswear', 'hoodies'].forEach((k) => {
  const buf = fs.readFileSync(`public/showcase/${k}.jpg`)
  console.log(`${k}.jpg (real WebP) -> ${webpSize(buf)}`)
})

// What MIME does the server map for webp?
const st = fs.readFileSync('../../src/static.mjs', 'utf8')
console.log('\nstatic.mjs MIME entries mentioning webp/jpg/png:')
st.split('\n')
  .filter((l) => /webp|jpeg|jpg|png/i.test(l))
  .forEach((l) => console.log('  ' + l.trim()))
