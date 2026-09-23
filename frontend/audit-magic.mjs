import fs from 'fs'
;['sportswear', 'hoodies'].forEach(k => {
  const buf = fs.readFileSync(`public/showcase/${k}.jpg`)
  const head = buf.slice(0, 16)
  console.log(k + '.jpg magic:', head.toString('hex').match(/.{1,2}/g).join(' '))
  console.log('  ascii:', JSON.stringify(head.toString('latin1')))
  // search for SOF markers anywhere
  for (let i = 0; i < buf.length - 9; i++) {
    if (buf[i] === 0xff) {
      const m = buf[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        const h = buf.readUInt16BE(i + 5)
        const w = buf.readUInt16BE(i + 7)
        console.log(`  SOF marker 0x${m.toString(16)} at ${i} -> ${w}x${h}`)
        break
      }
    }
  }
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    console.log('  Actually a PNG:', buf.readUInt32BE(16) + 'x' + buf.readUInt32BE(20))
  }
})
