import { useState } from 'react'
import { navigate, useHashRoute } from '../ui.jsx'

/* ---------------- shared shell ---------------- */

const NAV = [
  ['', 'Home'],
  ['about', 'About'],
  ['services', 'Services'],
  ['process', 'Process'],
  ['portfolio', 'Portfolio'],
  ['blog', 'Blog'],
  ['contact', 'Contact'],
]

const SERVICE_CATEGORIES = [
  {
    slug: 'corporate-office-wear',
    name: 'Corporate & Office Wear',
    short: 'Corporate & Office Wear',
    image: 'office-corporate',
    alt: 'Corporate polos and office uniforms',
    description: 'Professional apparel for offices, corporates, and branded staff programmes.',
    heroHeadline: 'Corporate & Office Wear',
    heroSub: 'Polos, shirts, and uniforms that look sharp on the office floor and carry your brand with confidence.',
    garmentTypes: ['Piqué polos with embroidered chest logos', 'Woven collar labels and neck tape', 'Office T-shirts and casual Fridays apparel', 'Formal shirts and blouse-style knits'],
    customization: ['Embroidery — chest logo, sleeve, or collar', 'Woven labels — neck, hem, and care labels', 'Print — chest print, back print, all-over', 'Packaging — polybags, tissue, hang tags'],
    manufacturing: 'Cut-make-trim on our floor. Samples approved before bulk. QC per lot. MOQ per style.',
    galleryImages: ['office-corporate', 'p-office-corporate', 'retail-staff', 'p-retail-staff'],
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
    garmentTypes: ['Performance-knit jerseys with moisture-wicking panels', 'Sublimation-ready panels for full-colour designs', 'Team naming and player numbers', 'Training tops and warm-up apparel'],
    customization: ['Sublimation printing — full-colour, all-over', 'Numbering and player names', 'Team logo embroidery or print', 'Colour matching to team colours'],
    manufacturing: 'Jersey construction on dedicated lines. Sublimation panels pre-printed. Names and numbers applied per team sheet.',
    galleryImages: ['sportswear', 'p-sportswear'],
  },
  {
    slug: 'school-college-uniforms',
    name: 'School & College Uniforms',
    short: 'School & College Uniforms',
    image: 'school-uniforms',
    alt: 'School and college uniform apparel',
    description: 'Durable, comfortable uniforms for schools, colleges, and institutions.',
    heroHeadline: 'School & College Uniforms',
    heroSub: 'Graded uniform sets in durable knits — built to last through the academic year.',
    garmentTypes: ['School T-shirts and polos in graded sizes', 'Sports uniforms for PE and games', 'College casuals and branded campus wear', 'Reversible vests and layered sets'],
    customization: ['Embroidery — school crest and house logos', 'Woven labels with institution name', 'Print — school name and motto', 'Graded size sets from toddler to adult'],
    manufacturing: 'Graded size production with reinforced stitching. Each set checked for size accuracy before packing.',
    galleryImages: ['school-uniforms', 'p-school-uniforms'],
  },
  {
    slug: 'industrial-workwear',
    name: 'Industrial & Workwear',
    short: 'Industrial & Workwear',
    image: 'workwear',
    alt: 'Industrial workwear and work uniforms',
    description: 'Heavy-duty workwear for industrial, factory, and field teams.',
    heroHeadline: 'Industrial & Workwear',
    heroSub: 'Durable canvas, tee, and jacket workwear for teams on the factory floor, site, or field.',
    garmentTypes: ['Heavy canvas work jackets', 'Industrial T-shirts and polos', 'Work vests and hi-vis tops', 'Dust coats and coveralls'],
    customization: ['Embroidery — company logo and ID', 'Print — safety messaging and branding', 'Woven labels with company name', 'Pocket and reinforcement options'],
    manufacturing: 'Reinforced stitching and heavier GSMs for durability. QC checks for seam strength and finish.',
    galleryImages: ['workwear', 'p-workwear'],
  },
  {
    slug: 'custom-t-shirts',
    name: 'Custom T-Shirts',
    short: 'Custom T-Shirts',
    image: 'baniyan',
    alt: 'Custom printed and plain T-shirts',
    description: 'Plain, printed, and personalized T-shirts for any programme or event.',
    heroHeadline: 'Custom T-Shirts',
    heroSub: 'From basic blanks to fully printed tees — your design, your quantity, your brand.',
    garmentTypes: ['Plain and branded cotton T-shirts', 'Printed tees — chest, back, and all-over', 'Event and promo T-shirts', 'Bulk cotton vests and singles'],
    customization: ['Screen print — single and multi-colour', 'DTG — full-colour digital print', 'Embroidery — small logos and monograms', 'Private label and custom packing'],
    manufacturing: 'Cut and sew on knit lines. Print or embroidery as specified. Samples approved before bulk run.',
    galleryImages: ['baniyan', 'p-baniyan', 'retail-staff', 'p-retail-staff'],
  },
  {
    slug: 'hoodies-sweatshirts',
    name: 'Hoodies & Sweatshirts',
    short: 'Hoodies & Sweatshirts',
    image: 'hoodies',
    alt: 'Custom hoodies and sweatshirts',
    description: 'Heavyweight fleece hoodies and sweatshirts with retail finish.',
    heroHeadline: 'Hoodies & Sweatshirts',
    heroSub: 'Kangaroo-pocket hoodies and crewneck sweatshirts — heavyweight, comfortable, and built for branding.',
    garmentTypes: ['Kangaroo-pocket hoodies', 'Crewneck sweatshirts and fleece', 'Zip-up hoodies and jackets', 'Custom-lined and brushed-back fleece'],
    customization: ['Embroidery — chest logo and back designs', 'Screen print and DTG on fleece', 'Woven labels and neck tape', 'Custom drawcords and hardware'],
    manufacturing: 'Fleece construction on dedicated hoodie lines. Pocket and placket assembly checked per style.',
    galleryImages: ['hoodies', 'p-hoodies'],
  },
  {
    slug: 'custom-printing',
    name: 'Custom Printing & Personalization',
    short: 'Custom Printing & Personalization',
    image: 'mfg-printing',
    alt: 'Custom printing and personalization services',
    description: 'Screen print, DTG, sublimation, and embroidery to personalize any garment.',
    heroHeadline: 'Custom Printing & Personalization',
    heroSub: 'Bring your design to life — screen print, digital print, sublimation, and embroidery on knit, woven, and fleece.',
    garmentTypes: ['Screen-printed garments — single and multi-colour', 'DTG (direct-to-garment) digital prints', 'Sublimation on performance knits', 'Embroidery on caps, polos, and fleece'],
    customization: ['Pantone colour matching and strike-offs', 'Multi-colour screen separations', 'All-over and panel sublimation', 'Thread colours and stitch density for embroidery'],
    manufacturing: 'Print and embroidery run as parallel lines. Colour verified on strike-off before bulk.',
    galleryImages: ['mfg-printing', 'sportswear', 'p-sportswear'],
  },
  {
    slug: 'private-label-manufacturing',
    name: 'Private Label & Custom Brand Manufacturing',
    short: 'Private Label Manufacturing',
    image: 'private-label',
    alt: 'Private label clothing and custom branding',
    description: 'Your brand, your labels, your packing — produced on our floor.',
    heroHeadline: 'Private Label & Custom Brand Manufacturing',
    heroSub: 'Full private-label programmes — from labels and tags to packing and cartons — produced end to end.',
    garmentTypes: ['Full private-label garment programmes', 'Woven neck labels and hang tags', 'Custom tissue, polybags, and kraft boxes', 'Carton marking and barcode packing'],
    customization: ['Woven labels — neck, hem, care, and size', 'Printed hang tags and neck labels', 'Custom polybags and tissue', 'Export packing and shipment docs'],
    manufacturing: 'Your brand produced on our floor. Labels and packing integrated into the run. MOQ per style.',
    galleryImages: ['private-label', 'p-private-label'],
  },
]

export function SiteShell({ parts, children }) {
  const [open, setOpen] = useState(false)
  const active = parts[0] || ''
  const wa = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent('Hi Customwear — I need a quotation for custom apparel.')}`
  return (
    <div className="cw-site">
      <header className={`cw-header ${active === '' ? 'on-hero' : ''}`}>
        <a className="brand" href="#/">Custom<em>wear</em></a>
        <button className="cw-burger" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? '✕' : '☰'}
        </button>
        <nav className={`cw-nav ${open ? 'open' : ''}`} aria-label="primary">
          {NAV.map(([to, label]) => (
            <a key={to} href={`#/${to}`} className={active === to ? 'active' : ''} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a className="cw-loginlink" href="#/login">Portal login</a>
        </nav>
        <a className="cw-wa-cta" href={wa} target="_blank" rel="noopener noreferrer">
          Connect On Whatsapp <span aria-hidden="true">↗</span>
        </a>
      </header>

      {/* floating quick-contact buttons */}
      <div className="cw-float">
        <a className="cw-float-btn wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.15-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.9.92-3-.2-.31a8.2 8.2 0 1 1 6.84 3.74Zm4.5-6.16c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.17 1.72 2.63 4.18 3.69.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>
        </a>
        <a className="cw-float-btn call" href="#/contact" aria-label="Contact us">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"/></svg>
        </a>
      </div>

      {children}
      <footer className="cw-footer">
        <div>
          <p className="brand">Custom<em>wear</em></p>
          <p className="muted">B2B apparel manufacturing — polos, t-shirts, jerseys, hoodies, uniforms & private label.</p>
        </div>
        <nav aria-label="footer">
          {NAV.map(([to, label]) => <a key={to} href={`#/${to}`}>{label}</a>)}
          <a href="#/login">Portal login</a>
        </nav>
        <p className="muted">© {new Date().getFullYear()} Customwear. Sample data — no live orders.</p>
      </footer>
    </div>
  )
}

/* ---------------- Home ---------------- */

function Home() {
  return (
    <>
      <section className="cw-hero-fs">
        <video className="cw-hero-video" autoPlay muted loop playsInline preload="auto" src="/showcase/hero-loop.mp4" aria-hidden="true" />
        <div className="cw-hero-overlay" />
        <div className="cw-hero-inner">
          <div className="cw-hero-left">
            <p className="cw-kicker-pill"><span className="dot" aria-hidden="true" /> Custom Apparel · Uniforms · Private Label</p>
            <h1>We Build Exactly<br />As You Desire.</h1>
            <p className="cw-hero-sub">
              Your manufacturing partner for custom polos, t-shirts, jerseys, hoodies and
              uniforms — MOQ-managed programmes with screen print, embroidery and
              private-label branding, from fabric sourcing to export packing.
            </p>
            <a className="cw-gold-btn" href="#/services">Explore Our Services <span aria-hidden="true">↗</span></a>
          </div>

          <div className="cw-hero-right">
            <div className="cw-hero-card">
              <strong>MOQ</strong>
              <span>managed per product line</span>
            </div>
            <div className="cw-hero-card">
              <strong>8</strong>
              <span>product categories</span>
              <a className="cw-card-arrow" href="#/portfolio" aria-label="View portfolio">↗</a>
            </div>
            <div className="cw-hero-card">
              <strong>5</strong>
              <span>production stages tracked</span>
            </div>
            <div className="cw-hero-card">
              <strong>100%</strong>
              <span>sample approved before bulk</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cw-section">
        <h2>What we make</h2>
        <div className="cw-cats">
          {[
            ['office-corporate', 'Corporate & Office'],
            ['sportswear', 'Sportswear & Jerseys'],
            ['school-uniforms', 'School Uniforms'],
            ['workwear', 'Industrial Workwear'],
            ['retail-staff', 'Retail Staff'],
            ['hoodies', 'Hoodies & Fleece'],
            ['baniyan', 'Baniyan & Vests'],
            ['private-label', 'Private Label'],
          ].map(([img, label]) => (
            <a className="cw-cat" key={img} href="#/portfolio">
              <img src={`/showcase/${img}.jpg`} alt={label} loading="lazy" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="cw-section cw-cta-band">
        <h2>Have a tech pack or a rough idea?</h2>
        <p className="cw-lead">Send your requirement — we quote it, sample it, then produce it.</p>
        <a className="cw-gold-btn" href="#/contact">Start an Enquiry <span aria-hidden="true">↗</span></a>
      </section>
    </>
  )
}

/* ---------------- About ---------------- */

const ABOUT_STATS = [
  ['6 stages', 'From sourcing to dispatch'],
  ['100+ styles', 'Polos, tees, jerseys, hoodies & more'],
  ['In-house QC', 'Daylight-lamp inspection every lot'],
  ['Export-ready', 'Packing lists and docs included'],
]

function About() {
  return (
    <section className="cw-section cw-page">
      <h1>About Customwear</h1>
      <p className="cw-lead">
        A B2B apparel manufacturing platform built around one promise: your brand, produced properly.
      </p>
      <div className="cw-grid2">
        <img src="/showcase/mfg-sourcing.jpg" alt="Fabric sourcing" loading="lazy" />
        <div>
          <h3>From yarn to export carton</h3>
          <p>
            We run the full chain in and around Tiruppur — fabric sourcing, cutting, stitching,
            printing, quality inspection and export packing — so a single enquiry covers the
            whole programme.
          </p>
          <h3>Built for B2B buyers</h3>
          <p>
            MOQs are explicit per product line. Every bulk run is preceded by a physical sample
            for approval. Production status is tracked through five defined stages, visible to
            you from enquiry to dispatch.
          </p>
          <h3>Branding that ships with the garment</h3>
          <p>
            Screen printing, embroidery, heat transfer, woven neck labels and private-label
            packaging are part of the line — not an afterthought.
          </p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginTop: '28px' }}>
        {ABOUT_STATS.map(([value, label]) => (
          <div key={label} style={{ background: 'var(--navy-800)', border: '1px solid var(--navy-700)', borderRadius: '12px', padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold-300)', lineHeight: 1.1 }}>{value}</div>
            <div style={{ color: 'var(--ink-500)', fontSize: '13px', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '28px', background: 'var(--navy-800)', border: '1px solid var(--navy-700)', borderRadius: '12px', overflow: 'hidden' }}>
        <img src="/showcase/hero.jpg" alt="Customwear manufacturing floor" loading="lazy" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--navy-700)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>A floor built for volume and precision</h3>
          <p style={{ margin: 0, color: 'var(--ink-300)', fontSize: '13px', lineHeight: 1.5 }}>
            Our Tiruppur unit runs multiple parallel lines for knit, woven and fleece programmes.
            Spreading, cutting, sewing, printing and packing are all in-house, so a single buyer
            faces one team across the whole run.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Services ---------------- */

function Services() {
  const [active, setActive] = useState(null)
  return (
    <section className="cw-section cw-page">
      <h1>Our Services</h1>
      <p className="cw-lead">Everything we manufacture — choose a category to see details and request a quote.</p>
      <div className="cw-cards">
        {SERVICE_CATEGORIES.map((svc) => (
          <article
            key={svc.slug}
            className="cw-card"
            onClick={() => setActive(svc.slug)}
            style={{ cursor: 'pointer' }}
          >
            <img src={`/showcase/${svc.image}.jpg`} alt={svc.alt} loading="lazy" />
            <h3>{svc.name}</h3>
            <p>{svc.description}</p>
          </article>
        ))}
      </div>
      {active && (
        <div className="cw-modal-backdrop" onClick={() => setActive(null)} aria-hidden="true">
          <div className="cw-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="cw-modal-close" onClick={() => setActive(null)} aria-label="Close">&times;</button>
            {(() => {
              const svc = SERVICE_CATEGORIES.find(s => s.slug === active)
              if (!svc) return null
              return (
                <>
                  <img src={`/showcase/${svc.image}.jpg`} alt={svc.alt} loading="lazy" />
                  <h2>{svc.name}</h2>
                  <p>{svc.description}</p>
                  <p style={{ marginBottom: '14px' }}>
                    <strong>Garment types:</strong> {svc.garmentTypes.join('; ')}
                  </p>
                  <p style={{ marginBottom: '14px' }}>
                    <strong>Customization:</strong> {svc.customization.join('; ')}
                  </p>
                  <p>{svc.manufacturing}</p>
                  <a className="btn btn-gold" href={`#/services/${svc.slug}`}>View full details</a>
                  <a className="btn" href="#/contact" style={{ marginLeft: '8px' }}>Request a quote</a>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </section>
  )
}

/* ---------------- Service Detail Page ---------------- */

function ServicePage({ slug }) {
  const svc = SERVICE_CATEGORIES.find(s => s.slug === slug)
  if (!svc) return <Home />
  return (
    <section className="cw-section cw-page">
      <div className="cw-grid2">
        <img src={`/showcase/${svc.image}.jpg`} alt={svc.alt} loading="lazy" style={{ width: '100%', borderRadius: '12px' }} />
        <div>
          <p className="badge gold">{svc.short}</p>
          <h1 style={{ marginTop: '8px', fontSize: 'clamp(26px, 3.4vw, 40px)' }}>{svc.heroHeadline}</h1>
          <p className="cw-lead">{svc.heroSub}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
            <a className="btn btn-gold" href="#/contact">Request a Quote</a>
            <a className="btn" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent('Hi Customwear — I need a quotation for ' + svc.name + '.')}`} target="_blank" rel="noopener noreferrer">WhatsApp Enquiry</a>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '28px' }}>
        <h2>Overview</h2>
        <p>{svc.description} We produce {svc.name.toLowerCase()} on our Tiruppur floor, with samples approved before bulk and QC on every lot.</p>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h2>Garment Types</h2>
        <ul className="cw-list">
          {svc.garmentTypes.map((g, i) => <li key={i}>{g}</li>)}
        </ul>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h2>Customization Options</h2>
        <ul className="cw-list">
          {svc.customization.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h2>Manufacturing & Ordering</h2>
        <p>{svc.manufacturing}</p>
        <p className="muted" style={{ marginTop: '8px' }}>MOQs are explicit per product line. Get in touch to confirm capacity for your quantity and timeline.</p>
      </div>
      <div style={{ marginTop: '28px' }}>
        <h2>Gallery</h2>
        <div className="cw-work">
          {svc.galleryImages.map((img) => (
            <figure className="cw-workcard" key={img}>
              <img src={`/showcase/${img}.jpg`} alt="" loading="lazy" />
              <figcaption><p style={{ margin: 0, color: 'var(--ink-500)', fontSize: '12px' }}>{svc.short}</p></figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a className="btn btn-gold" href="#/contact">Request a Quote</a>
        <a className="btn" href="#/contact">Discuss Your Requirements</a>
        <a className="btn" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent('Hi Customwear — I need a quotation for ' + svc.name + '.')}`} target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
      </div>
    </section>
  )
}

/* ---------------- Manufacturing Process ---------------- */

const PROCESS_STEPS = [
  ['Fabric Sourcing', 'mfg-sourcing', 'We source knit, woven and fleece from mills we trust, with GSM and hand-feel matched to your programme before anything is cut.'],
  ['Cutting', 'mfg-cutting', 'Patterns are nested, fabric is spread to the required GSM and layer count, then cut on auto spreaders with grader accuracy across the size set.'],
  ['Stitching', 'mfg-stitching', 'Garments are assembled on our floor across lockstitch, coverstitch and reinforcement operations, with style-specific workstations for polos, tees, jerseys and hoodies.'],
  ['Printing & Embroidery', 'mfg-printing', 'Screen print, DTG, sublimation and embroidery run as parallel lines. Colour is matched to your reference and verified on a strike-off before bulk.'],
  ['Quality Inspection', 'mfg-quality', 'Each lot is inspected under daylight lamps — measurements, seams, stitch density and finish — with a QC report shared before dispatch.'],
  ['Packing & Dispatch', 'mfg-packing', 'Polybagged, tagged, cartonised and palletised to your spec, with packing lists and export documentation ready for shipment.'],
]

function Process() {
  return (
    <section className="cw-section cw-page">
      <h1>Our Manufacturing Process</h1>
      <p className="cw-lead">From fabric to shipped carton — six defined stages, visible to you at every step.</p>
      <div className="cw-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
        {PROCESS_STEPS.map(([title, img, desc], i) => (
          <div key={title} style={{ background: 'var(--navy-800)', border: '1px solid var(--navy-700)', borderRadius: '12px', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--navy-700)', color: 'var(--gold-300)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, margin: '14px 14px 0' }}>
              Step {String(i + 1).padStart(2, '0')}
            </span>
            <img src={`/showcase/${img}.jpg`} alt={title} loading="lazy" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px 14px 16px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{title}</h3>
              <p style={{ margin: 0, color: 'var(--ink-300)', fontSize: '13px', lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a className="btn btn-gold" href="#/contact">Start a programme</a>
        <a className="btn" href="#/services">See all services</a>
      </div>
    </section>
  )
}

/* ---------------- Portfolio ---------------- */

const WORK = [
  ['Corporate Polos', 'office-corporate', 'p-office-corporate', 'Piqué polos for a corporate staff programme — embroidered chest logo, woven collar label.'],
  ['Team Jerseys', 'sportswear', 'p-sportswear', 'Performance-knit jerseys, sublimation-ready panels and team naming.'],
  ['School Uniforms', 'school-uniforms', 'p-school-uniforms', 'Graded uniform sets in durable knits with reinforced stitching.'],
  ['Industrial Workwear', 'workwear', 'p-workwear', 'Heavy canvas jackets and tees for industrial clients.'],
  ['Hoodies & Fleece', 'hoodies', 'p-hoodies', 'Heavyweight fleece hoodies with kangaroo pockets, retail finish.'],
  ['Private Label', 'private-label', 'p-private-label', 'Full private-label programme — labels, tissue, kraft box.'],
  ['Retail Staff', 'retail-staff', 'p-retail-staff', 'Black/navy staff tees packed in polybags per store.'],
  ['Baniyan & Vests', 'baniyan', 'p-baniyan', 'Bulk cotton vests, polybagged on pallets for export.'],
]

function Portfolio() {
  return (
    <section className="cw-section cw-page">
      <h1>Portfolio</h1>
      <p className="cw-lead">Representative programme work across our categories.</p>
      <div className="cw-work">
        {WORK.map(([title, cover, alt, desc]) => (
          <figure className="cw-workcard" key={title}>
            <img src={`/showcase/${cover}.jpg`} alt={title} loading="lazy"
              onMouseOver={(e) => { e.currentTarget.src = `/showcase/${alt}.jpg` }}
              onMouseOut={(e) => { e.currentTarget.src = `/showcase/${cover}.jpg` }} />
            <figcaption>
              <h3>{title}</h3>
              <p>{desc}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="muted">Hover a tile to see the programme shot.</p>
    </section>
  )
}

/* ---------------- Blog ---------------- */

const POSTS = [
  ['Choosing GSM for your programme', 'Buying Guide', 'Fabric weight decides drape, cost and durability. 160 GSM suits promo tees; 180–200 GSM works for retail; 300+ GSM for fleece. We match GSM to use-case before quoting.'],
  ['Why sample before bulk', 'Production', 'A physical sample catches grading, stitching and colour issues while they are still cheap to fix. Every Customwear bulk order follows an approved sample — no exceptions.'],
  ['Screen print vs embroidery', 'Branding', 'Screen print scales to large artwork and photo-detail; embroidery lasts longer on polos and workwear. We advise per garment type and budget.'],
  ['What is in a tech pack', 'Getting Started', 'Measurements per size, fabric spec, artwork files, label placement and packing instructions. Send even a rough version — we help complete the rest.'],
]

function Blog() {
  return (
    <section className="cw-section cw-page">
      <h1>Blog</h1>
      <p className="cw-lead">Practical notes for apparel buyers.</p>
      <div className="cw-posts">
        {POSTS.map(([title, tag, body]) => (
          <article className="cw-post" key={title}>
            <span className="badge gold">{tag}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Contact (public lead intake) ---------------- */

function Contact() {
  const [state, setState] = useState({ done: false, busy: false, error: null })
  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setState({ done: false, busy: true, error: null })
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          company: fd.get('company'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          message: fd.get('message'),
          source: 'website_form',
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`)
      setState({ done: true, busy: false, error: null })
    } catch (err) {
      setState({ done: false, busy: false, error: err })
    }
  }
  return (
    <section className="cw-section cw-page">
      <h1>Contact</h1>
      <p className="cw-lead">Tell us what you need made. We reply with questions, a quotation, then a sample.</p>
      <div className="cw-grid2">
        {state.done ? (
          <div className="cw-card cw-thanks">
            <h3>Enquiry received ✔</h3>
            <p>Our team will reach out. Reference your name in any follow-up.</p>
            <a className="btn" href="#/portfolio">Browse the portfolio meanwhile</a>
          </div>
        ) : (
          <form className="cw-form" onSubmit={onSubmit}>
            <label>Your name<input name="name" required autoComplete="name" /></label>
            <label>Company<input name="company" autoComplete="organization" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" /></label>
            <label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" /></label>
            <label>What do you need made?<textarea name="message" rows="4" placeholder="Product, quantity, target date, branding…" /></label>
            {state.error && <p className="cw-formerr" role="alert">{state.error.message}</p>}
            <button className="btn btn-gold" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send Enquiry'}</button>
          </form>
        )}
        <aside>
          <h3>Prefer WhatsApp?</h3>
          <p className="muted">Message us directly — same team, same speed.</p>
          <a
            className="btn"
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'}?text=${encodeURIComponent('Hi Customwear — I need a quotation for custom apparel.')}`}
            target="_blank" rel="noopener noreferrer"
          >
            WhatsApp Enquiry
          </a>
          <h3 style={{ marginTop: '1.5rem' }}>What to include</h3>
          <ul className="cw-list">
            <li>Product type & category</li>
            <li>Approximate quantity</li>
            <li>Fabric / GSM preference if known</li>
            <li>Branding: print, embroidery, labels</li>
            <li>Target delivery window</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}

/* ---------------- router ---------------- */

export function SiteApp({ parts }) {
  const page = parts[0] || ''
  const sub = parts[1] || ''
  const view = page === 'services' && sub
    ? <ServicePage slug={sub} />
    : {
        '': <Home />,
        'about': <About />,
        'services': <Services />,
        'process': <Process />,
        'portfolio': <Portfolio />,
        'blog': <Blog />,
        'contact': <Contact />,
      }[page] || <Home />
  return <SiteShell parts={parts}>{view}</SiteShell>
}