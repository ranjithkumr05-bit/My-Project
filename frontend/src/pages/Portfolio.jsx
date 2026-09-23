// pages/Portfolio.jsx - showcase placeholder (pics + contents to be set separately).
import { Link } from 'react-router-dom'

export default function Portfolio() {
  return (
    <section className="cw-section cw-page">
      <p className="cw-kicker-pill"><span className="dot" aria-hidden="true" /> OUR PORTFOLIO</p>
      <h1>Real Apparel. Made with Care.</h1>
      <div className="cw-cta-band" style={{ marginTop: '28px' }}>
        <h2>Have an Apparel Project in Mind?</h2>
        <p className="cw-lead">Share your requirements - we quote it, sample it, then produce it.</p>
        <div className="cw-cta-row" style={{ justifyContent: 'center' }}>
          <Link className="cw-gold-btn" to="/contact?type=quote">Get a Quote</Link>
          <Link className="btn" to="/contact?type=sample">Request a Sample</Link>
        </div>
      </div>
    </section>
  )
}