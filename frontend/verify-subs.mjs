import fs from 'fs'
import path from 'path'

// Auto-detect the built JS bundle
const assetsDir = 'dist/assets'
const jsFile = fs.readdirSync(assetsDir).find((f) => f.startsWith('index-') && f.endsWith('.js'))
if (!jsFile) throw new Error('No index-*.js bundle found in ' + assetsDir)
const dist = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8')
console.log('Bundle:', jsFile)

const categories = [
  'Corporate Apparel',
  'Sportswear and Jerseys',
  'School Uniforms',
  'Workwear',
  'Retail Uniforms',
  'Hoodies and Sweatshirts',
  'Event T-Shirts',
  'Private Label',
]

const subs = [
  'Corporate Polo T-Shirts',
  'Corporate Round-Neck T-Shirts',
  'Office T-Shirts',
  'Corporate Event T-Shirts',
  'Employee T-Shirts',
  'Executive & Management T-Shirts',
  'Promotional Corporate T-Shirts',
  'Custom-Branded Office Apparel',
  'Cricket Jerseys',
  'Football Jerseys',
  'Volleyball Jerseys',
  'Kabaddi Jerseys',
  'Basketball Jerseys',
  'Badminton & Sports T-Shirts',
  'Custom Team Tracksuits',
  'Sports Shorts & Team Kits',
  'School Polo T-Shirts',
  'School House T-Shirts',
  'School Sports T-Shirts',
  'College Department T-Shirts',
  'College Event T-Shirts',
  'School Activity T-Shirts',
  'College Team Jerseys',
  'Custom School & College T-Shirts',
  'Construction & Civil Work T-Shirts',
  'Mechanics & Workshop T-Shirts',
  'Industrial & Factory Work T-Shirts',
  'Catering Staff T-Shirts',
  'Hotel & Hospitality Staff T-Shirts',
  'Housekeeping Staff T-Shirts',
  'Maintenance & Technician T-Shirts',
  'General Staff & Service T-Shirts',
  'Retail Store T-Shirts',
  'Supermarket Staff T-Shirts',
  'Showroom Staff T-Shirts',
  'Shopping Mall Staff T-Shirts',
  'Sales & Promotion T-Shirts',
  'Brand Ambassador T-Shirts',
  'Customer Service T-Shirts',
  'Custom-Branded Store T-Shirts',
  'Pullover Hoodies',
  'Zip-Up Hoodies',
  'Oversized Hoodies',
  'Custom Printed Hoodies',
  'Embroidered Hoodies',
  'College & Department Hoodies',
  'Group & Trip Hoodies',
  'Custom Sweatshirts',
  "Friends' Gang T-Shirts",
  'College Department T-Shirts',
  'School & College Reunion T-Shirts',
  'Birthday Celebration T-Shirts',
  'Trip & Tour T-Shirts',
  'Family Matching T-Shirts',
  'Bachelor & Bachelorette Party T-Shirts',
  'Custom T-Shirts for Special Events',
  'Private-Label T-Shirt Manufacturing',
  'Custom Polo T-Shirt Manufacturing',
  'Custom Hoodie Manufacturing',
  'Custom Banyan & Vest Manufacturing',
  'Brand Logo Printing',
  'Custom Embroidery',
  'Custom Labels & Branding',
  'Bulk Custom Apparel Manufacturing',
]

const catMissing = categories.filter((c) => !dist.includes(c))
const subMissing = subs.filter((s) => !dist.includes(s))

console.log('Category names:', categories.length - catMissing.length, '/', categories.length)
if (catMissing.length) console.log('  MISSING CATEGORIES:', catMissing)
console.log('Subcategories:', subs.length - subMissing.length, '/', subs.length)
if (subMissing.length) console.log('  MISSING SUBS:', subMissing)

// Prohibited / outdated labels
console.log('\n--- Prohibited & outdated label scan ---')
const bad = [
  'safety jacket',
  'reflective',
  'hi-vis',
  'Baniyan & Group',
  'Hoodies & Fleece',
  'Corporate & Office Polos',
  'Sportswear & Jerseys',
  'School & College Tees',
  'Retail & Staff Tees',
  'Private Label Manufacturing',
]
bad.forEach((w) =>
  console.log(`  ${dist.toLowerCase().includes(w.toLowerCase()) ? 'FOUND  ' : 'absent '} ${w}`),
)

// 'uniform' check — should appear only as the legacy alias key
const uniIdx = []
let ix = dist.toLowerCase().indexOf('uniform')
while (ix !== -1) {
  uniIdx.push(ix)
  ix = dist.toLowerCase().indexOf('uniform', ix + 1)
}
console.log(`  uniform occurrences: ${uniIdx.length}`)
uniIdx.forEach((i) =>
  console.log('    ...' + dist.slice(Math.max(0, i - 55), i + 25).replace(/\s+/g, ' ') + '...'),
)
