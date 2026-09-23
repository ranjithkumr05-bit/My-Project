// data/services.js — single source of truth for the 8×8 services catalogue.
// Slugs are fixed by spec; subcategories are verbatim from the flowchart.
// Images marked swappable:true can be replaced with factory photos later.
// import.meta.env only exists under Vite; guard so Node-based tools (Playwright specs,
// check scripts) can import this module without crashing. Same value in the browser.
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {}
export const WA_NUMBER = ENV.VITE_WHATSAPP_NUMBER || '919999999999'
export const WA_DEFAULT_MSG = 'Hi Customwear — I need a quotation for custom apparel.'
export const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text || WA_DEFAULT_MSG)}`

// Canonical order = approved 8 main categories.
// T-Shirts is removed as a standalone main category; its subcategories are folded into
// the approved categories below so the site shows exactly 8 main tiles.
export const REQUIRED_SLUGS = [
  'corporate-office-apparel',
  'sportswear-team-jerseys',
  'school-college-tshirts',
  'workwear-staff-apparel',
  'retail-store-apparel',
  'hoodies-sweatshirts',
    'group-event-tshirts',
  'private-label',
]

// Old slugs redirect here (legacy #/… bookmarks + previous category names).
export const SLUG_ALIASES = {
  't-shirts': 'corporate-office-apparel',
  'polos': 'corporate-office-apparel',
  'corporate-office-wear': 'corporate-office-apparel',
    'sportswear-team-jerseys': 'sportswear-team-jerseys',
  'sportswear': 'sportswear-team-jerseys',
  'school-college-tshirts': 'school-college-tshirts',
  'school-college-uniforms': 'school-college-tshirts',
    'workwear-staff-apparel': 'workwear-staff-apparel',
  'workwear': 'workwear-staff-apparel',
  'retail-store-apparel': 'retail-store-apparel',
  'retail-staff-tshirts': 'retail-store-apparel',
  'industrial-workwear': 'workwear-staff-apparel',
  'hoodies-sweatshirts': 'hoodies-sweatshirts',
  'group-event-tshirts': 'group-event-tshirts',
  'custom-t-shirts': 'group-event-tshirts',
  'custom-printing': 'group-event-tshirts',
    'private-label-manufacturing': 'private-label',
  'private-label': 'private-label',
}

export const IMG_DIMS = {
  // Real pixel dimensions read from each file on disk (see frontend/audit-dims.mjs).
  'gpt/polos': [1536, 1024],
  'gpt/hoodies': [1536, 1024],
  'gpt/private-label': [1254, 1254],
  'gpt/group-event': [1024, 1024],
  'sportswear': [800, 992],
  'p-sportswear': [904, 600],
  'school-college-tshirts': [800, 1000],
  'p-school-college-tshirts': [1400, 933],
  'workwear': [800, 1000],
  'p-workwear': [1024, 683],
  'retail-staff': [800, 1000],
  'p-retail-staff': [1400, 933],
  'hoodies': [800, 992],
  'p-hoodies': [1400, 933],
  'baniyan': [800, 1000],
  'p-baniyan': [1400, 933],
  'office-corporate': [800, 1000],
  'p-office-corporate': [904, 600],
  'private-label': [800, 1000],
  'p-private-label': [1400, 933],
  'mfg-printing': [672, 504],
  'mfg-sourcing': [889, 667],
}

// Image keys with no asset on disk yet. Components render an honest neutral
// placeholder for these instead of substituting an unrelated garment photo.
// gpt/group-event: a genuine group/event photo is still to be supplied.
export const MISSING_IMAGES = ['gpt/group-event']

// Single source of truth for real on-disk file extensions.
// Anything not listed here is a genuine .jpg. Note: sportswear/hoodies were
// shipped as WebP bytes under a .jpg name; correctly-named .webp copies exist.
export const IMG_EXT = {
  'gpt/polos': 'png',
  'gpt/hoodies': 'png',
  'gpt/private-label': 'png',
  'sportswear': 'webp',
  'hoodies': 'webp',
}

export const imgSrc = (key) => `/showcase/${key}.${IMG_EXT[key] || 'jpg'}`
export const imgSrcFallback = (key) => `/showcase/${key}.${IMG_EXT[key] ? 'jpg' : 'png'}`

export const SERVICES = [
  {
    slug: 'corporate-office-apparel',
    name: 'Corporate & Office Apparel',
    short: 'Corporate & Office Apparel',
    image: 'gpt/polos',
    alt: 'Corporate polo shirts and office apparel',
    description: 'Professional apparel for offices, corporates, and branded staff programmes.',
    heroHeadline: 'Corporate & Office Apparel',
    heroSub: 'Polos and office T-shirts that look sharp on the workfloor and carry your brand with confidence.',
    intro: 'Our core corporate programme: péqué polos, office T-shirts, and branded staff apparel produced with woven labels, embroidery, and print — samples approved before bulk.',
    manufacturing: 'Cut and sew on knit lines. Print or embroidery as specified. Samples approved before bulk run. QC per lot.',
    subs: [
      { name: 'Corporate Polo T-Shirts', blurb: 'Classic collared polos for professional office and staff wear.' },
      { name: 'Corporate Round-Neck T-Shirts', blurb: 'Crew-neck office tees for everyday corporate or staff kits.' },
      { name: 'Office T-Shirts', blurb: 'Clean-cut tees sized as a roster for office or back-office teams.' },
      { name: 'Corporate Event T-Shirts', blurb: 'Matching tees for company events, town halls, and launches.' },
      { name: 'Employee T-Shirts', blurb: 'Staff tees with logo print or woven label, batched per department.' },
      { name: 'Executive & Management T-Shirts', blurb: 'Premium-weight tees for leadership and client-facing roles.' },
      { name: 'Promotional Corporate T-Shirts', blurb: 'Campaign-grade corporate tees for giveaways and roadshows.' },
      { name: 'Custom-Branded Office Apparel', blurb: 'Bespoke branded office apparel from design to delivery.' },
        ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
        galleryImages: ['office-corporate', 'p-office-corporate'],
  },
  {
    slug: 'hoodies-sweatshirts',
    name: 'Hoodies & Sweatshirts',
    short: 'Hoodies & Sweatshirts',
    image: 'gpt/hoodies',
    alt: 'Custom hoodies and sweatshirts',
    description: 'Heavyweight fleece hoodies and sweatshirts with retail finish.',
    heroHeadline: 'Hoodies & Sweatshirts',
    heroSub: 'Kangaroo-pocket hoodies and crewneck sweatshirts — heavyweight, comfortable, and built for branding.',
    intro: 'Fleece programme on dedicated hoodie lines — pocket, placket and drawcord assembly checked per style.',
    manufacturing: 'Fleece construction on dedicated hoodie lines. Pocket and placket assembly checked per style.',
    subs: [
            { name: 'Pullover Hoodies', blurb: 'Kangaroo-pocket pullovers in brushed fleece.' },
      { name: 'Zip-Up Hoodies', blurb: 'Zip-through hoodies with drawcords and hardware.' },
      { name: 'Oversized Hoodies', blurb: 'Street-fit oversized fleece with dropped shoulders.' },
      { name: 'Custom Printed Hoodies', blurb: 'Screen and digital prints on fleece panels.' },
      { name: 'Embroidered Hoodies', blurb: 'Thread embroidery on hoodie chest and back panels.' },
      { name: 'College & Department Hoodies', blurb: 'Campus house and department hoodies with crests.' },
      { name: 'Group & Trip Hoodies', blurb: 'Matching group trip hoodies with custom designs.' },
      { name: 'Custom Sweatshirts', blurb: 'Crewneck sweatshirts with your branding or prints.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['hoodies', 'p-hoodies'],
  },
  {
    slug: 'sportswear-team-jerseys',
    name: 'Sportswear & Team Jerseys',
    short: 'Sportswear & Team Jerseys',
    image: 'sportswear',
    alt: 'Custom sports jerseys and team apparel',
    description: 'Match-ready jerseys and team apparel with your names, numbers, and branding.',
    heroHeadline: 'Sportswear & Team Jerseys',
    heroSub: 'Performance-knit jerseys, sublimation panels, and team naming — built for the pitch and the stands.',
    intro: 'Team kits with sublimation panels, player names and numbers applied per team sheet.',
    manufacturing: 'Jersey construction on dedicated lines. Sublimation panels pre-printed. Names and numbers applied per team sheet.',
    subs: [
      { name: 'Cricket Jerseys', blurb: 'Micro-mesh cricket kits with sublimated panels.' },
      { name: 'Football Jerseys', blurb: 'Match jerseys with names, numbers and club crest.' },
      { name: 'Volleyball Jerseys', blurb: 'Lightweight match jerseys with numbering.' },
      { name: 'Kabaddi Jerseys', blurb: 'Traditional and modified kabaddi team jerseys.' },
      { name: 'Basketball Jerseys', blurb: 'Sleeveless court jerseys with team colours.' },
      { name: 'Badminton & Sports T-Shirts', blurb: 'Breathable badminton and multi-sport tees with panel prints.' },
      { name: 'Custom Team Tracksuits', blurb: 'Coordinated team tracksuits with printed panels and branding.' },
      { name: 'Sports Shorts & Team Kits', blurb: 'Match shorts and complete team kits with drawcord and side panels.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['sportswear', 'p-sportswear'],
  },
  {
    slug: 'school-college-tshirts',
    name: 'School & College T-Shirts',
    short: 'School & College T-Shirts',
    image: 'school-college-tshirts',
    alt: 'School and college T-shirts in graded sizes',
    description: 'Durable, comfortable T-shirts for schools, colleges and campuses.',
    heroHeadline: 'School & College T-Shirts',
    heroSub: 'Graded campus T-shirts in durable knits — built to last through the academic year.',
    intro: 'Campus T-shirt programme in graded sizes. Scope note: we manufacture garments only — we do not supply school accessories such as belts.',
    manufacturing: 'Graded size production with reinforced stitching. Each set checked for size accuracy before packing.',
    subs: [
                  { name: 'School Polo T-Shirts', blurb: 'Collar polo tees for school campus wear.' },
      { name: 'School House T-Shirts', blurb: 'House-colour tees for school events and inter-house meets.' },
      { name: 'School Sports T-Shirts', blurb: 'PE and games tees in breathable knits for students.' },
      { name: 'College Department T-Shirts', blurb: 'Department and batch tees with college crest or name.' },
      { name: 'College Event T-Shirts', blurb: 'Annual-day, fest and event tees with custom prints.' },
      { name: 'School Activity T-Shirts', blurb: 'Activity and outing tees for school groups.' },
      { name: 'College Team Jerseys', blurb: 'Campus sports team jerseys with player names.' },
      { name: 'Custom School & College T-Shirts', blurb: 'Bespoke college and school T-shirts from design to delivery.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['school-college-tshirts', 'p-school-college-tshirts'],
  },
  {
    slug: 'workwear-staff-apparel',
    name: 'Workwear & Staff Apparel',
    short: 'Workwear & Staff Apparel',
    image: 'workwear',
    alt: 'Practical staff T-shirts for workshop, catering, and service teams',
    description: 'Practical staff T-shirts for catering, workshop, maintenance, factory, and service teams.',
    heroHeadline: 'Workwear & Staff Apparel',
    heroSub: 'Durable staff T-shirts for workshops, catering, maintenance and service teams — packed per roster, sized per crew.',
        intro: 'Staff T-shirt programme for catering, workshop, factory, hospitality, housekeeping, maintenance, and service teams. Packed in polybags per crew with size-accurate grading.',
    manufacturing: 'Staff-tee runs with reinforced stitching. Size sets packed per roster. QC per lot.',
    subs: [
      { name: 'Construction & Civil Work T-Shirts', blurb: 'Crew tees for construction and civil-site labour teams.' },
      { name: 'Mechanics & Workshop T-Shirts', blurb: 'Durable workshop tees for floor and mechanic crews.' },
      { name: 'Industrial & Factory Work T-Shirts', blurb: 'Factory-floor crews tees with reinforced stress points.' },
      { name: 'Catering Staff T-Shirts', blurb: 'Hygienic catering and food-service crew tees.' },
      { name: 'Hotel & Hospitality Staff T-Shirts', blurb: 'Hospitality front-service and housekeeping tees.' },
      { name: 'Housekeeping Staff T-Shirts', blurb: 'Housekeeping and janitorial maintenance crew tees.' },
      { name: 'Maintenance & Technician T-Shirts', blurb: 'Maintenance and technician crew tees in hard-wearing knits.' },
      { name: 'General Staff & Service T-Shirts', blurb: 'General service and staff tees for daily operations.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['workwear', 'p-workwear'],
    imageNote: 'Placeholder — practical staff T-shirt photo should replace at first photo shoot.',
  },
    {
    slug: 'retail-store-apparel',
    name: 'Retail & Store Apparel',
    short: 'Retail & Store Apparel',
    image: 'retail-staff',
    alt: 'Retail staff T-shirts and store apparel',
    description: 'Branded store, supermarket and showroom staff apparel with your logo.',
    heroHeadline: 'Retail & Store Apparel',
    heroSub: 'Branded staff T-shirts for stores, counters and service crews — packed per store, sized per roster.',
    intro: 'Retail staff T-shirt programme for stores, supermarkets, showrooms, malls and customer-service teams. Packed in polybags per store with size-accurate grading.',
    manufacturing: 'Staff-tee runs with reinforced stitching. Size sets packed per roster. QC per lot.',
    subs: [
      { name: 'Retail Store T-Shirts', blurb: 'Store staff tees with logo print, packed per outlet.' },
      { name: 'Supermarket Staff T-Shirts', blurb: 'Supermarket and hypermarket crew tees in durable knits.' },
      { name: 'Showroom Staff T-Shirts', blurb: 'Showroom and floor staff tees with clean branding.' },
      { name: 'Shopping Mall Staff T-Shirts', blurb: 'Mall concierge and security-greet crew tees.' },
      { name: 'Sales & Promotion T-Shirts', blurb: 'Promotional sale tees for campaigns and events.' },
      { name: 'Brand Ambassador T-Shirts', blurb: 'Ambassador tees for launches and brand activations.' },
      { name: 'Customer Service T-Shirts', blurb: 'Customer-service desk tees for front-of-house teams.' },
      { name: 'Custom-Branded Store T-Shirts', blurb: 'Bespoke branded store tees from design to delivery.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['retail-staff', 'p-retail-staff'],
  },
    {
    slug: 'group-event-tshirts',
    name: 'Group & Event T-Shirts',
    short: 'Group & Event T-Shirts',
    image: 'gpt/group-event',
    alt: 'Group of friends wearing coordinated custom event T-shirts',
    description: 'Custom group and event T-shirts for reunions, trips, celebrations and team orders.',
    heroHeadline: 'Group & Event T-Shirts',
    heroSub: 'Coordinated custom tees for friends, teams, reunions, trips and events — your design, your quantity, your timeline.',
    intro: 'Event and group T-shirt runs for reunions, trips, birthday celebrations, campaigns, and bulk giveaways.',
    manufacturing: 'Knit runs with print or embroidery as specified. Samples approved before bulk run.',
    subs: [
      { name: "Friends' Gang T-Shirts", blurb: 'Matching tees for friend groups and gang orders.' },
      { name: 'College Department T-Shirts', blurb: 'College department and batch tees with custom prints.' },
      { name: 'School & College Reunion T-Shirts', blurb: 'Alumni and school reunion tees with group designs.' },
      { name: 'Birthday Celebration T-Shirts', blurb: 'Custom birthday and party tees for celebrations.' },
      { name: 'Trip & Tour T-Shirts', blurb: 'Group trip and tour tees with destination prints.' },
      { name: 'Family Matching T-Shirts', blurb: 'Matching family tees for outings and gatherings.' },
      { name: "Bachelor & Bachelorette Party T-Shirts", blurb: 'Celebration tees for bachelor and bachelorette parties.' },
      { name: 'Custom T-Shirts for Special Events', blurb: 'Bulk custom tees for weddings, campaigns and special events.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['gpt/group-event'],
    imageNote: 'Placeholder — a genuine group/event photo should replace this at first photo shoot.',
  },
    {
    slug: 'private-label',
    name: 'Private Label & Custom Manufacturing',
    short: 'Private Label & Custom Manufacturing',
    image: 'gpt/private-label',
    alt: 'Private label clothing manufacturing process',
    description: 'Your brand, your labels, your packing — produced on our manufacturing floor.',
    heroHeadline: 'Private Label & Custom Manufacturing',
    heroSub: 'Full private-label programmes — from custom labels and tags to packing and cartons — produced end to end.',
    intro: 'End-to-end private-label manufacturing: labels, packing and export cartons integrated into the run.',
    manufacturing: 'Your brand produced on our floor. Labels and packing integrated into the run. MOQ per style.',
    subs: [
      { name: 'Private-Label T-Shirt Manufacturing', blurb: 'Blank and custom private-label tees made to your specification.' },
      { name: 'Custom Polo T-Shirt Manufacturing', blurb: 'Private-label polos with custom neck labels and sizing.' },
      { name: 'Custom Hoodie Manufacturing', blurb: 'Private-label fleece hoodies with custom trims and branding.' },
      { name: 'Custom Banyan & Vest Manufacturing', blurb: 'Private-label banyan and vest garments in combed cotton.' },
      { name: 'Brand Logo Printing', blurb: 'Logo printing services for tags, labels, and branding.' },
      { name: 'Custom Embroidery', blurb: 'Thread embroidery for logos and decorative finishes.' },
      { name: 'Custom Labels & Branding', blurb: 'Woven labels, printed tags and packaging branding.' },
      { name: 'Bulk Custom Apparel Manufacturing', blurb: 'Full-bulk private-label apparel runs with packing integration.' },
    ],
    // swappable:true — all category + gallery images may be replaced with factory photos later.
    galleryImages: ['private-label', 'p-private-label'],
  },
]

export const serviceBySlug = (slug) => {
  if (!slug) return null
  const direct = SERVICES.find((s) => s.slug === slug)
  if (direct) return direct
  const alias = SLUG_ALIASES[slug]
  return alias ? SERVICES.find((s) => s.slug === alias) || null : null
}
export const resolveCanonicalSlug = (slug) => {
  if (!slug) return null
  if (SERVICES.some((s) => s.slug === slug)) return slug
  return SLUG_ALIASES[slug] || null
}
