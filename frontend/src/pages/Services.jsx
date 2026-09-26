// pages/Services.jsx — main page: exactly the 8 required ServiceCards, in approved order.
import ServiceCard from '../components/ServiceCard.jsx'
import CostCalculator from '../components/CostCalculator.jsx'
import {REQUIRED_SLUGS, serviceBySlug} from '../data/services.js'

export default function Services() {
  return (
    <section className="cw-section cw-page">
      <h1>Our Services</h1>
      <p className="cw-lead">
        Everything we manufacture — choose a category to see details and request a quote.
      </p>
      <div className="cw-cards">
        {REQUIRED_SLUGS.map((slug) => {
          const svc = serviceBySlug(slug)
          return svc ? <ServiceCard key={slug} svc={svc} /> : null
        })}
      </div>
      <div className="cw-sec-head" style={{marginTop: 'var(--sp-8)'}}>
        <div>
          <p className="cw-kicker">Pricing and planning</p>
          <h2>Estimate Your Requirement</h2>
        </div>
      </div>
      <CostCalculator />
    </section>
  )
}
