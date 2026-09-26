// components/PageShell.jsx — header/nav/footer extracted from site.jsx.
// Driven by React Router location; single copy, no hash links.
import {useEffect, useRef, useState} from 'react'
import {Link, NavLink, useLocation} from 'react-router-dom'
import Icon from './Icon.jsx'
import {WA_DEFAULT_MSG, waLink, serviceBySlug, quoteHref} from '../data/services.js'

const HEADER_NAV = [
  ['/', 'Home', true],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/portfolio', 'Portfolio'],
  ['/blog', 'Blog'],
  ['/track', 'Track Order'],
]

// Footer quick links: the six public routes plus /track (which joined the header
// nav after this list was written).
const QUICK_LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/portfolio', 'Portfolio'],
  ['/blog', 'Blog'],
  ['/track', 'Track Order'],
  ['/contact', 'Contact'],
]

// Footer product labels come straight from the catalogue so a category rename
// can never drift out of sync with the footer. Curated five, not all eight —
// "View all products" carries people to /services instead of duplicating them.
const FOOTER_PRODUCT_SLUGS = [
  'corporate-office-apparel',
  'sportswear-team-jerseys',
  'school-college-tshirts',
  'workwear-staff-apparel',
  'private-label',
]

// Platform home pages for now; swap each for the real profile URL when the accounts exist.
const SOCIALS = [
  ['Instagram', 'instagram', 'https://www.instagram.com/'],
  ['Facebook', 'facebook', 'https://www.facebook.com/'],
  ['LinkedIn', 'linkedin', 'https://www.linkedin.com/'],
]

// Ponytail: placeholder company details — five literals to swap when the real ones land.
// The live WhatsApp number is not a placeholder; it stays WA_NUMBER in data/services.js.
const PHONE_DISPLAY = '+91 XXXXX XXXXX'
const PHONE_TEL = '+91XXXXXXXXXX'
const SALES_EMAIL = 'sales@customwear.in'
const ADDRESS = '123 Example Street, Tiruppur, Tamil Nadu 641604'
const HOURS = 'Mon–Sat · 9:00 AM – 7:00 PM'
const GSTIN = '33XXXXXXXXXXXXX'

// Filled brand glyph (the stroke-only set would render it as an outline blob). Shared by
// the fixed float button and the footer CTA so the mark is defined once.
const WA_PATH =
  'M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.15-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.9.92-3-.2-.31a8.2 8.2 0 1 1 6.84 3.74Zm4.5-6.16c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.17 1.72 2.63 4.18 3.69.58.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z'

export default function PageShell({children, user}) {
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
  const {pathname} = useLocation()
  const onHero = pathname === '/'
  const wa = waLink(WA_DEFAULT_MSG)
  // Admin-only portal: admins get the portal, a signed-in buyer stays on the public
  // site (so the Account link never points a buyer at a route that bounces them),
  // and a signed-out visitor goes to the login page — linking to "/" here made the
  // button look dead because it re-rendered the page they were already on.
  const isAdmin = user?.role === 'admin'
  // Header CTA. A signed-out visitor gets Register, not a login link: /login is the
  // admin console, and no public chrome should point at it. Admins get the portal;
  // a signed-in buyer stays on the public site.
  const accountHref = isAdmin ? '/admin' : user ? '/' : '/register'
  const accountLabel = isAdmin ? 'Admin' : user ? 'My Account' : 'Register'
  // Strip ?query so /contact?type=quote still highlights the /contact nav item.
  const active = (to, exact) => {
    const path = to.split('?')[0]
    return exact ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
  }
  return (
    <div className="cw-site">
      <a className="cw-skip" href="#main">
        Skip to content
      </a>
      <header className={`cw-header ${onHero ? 'on-hero' : ''}`}>
        <Link className="brand" to="/" aria-label="Customwear home">
          <img
            className="brand-logo"
            src="/logo-small.png"
            alt="Customwear logo"
            width="44"
            height="44"
          />
          <span className="brand-text">
            CUSTOM<em>WEAR</em>
            <small>TIRUPPUR · B2B APPAREL</small>
          </span>
        </Link>
        <nav className={`cw-nav ${open ? 'open' : ''}`} aria-label="primary">
          {HEADER_NAV.map(([to, label, exact]) => (
            <NavLink
              key={to}
              to={to}
              end={!!exact}
              className={active(to, exact) ? 'active' : undefined}
              aria-current={active(to, exact) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          {/* Mobile-only twin of the desktop Get a Quote CTA, which lives in
              .cw-header-actions. Hidden at desktop width by CSS. */}
          <Link
            className="cw-gold-btn cw-nav-cta-mobile"
            to={quoteHref()}
            onClick={() => setOpen(false)}
          >
            Get a Quote <Icon name="arrow" size={16} />
          </Link>
        </nav>
        <div className="cw-header-actions">
          <Link className="cw-loginlink" to={accountHref}>
            {accountLabel}
          </Link>
          <button
            className="cw-burger"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </header>

      <div className={`cw-float ${footSeen ? 'hide' : ''}`} aria-hidden={footSeen || undefined}>
        <a
          className="cw-float-btn wa"
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d={WA_PATH} />
          </svg>
        </a>
        <Link className="cw-float-btn call" to="/contact" aria-label="Contact us">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
          </svg>
        </Link>
      </div>

      <main id="main">{children}</main>
      <footer className="cw-footer" ref={footerRef}>
        <div className="cw-foot-grid">
          <div className="cw-foot-brand">
            <p className="brand">
              <img
                className="brand-logo"
                src="/logo-small.png"
                alt="Customwear logo"
                width="44"
                height="44"
              />
              <span className="brand-text">
                CUSTOM<em>WEAR</em>
                <small>TIRUPPUR · B2B APPAREL</small>
              </span>
            </p>
            <p className="muted cw-foot-desc">
              Established in 2017, Customwear is a premier apparel manufacturing partner for
              schools, hotels and businesses — polos, t-shirts, jerseys, hoodies and private label.
              We turn your concepts into reality with precision, quality and care.
            </p>
            <div className="cw-foot-social">
              {SOCIALS.map(([label, icon, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Customwear on ${label}`}
                >
                  <Icon name={icon} size={20} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="footer">
            <p className="cw-foot-title">Quick Links</p>
            {QUICK_LINKS.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>

          <nav aria-label="footer products">
            <p className="cw-foot-title">Products</p>
            {FOOTER_PRODUCT_SLUGS.map((slug) => {
              const svc = serviceBySlug(slug)
              return svc ? (
                <Link key={slug} to={`/services/${slug}`}>
                  {svc.short}
                </Link>
              ) : null
            })}
            <Link to="/services">
              View all products <Icon name="arrow" size={14} />
            </Link>
          </nav>

          <div className="cw-foot-contact">
            <p className="cw-foot-title">Contact</p>
            <a className="cw-foot-line" href={`tel:${PHONE_TEL}`}>
              <Icon name="phone" size={18} />
              <span>{PHONE_DISPLAY}</span>
            </a>
            <a className="cw-foot-line" href={`mailto:${SALES_EMAIL}`}>
              <Icon name="mail" size={18} />
              <span>{SALES_EMAIL}</span>
            </a>
            <p className="cw-foot-line">
              <Icon name="pin" size={18} />
              <span>{ADDRESS}</span>
            </p>
            <p className="cw-foot-line">
              <Icon name="clock" size={18} />
              <span>{HOURS}</span>
            </p>
            <a className="cw-foot-wa" href={wa} target="_blank" rel="noopener noreferrer">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={WA_PATH} />
              </svg>
              Chat on WhatsApp
            </a>
            <p className="cw-foot-gstin">GSTIN: {GSTIN}</p>
          </div>
        </div>

        <div className="cw-foot-bottom">
          <span>© {new Date().getFullYear()} Customwear. All rights reserved.</span>
          <div className="cw-foot-legal">
            {/* Placeholder links: no /privacy or /terms page exists yet, so they are marked
                data-placeholder (the UI audit skips those instead of reporting dead links). */}
            <a href="#" data-placeholder="privacy">
              Privacy Policy
            </a>
            <a href="#" data-placeholder="terms">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
