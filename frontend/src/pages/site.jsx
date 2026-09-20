import { useState } from 'react'
import { navigate, useHashRoute } from '../ui.jsx'

/* ---------------- shared shell ---------------- */

const NAV = [
  ['', 'Home'],
  ['about', 'About'],
  ['services', 'Services'],
  ['portfolio', 'Portfolio'],
  ['blog', 'Blog'],
  ['contact', 'Contact'],
]

export function SiteShell({ parts, children }) {
  const [open, setOpen] = useState(false)
  const active = parts[0] || ''
  return (
    <div className="cw-site">
      <header className="cw-header">
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
          <a className="btn cw-nav-cta" href="#/contact">Get a Quote</a>
          <a className="cw-loginlink" href="#/login">Portal login</a>
        </nav>
      </header>
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
      <section className="cw-hero">
        <div className="cw-hero-text">
          <p className="cw-kicker">B2B Apparel Manufacturing · Tiruppur, India</p>
          <h1>Custom apparel, manufactured to your brand.</h1>
          <p className="cw-lead">
            Polos, t-shirts, jerseys, hoodies, uniforms and private-label programmes —
            MOQ-managed, branding-ready, tracked from fabric sourcing to export packing.
          </p>
          <div className="row">
            <a className="btn btn-gold" href="#/contact">Request a Quotation</a>
            <a className="btn" href="#/portfolio">View Portfolio</a>
          </div>
        </div>
        <img className="cw-hero-img" src="/showcase/hero.jpg" alt="Garment factory floor" />
      </section>

      <section className="cw-strip">
        {[
          ['8', 'product categories'],
          ['MOQ', 'managed per line'],
          ['5', 'production stages tracked'],
          ['100%', 'sample-before-bulk'],
        ].map(([big, small]) => (
          <div key={small} className="cw-stat"><strong>{big}</strong><span>{small}</span></div>
        ))}
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
        <a className="btn btn-gold" href="#/contact">Start an Enquiry</a>
      </section>
    </>
  )
}

/* ---------------- About ---------------- */

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
    </section>
  )
}

/* ---------------- Services ---------------- */

const SERVICES = [
  ['Contract Manufacturing', 'Cut-make-trim production against your tech pack, with graded size sets.', 'mfg-stitching'],
  ['Private Label', 'Your labels, your packing, your brand — produced on our floor.', 'private-label'],
  ['Custom Printing & Embroidery', 'Screen print, sublimation and embroidery with colour matching.', 'mfg-printing'],
  ['Sampling', 'Physical pre-production samples before any bulk commitment.', 'mfg-cutting'],
  ['Quality Assurance', 'Per-lot inspection under daylight lamps with documented checks.', 'mfg-quality'],
  ['Export Packing', 'Polybagging, carton marking and shipment-ready packing.', 'mfg-packing'],
]

function Services() {
  return (
    <section className="cw-section cw-page">
      <h1>Services</h1>
      <p className="cw-lead">Everything between your tech pack and the shipment.</p>
      <div className="cw-cards">
        {SERVICES.map(([title, desc, img]) => (
          <article className="cw-card" key={title}>
            <img src={`/showcase/${img}.jpg`} alt="" aria-hidden="true" loading="lazy" />
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
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
  const view = {
    '': <Home />,
    'about': <About />,
    'services': <Services />,
    'portfolio': <Portfolio />,
    'blog': <Blog />,
    'contact': <Contact />,
  }[page] || <Home />
  return <SiteShell parts={parts}>{view}</SiteShell>
}