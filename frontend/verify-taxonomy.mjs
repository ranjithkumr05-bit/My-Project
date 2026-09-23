import fs from 'fs'
const src = fs.readFileSync('src/data/services.js', 'utf8')
const lines = src.split('\n')

const approved = {
  'corporate-office-apparel': ['Corporate Polo T-Shirts','Corporate Round-Neck T-Shirts','Office T-Shirts','Corporate Event T-Shirts','Employee T-Shirts','Executive & Management T-Shirts','Promotional Corporate T-Shirts','Custom-Branded Office Apparel'],
  'sportswear-team-jerseys': ['Cricket Jerseys','Football Jerseys','Volleyball Jerseys','Kabaddi Jerseys','Basketball Jerseys','Badminton & Sports T-Shirts','Custom Team Tracksuits','Sports Shorts & Team Kits'],
  'school-college-tshirts': ['School Polo T-Shirts','School House T-Shirts','School Sports T-Shirts','College Department T-Shirts','College Event T-Shirts','School Activity T-Shirts','College Team Jerseys','Custom School & College T-Shirts'],
  'workwear-staff-apparel': ['Construction & Civil Work T-Shirts','Mechanics & Workshop T-Shirts','Industrial & Factory Work T-Shirts','Catering Staff T-Shirts','Hotel & Hospitality Staff T-Shirts','Housekeeping Staff T-Shirts','Maintenance & Technician T-Shirts','General Staff & Service T-Shirts'],
  'retail-store-apparel': ['Retail Store T-Shirts','Supermarket Staff T-Shirts','Showroom Staff T-Shirts','Shopping Mall Staff T-Shirts','Sales & Promotion T-Shirts','Brand Ambassador T-Shirts','Customer Service T-Shirts','Custom-Branded Store T-Shirts'],
  'hoodies-sweatshirts': ['Pullover Hoodies','Zip-Up Hoodies','Oversized Hoodies','Custom Printed Hoodies','Embroidered Hoodies','College & Department Hoodies','Group & Trip Hoodies','Custom Sweatshirts'],
  'group-event-tshirts': ["Friends' Gang T-Shirts",'College Department T-Shirts','School & College Reunion T-Shirts','Birthday Celebration T-Shirts','Trip & Tour T-Shirts','Family Matching T-Shirts','Bachelor & Bachelorette Party T-Shirts','Custom T-Shirts for Special Events'],
  'private-label': ['Private-Label T-Shirt Manufacturing','Custom Polo T-Shirt Manufacturing','Custom Hoodie Manufacturing','Custom Banyan & Vest Manufacturing','Brand Logo Printing','Custom Embroidery','Custom Labels & Branding','Bulk Custom Apparel Manufacturing']
}

let currentSlug = null
let inSubs = false
let collected = []
let ok = 0
let bad = 0
let total = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const slugMatch = line.match(/^\s+slug:\s+'([^']+)',\s*$/)
  if (slugMatch) { currentSlug = slugMatch[1] }
  if (line.match(/^\s+subs:\s+\[\s*$/)) { inSubs = true; collected = []; continue }
  if (inSubs) {
    const nm = line.match(/^\s*\{\s*name:\s+(?:"([^"]+)"|'([^']+)')/)
    if (nm) collected.push(nm[1] || nm[2])
    if (line.match(/^\s+\],\s*$/)) {
      inSubs = false
      const exp = approved[currentSlug]
      if (!exp) {
        console.log('UNKNOWN SLUG:', currentSlug)
        continue
      }
      total += collected.length
      if (collected.length !== 8) {
        console.log(`COUNT MISMATCH [${currentSlug}]: ${collected.length}`)
        bad++
      }
      collected.forEach((s, j) => {
        if (s !== exp[j]) {
          console.log(`NAME MISMATCH [${currentSlug}] @${j}: expected "${exp[j]}" got "${s}"`)
          bad++
        } else { ok++ }
      })
      currentSlug = null
    }
  }
}

console.log('\nCategories checked. Subs matched OK:', ok, '| mismatches:', bad, '| total subs:', total)
