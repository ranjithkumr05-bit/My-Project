// Verify 64 subs in dist bundle
import fs from 'fs'
const dist = fs.readFileSync('dist/assets/index-DZa8_q1y.js', 'utf8')

const subs = [
  'Corporate Polo T-Shirts','Corporate Round-Neck T-Shirts','Office T-Shirts','Corporate Event T-Shirts','Employee T-Shirts','Executive & Management T-Shirts','Promotional Corporate T-Shirts','Custom-Branded Office Apparel',
  'Cricket Jerseys','Football Jerseys','Volleyball Jerseys','Kabaddi Jerseys','Basketball Jerseys','Badminton & Sports T-Shirts','Custom Team Tracksuits','Sports Shorts & Team Kits',
  'School Polo T-Shirts','School House T-Shirts','School Sports T-Shirts','College Department T-Shirts','College Event T-Shirts','School Activity T-Shirts','College Team Jerseys','Custom School & College T-Shirts',
  'Construction & Civil Work T-Shirts','Mechanics & Workshop T-Shirts','Industrial & Factory Work T-Shirts','Catering Staff T-Shirts','Hotel & Hospitality Staff T-Shirts','Housekeeping Staff T-Shirts','Maintenance & Technician T-Shirts','General Staff & Service T-Shirts',
  'Retail Store T-Shirts','Supermarket Staff T-Shirts','Showroom Staff T-Shirts','Shopping Mall Staff T-Shirts','Sales & Promotion T-Shirts','Brand Ambassador T-Shirts','Customer Service T-Shirts','Custom-Branded Store T-Shirts',
  'Pullover Hoodies','Zip-Up Hoodies','Oversized Hoodies','Custom Printed Hoodies','Embroidered Hoodies','College & Department Hoodies','Group & Trip Hoodies','Custom Sweatshirts',
  "Friends' Gang T-Shirts",'College Department T-Shirts','School & College Reunion T-Shirts','Birthday Celebration T-Shirts','Trip & Tour T-Shirts','Family Matching T-Shirts','Bachelor & Bachelorette Party T-Shirts','Custom T-Shirts for Special Events',
  'Private-Label T-Shirt Manufacturing','Custom Polo T-Shirt Manufacturing','Custom Hoodie Manufacturing','Custom Banyan & Vest Manufacturing','Brand Logo Printing','Custom Embroidery','Custom Labels & Branding','Bulk Custom Apparel Manufacturing'
]

let found = 0
subs.forEach(s => {
  if (dist.includes(s)) {
    found++
  } else {
    console.log('MISSING:', s)
  }
})
console.log('Subs found:', found, '/64')

