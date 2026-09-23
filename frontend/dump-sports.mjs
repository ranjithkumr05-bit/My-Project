import fs from 'fs'
const src = fs.readFileSync('src/data/services.js', 'utf8')
const lines = src.split('\n')
let start = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("slug: 'sportswear-team-jerseys'")) { start = i; break }
}
console.log('sportswear slug line:', start + 1)
for (let j = start; j < start + 45; j++) {
  console.log((j + 1) + '|' + lines[j])
}
