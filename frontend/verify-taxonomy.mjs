// Verify every category exposes the 8 approved subcategories, in order.
const approved = {
  'corporate-office-apparel': [
    'Corporate Polo T-Shirts',
    'Corporate Round-Neck T-Shirts',
    'Office T-Shirts',
    'Corporate Event T-Shirts',
    'Employee T-Shirts',
    'Executive & Management T-Shirts',
    'Promotional Corporate T-Shirts',
    'Custom-Branded Office Apparel',
  ],
  'sportswear-team-jerseys': [
    'Cricket Jerseys',
    'Football Jerseys',
    'Volleyball Jerseys',
    'Kabaddi Jerseys',
    'Basketball Jerseys',
    'Badminton & Sports T-Shirts',
    'Custom Team Tracksuits',
    'Sports Shorts & Team Kits',
  ],
  'school-college-tshirts': [
    'School Polo T-Shirts',
    'School House T-Shirts',
    'School Sports T-Shirts',
    'College Department T-Shirts',
    'College Event T-Shirts',
    'School Activity T-Shirts',
    'College Team Jerseys',
    'Custom School & College T-Shirts',
  ],
  'workwear-staff-apparel': [
    'Construction & Civil Work T-Shirts',
    'Mechanics & Workshop T-Shirts',
    'Industrial & Factory Work T-Shirts',
    'Catering Staff T-Shirts',
    'Hotel & Hospitality Staff T-Shirts',
    'Housekeeping Staff T-Shirts',
    'Maintenance & Technician T-Shirts',
    'General Staff & Service T-Shirts',
  ],
  'retail-store-apparel': [
    'Retail Store T-Shirts',
    'Supermarket Staff T-Shirts',
    'Showroom Staff T-Shirts',
    'Shopping Mall Staff T-Shirts',
    'Sales & Promotion T-Shirts',
    'Brand Ambassador T-Shirts',
    'Customer Service T-Shirts',
    'Custom-Branded Store T-Shirts',
  ],
  'hoodies-sweatshirts': [
    'Pullover Hoodies',
    'Zip-Up Hoodies',
    'Oversized Hoodies',
    'Custom Printed Hoodies',
    'Embroidered Hoodies',
    'College & Department Hoodies',
    'Group & Trip Hoodies',
    'Custom Sweatshirts',
  ],
  'group-event-tshirts': [
    "Friends' Gang T-Shirts",
    'College Department T-Shirts',
    'School & College Reunion T-Shirts',
    'Birthday Celebration T-Shirts',
    'Trip & Tour T-Shirts',
    'Family Matching T-Shirts',
    'Bachelor & Bachelorette Party T-Shirts',
    'Custom T-Shirts for Special Events',
  ],
  'private-label': [
    'Private-Label T-Shirt Manufacturing',
    'Custom Polo T-Shirt Manufacturing',
    'Custom Hoodie Manufacturing',
    'Custom Banyan & Vest Manufacturing',
    'Brand Logo Printing',
    'Custom Embroidery',
    'Custom Labels & Branding',
    'Bulk Custom Apparel Manufacturing',
  ],
}

// services.js guards import.meta specifically so Node tools can import it
// directly. Importing the real data is both shorter and immune to formatting:
// the old line/regex scrape below silently reported 21 of 64 subcategories
// once Prettier spread each `subs` entry over four lines.
import {SERVICES} from './src/data/services.js'

let ok = 0
let bad = 0
let total = 0

for (const {slug, subs} of SERVICES) {
  const collected = subs.map((s) => s.name)
  const exp = approved[slug]
  if (!exp) {
    console.log('UNKNOWN SLUG:', slug)
    continue
  }
  total += collected.length
  if (collected.length !== 8) {
    console.log(`COUNT MISMATCH [${slug}]: ${collected.length}`)
    bad++
  }
  collected.forEach((s, j) => {
    if (s !== exp[j]) {
      console.log(`NAME MISMATCH [${slug}] @${j}: expected "${exp[j]}" got "${s}"`)
      bad++
    } else {
      ok++
    }
  })
}

console.log(
  '\nCategories checked. Subs matched OK:',
  ok,
  '| mismatches:',
  bad,
  '| total subs:',
  total,
)
if (bad || total !== 64) process.exitCode = 1
