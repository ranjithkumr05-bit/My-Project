// pages/Portfolio.jsx - showcase. Category gallery + filters (.cw-workcard/.cw-filter)
// remain reserved for separately-supplied client content (see portfolio.spec.mjs);
// this page ships an honest sample-imagery strip instead of a client gallery.
import {Link} from 'react-router-dom'
import {imgSrc, quoteHref, sampleHref} from '../data/services.js'

// Same proven sample imagery as the Home strip (files verified present; not labelled
// as client projects). p-school-college-tshirts and p-hoodies were removed from
// /showcase, so those two categories reuse the parent category shot that remains.
const SAMPLES = ['p-office-corporate', 'p-sportswear', 'school-college', 'hoodies-sweatshirts']

export default function Portfolio() {
  return (
    <section className="cw-section cw-page">
      <p className="cw-kicker-pill">
        <span className="dot" aria-hidden="true" /> OUR PORTFOLIO
      </p>
      <h1>Real Apparel. Made with Care.</h1>
      <p className="cw-lead">
        Sample imagery from our categories — representative of what we make, not labelled as client
        projects.
      </p>
      <h2>A look at our apparel</h2>
      <div className="cw-home-work">
        {SAMPLES.map((img) => (
          <img
            key={img}
            src={imgSrc(img)}
            alt={`${img.replace(/^p-/, '').replace(/-/g, ' ')} sample`}
            loading="lazy"
            width="904"
            height="600"
          />
        ))}
      </div>
      <div className="cw-cta-band" style={{marginTop: 'var(--sp-7)'}}>
        <h2>Have an Apparel Project in Mind?</h2>
        <p className="cw-lead">
          Share your requirements - we quote it, sample it, then produce it.
        </p>
        <div className="cw-cta-row" style={{justifyContent: 'center'}}>
          <Link className="cw-gold-btn" to={quoteHref()}>
            Get a Quote
          </Link>
          <Link className="btn" to={sampleHref()}>
            Request a Sample
          </Link>
        </div>
      </div>
    </section>
  )
}
