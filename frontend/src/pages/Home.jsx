// pages/Home.jsx — customer journey: hero → trust → services →
// process → customization → sample → quote CTA.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard.jsx'
import Icon from '../components/Icon.jsx'
import { PROCESS_STEPS } from './Process.jsx'
import { REQUIRED_SLUGS, serviceBySlug } from '../data/services.js'

const TILE_ORDER = REQUIRED_SLUGS

const BRANDING = [
  ['Logo printing', 'Chest, sleeve and back prints matched to your artwork.'],
  ['Embroidery', 'Thread work for polos, workwear and headwear-grade detail.'],
  ['Custom colours', 'Fabric shades and trims chosen against your references.'],
  ['Apparel selection', 'We suggest the right knit, GSM and fit for the use-case.'],
  ['Private label', 'Your neck labels, tags and packing — banyan and vest included.'],
]

export default function Home() {
  const videoRef = useRef(null)

  useEffect(() => {
    // Respect prefers-reduced-motion: keep the hero still for users who ask for it.
    const v = videoRef.current
    if (!v) return undefined
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      if (mq.matches) v.pause()
      else v.play().catch(() => { /* autoplay blocked — poster stays */ })
    }
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  return (
    <>
      <section className="cw-hero-fs">
        <video ref={videoRef} className="cw-hero-video" autoPlay muted loop playsInline preload="none" poster="/showcase/homepage-workfloor.jpg" src="/showcase/hero-loop.mp4" aria-hidden="true" />
        <div className="cw-hero-overlay" />
        <div className="cw-hero-inner">
          <div className="cw-hero-left">
            <p className="cw-kicker-pill"><span className="dot" aria-hidden="true" /> Apparel · Workwear · Private Label</p>
            <h1>We build exactly to your spec.</h1>
            <p className="cw-hero-sub">
              Your Tiruppur partner for custom tees, teamwear, jerseys and private-label
              runs — from around 10 pieces, sampled before bulk, delivered to your door.
            </p>
            <div className="cw-hero-ctas">
              <Link className="cw-gold-btn" to="/services">Explore Our Services <Icon name="arrow" /></Link>
              <Link className="cw-ghost-btn" to="/contact?type=quote">Get a Quote</Link>
            </div>
          </div>

          <div className="cw-hero-right">
            <div className="cw-hero-card">
              <strong>10 pcs</strong>
              <span>minimum order quantity</span>
            </div>
            <div className="cw-hero-card">
              <strong>8</strong>
              <span>product categories</span>

            </div>
            <div className="cw-hero-card">
              <strong>6</strong>
              <span>production stages, sourcing to dispatch</span>
            </div>
            <div className="cw-hero-card">
              <strong>100%</strong>
              <span>sample approved before bulk</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-grid2 cw-trust">
          <img src="/showcase/mfg-sourcing.jpg" alt="Fabric rolls selected for a production run" loading="lazy" width="889" height="667" />
          <div>
            <p className="cw-kicker">Tiruppur manufacturing, family-run</p>
            <h2>Two decades around garments, one team on your order</h2>
            <p>
              We come from roughly 20 years of family garment experience in Tiruppur.
              Today that know-how runs your programme end to end — sourcing, cutting,
              printing/finishing arrangements, stitching, quality checking, packing
              and delivery — so a single enquiry covers the whole run.
            </p>
            <p className="muted">Minimums start around 10 pieces. Every bulk run follows an approved sample.</p>
            <div className="cw-workflow" aria-label="Manufacturing workflow">
              {['Sourcing', 'Cutting', 'Print / finish', 'Stitching', 'Quality check', 'Packing & delivery'].map((s, i) => (
                <span key={s} className="cw-flow-step"><em>{i + 1}</em>{s}</span>
              ))}
            </div>
            <Link className="btn" to="/about">About our background <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-sec-head">
          <div>
            <p className="cw-kicker">What we make</p>
            <h2>Every category is made on one manufacturing floor</h2>
          </div>
          <Link className="btn" to="/services">All services <Icon name="arrow" /></Link>
        </div>
        <div className="cw-cards">
          {TILE_ORDER.map((slug) => {
            const svc = serviceBySlug(slug)
            return svc ? <ServiceCard key={slug} svc={svc} /> : null
          })}
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-sec-head">
          <div>
            <p className="cw-kicker">How it works</p>
            <h2>From requirement to delivery, in five steps</h2>
          </div>
          <Link className="btn" to="/process">Full process</Link>
        </div>
        <ol className="cw-timeline">
          {[
            ['Share your requirements', 'Product, quantity, sizes and target date — a tech pack helps, a rough note works.'],
            ['Discuss apparel and design', 'We confirm fabric, fit, colours and branding with you.'],
            ['We coordinate production', 'Sourcing, cutting, printing/finishing arrangements and stitching are lined up.'],
            ['You approve the garments', 'Finished lots are checked for measurements, seams and finish.'],
            ['Packed and delivered', 'Polybagged, tagged and cartonised, with delivery arranged.'],
          ].map(([title, desc], i) => (
            <li key={title}>
              <em>{String(i + 1).padStart(2, '0')}</em>
              <strong>{title}</strong>
              <span>{desc}</span>
            </li>
          ))}
        </ol>
        <div className="cw-steps-imgs" aria-hidden="true">
          {PROCESS_STEPS.slice(0, 3).map(([title, img]) => (
            <img key={img} src={`/showcase/${img}.jpg`} alt="" loading="lazy" width="672" height="504" />
          ))}
        </div>
      </section>

      <section className="cw-section cw-brandband">
        <div className="cw-grid2">
          <div>
            <p className="cw-kicker">Customization & branding</p>
            <h2>Your logo, colours and labels — discussed upfront</h2>
            <p>Tell us how the garment should carry your brand. We confirm what is practical for your fabric and quantity before quoting.</p>
            <Link className="cw-gold-btn" to="/contact?type=quote&service=private-label">Discuss private label <Icon name="arrow" /></Link>
          </div>
          <ul className="cw-brand-list">
            {BRANDING.map(([title, desc]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cw-section cw-sample">
        <div className="cw-sample-inner">
          <div>
            <h2>Want to Explore a Sample?</h2>
            <p>Tell us which apparel you are interested in and what you need. Contact our team to discuss sample availability and the next steps for your requirement.</p>
          </div>
          <Link className="cw-gold-btn" to="/contact?type=sample">Request a Sample <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="cw-section cw-cta-band">
        <h2>Have an Apparel Project in Mind?</h2>
        <p className="cw-lead">Share your apparel requirements, approximate quantity, design ideas, and preferred timeline. Our team can discuss the next steps with you.</p>
        <div className="cw-cta-row">
          <Link className="cw-gold-btn" to="/contact?type=quote">Get a Quote <Icon name="arrow" /></Link>
          <Link className="btn" to="/contact?type=sample">Request a Sample</Link>
        </div>
      </section>
    </>
  )
}
