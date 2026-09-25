// components/PageShell.jsx — header/nav/footer extracted from site.jsx.
// Driven by React Router location; single copy, no hash links.
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import { CONTACT_EMAIL, WA_DEFAULT_MSG, SERVICES, waLink } from '../data/services.js'

const HEADER_NAV = [
  ['/', 'Home', true],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/portfolio', 'Portfolio'],
  ['/blog', 'Blog'],
  ['/contact?type=quote', 'Get a Quote'],
]

const FOOTER_NAV = [
  ...HEADER_NAV.slice(0, 3),
  ['/process', 'Process'],
  ...HEADER_NAV.slice(3),
]

export default function PageShell({ children }) {
  const [open, setOpen] = useState(false)
  // Hide the fixed contact floats while the footer is on screen so they never
  // cover contact/copyright content (buttons stay put everywhere else).
  const footerRef = useRef(null)
  const [footSeen, setFootSeen] = useState(false)
  useEffect(() => {
    if (!footerRef.current) return
    const io = new IntersectionObserver(([e]) => setFootSeen(e.isIntersecting))
    io.observe(footerRef.current)
    return () => io.disconnect()
  }, [])
  const { pathname } = useLocation()
  const onHero = pathname === '/'
  const wa = waLink(WA_DEFAULT_MSG)
  // Strip ?query so /contact?type=quote still highlights the /contact nav item.
  const active = (to, exact) => {
    const path = to.split('?')[0]
    return exact ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
  }
  return (
    <div className="cw-site">
      <a className="cw-skip" href="#main">Skip to content</a>
      <header className={`cw-header ${onHero ? 'on-hero' : ''}`}>
        <Link className="brand" to="/" aria-label="Customwear home"><img className="brand-logo" src="/logo-small.png" alt="Customwear logo" width="44" height="44" /><span className="brand-text">CUSTOM<em>WEAR</em><small>TIRUPPUR · B2B APPAREL</small></span></Link>
        <button className="cw-burger" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
        <nav className={`cw-nav ${open ? 'open' : ''}`} aria-label="primary">
          {HEADER_NAV.map(([to, label, exact]) => (
            <NavLink key={to} to={to} end={!!exact} className={active(to, exact) ? 'active' : undefined} aria-current={active(to, exact) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <a className="cw-wa-cta" href={wa} target="_blank" rel="noopener noreferrer">
          Connect On Whatsapp <Icon name="arrow" />
        </a>
      </header>

      <div className={`cw-float ${footSeen ? 'hide' : ''}`} aria-hidden={footSeen || undefined}>
        <a className="cw-float-btn wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.15-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.9.92-3-.2-.31a8.2 8.2 0 1 1 6.84 3.74Zm4.5-6.16c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.17 1.72 2.63 4.18 3.69.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" /></svg>
        </a>
        <Link className="cw-float-btn call" to="/contact" aria-label="Contact us">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" /></svg>
        </Link>
      </div>

      <main id="main">{children}</main>
      <footer className="cw-footer" ref={footerRef}>
        <div className="cw-foot-grid">
          <div className="cw-foot-brand">
            <p className="brand"><img className="brand-logo" src="/logo-small.png" alt="Customwear logo" width="44" height="44" /><span className="brand-text">CUSTOM<em>WEAR</em><small>TIRUPPUR · B2B APPAREL</small></span></p>
            <p className="muted">B2B apparel manufacturing — polos, t-shirts, jerseys, hoodies &amp; private label.</p>
          </div>
          <nav aria-label="footer">
            <p className="cw-foot-title">Quick Links</p>
            {FOOTER_NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
          <nav aria-label="footer services">
            <p className="cw-foot-title">Services</p>
            {SERVICES.map((s) => <Link key={s.slug} to={`/services/${s.slug}`}>{s.name}</Link>)}
          </nav>
          <div className="cw-foot-contact">
            <p className="cw-foot-title">Contact</p>
            <p className="muted">Tiruppur, Tamil Nadu — custom apparel &amp; private-label manufacturing.<br /><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
        </div>
        <div className="cw-foot-bottom">
          <span>© {new Date().getFullYear()} Customwear.</span>
        </div>
      </footer>
    </div>
  )
}
