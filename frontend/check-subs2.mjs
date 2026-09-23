// Verify actual services.js data: 8 categories, 64 subs, approved names (regex parser — no ESM import)
import fs from 'fs'
const src = fs.readFileSync('src/data/services.js', 'utf8')

// Extract SERVICES block
const svcStart = src.indexOf('export const SERVICES = [')
const svcEnd = src.indexOf(']\n\nexport const serviceBySlug', svcStart)
const svcBlock = src.slice(svcStart, svcEnd)

// Split into category blocks by matching { ... } at top level
const blocks = []
let depth = 0
let current = ''
let inString = false
let stringChar = ''

for (let i = 0; i < svcBlock.length; i++) {
  const ch = svcBlock[i]
  if (!inString && ch === '{') { depth++; current += ch }
  else if (!inString && ch === '}') { depth--; current += ch; if (depth === 0) { blocks.push(current); current = '' } }
  else if (!inString && (ch === "'" || ch === '"')) { inString = true; stringChar = ch; current += ch }
  else if (inString && ch === stringChar) { inString = false; stringChar = ''; current += ch }
  else if (inString && ch === '\\') { current += ch; if (i + 1 < svcBlock.length) { current += svcBlock[++i] } }
  else if (depth > 0) { current += ch }
}

console.log('=== Category blocks found:', blocks.length)
let totalSubs = 0

blocks.forEach((block, i) => {
  const slugMatch = block.match(/slug:\s+'([^']+)'/)
  const nameMatch = block.match(/name:\s+'([^']+)'/)
  const imageMatch = block.match(/image:\s+'([^']+)'/)

  // Count subs
  const subsBlock = block.match(/subs:\s+\[([\s\S]*?)\]/)
  let subCount = 0
  if (subsBlock) {
    const subEntries = subsBlock[1].match(/name:\s+'[^']+'/g)
    subCount = subEntries ? subEntries.length : 0
  }

  totalSubs += subCount
  console.log(`${i+1}. [${slugMatch[1]}] ${nameMatch[1]} — ${subCount} subs, image=${imageMatch[1]}`)
})

console.log('\nTotal categories:', blocks.length)
console.log('Total subs:', totalSubs)

// Check Sportswear specifically for the two "missing" subs
const swBlock = blocks.find(b => b.includes("slug: 'sportswear-team-jerseys'"))
if (swBlock) {
  const subsMatch = swBlock.match(/subs:\s+\[([\s\S]*?)\]/)
  if (subsMatch) {
    const subs = subsMatch[1].match(/name:\s+'([^']+)'/g)
    console.log('\nSportswear subs:', subs)
  }
}

// Check for prohibited words
console.log('\n=== Prohibited word scan ===')
const prohibited = ['uniform', 'safety jacket', 'reflective', 'hi-vis']
let foundProhibited = false
prohibited.forEach(p => {
  if (src.toLowerCase().includes(p)) {
    // find context
    const idx = src.toLowerCase().indexOf(p)
    const start = Math.max(0, idx - 40)
    const end = Math.min(src.length, idx + 40)
    console.log(`  FOUND "${p}" at offset ${idx}: ...${src.slice(start, end)}...`)
    foundProhibited = true
  }
})
if (!foundProhibited) console.log('No prohibited words found in services data')

