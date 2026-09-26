// pages/ServiceDetail.jsx — per-slug page: hero + exactly its 8 subcards.
import {Link, Navigate, useParams} from 'react-router-dom'
import SubcategoryCard from '../components/SubcategoryCard.jsx'
import Icon from '../components/Icon.jsx'
import {
  IMG_DIMS,
  MISSING_IMAGES,
  imgSrc,
  imgSrcFallback,
  quoteHref,
  sampleHref,
  serviceBySlug,
  waLink,
} from '../data/services.js'

export default function ServiceDetail() {
  const {slug} = useParams()
  const svc = serviceBySlug(slug)
  if (!svc) return <Navigate to="/" replace />
  const missing = MISSING_IMAGES.includes(svc.image)
  const [imgW, imgH] = IMG_DIMS[svc.image] || [800, 1000]
  const wa = waLink(`Hi Customwear — I need a quotation for ${svc.name}.`)
  return (
    <section className="cw-section cw-page">
      <p>
        <Link className="btn" to="/services">
          <Icon name="back" /> All Services
        </Link>
      </p>
      <div className="cw-grid2">
        {missing ? (
          <div
            className="cw-img-missing"
            role="img"
            aria-label={`${svc.name} — sample photo coming soon`}
            style={{borderRadius: '12px', minHeight: '220px'}}
          >
            <span>{svc.name}</span>
            <small>Photo coming soon</small>
          </div>
        ) : (
          <img
            src={imgSrc(svc.image)}
            onError={(e) => {
              if (!e.currentTarget.dataset.fb) {
                e.currentTarget.dataset.fb = '1'
                e.currentTarget.src = imgSrcFallback(svc.image)
              }
            }}
            alt={svc.alt}
            loading="lazy"
            width={imgW}
            height={imgH}
            style={{width: '100%', borderRadius: '12px'}}
          />
        )}
        <div>
          <p className="badge gold">{svc.short}</p>
          <h1 style={{marginTop: 'var(--sp-2)'}}>{svc.heroHeadline}</h1>
          <p className="cw-lead">{svc.heroSub}</p>
          <div
            style={{
              display: 'flex',
              gap: 'var(--sp-3)',
              flexWrap: 'wrap',
              marginTop: 'var(--sp-5)',
            }}
          >
            <Link className="btn btn-gold" to={quoteHref(svc.slug)}>
              Get a Quote
            </Link>
            <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
              WhatsApp Enquiry
            </a>
          </div>
        </div>
      </div>
      <div style={{marginTop: 'var(--sp-7)'}}>
        <h2>Overview</h2>
        <p>{svc.intro}</p>
      </div>
      <div style={{marginTop: 'var(--sp-6)'}}>
        <h2>Subcategories</h2>
        <div className="cw-cards">
          {svc.subs.map((sub, i) => (
            <SubcategoryCard key={sub.name} svc={svc} sub={sub} index={i} />
          ))}
        </div>
      </div>
      <div style={{marginTop: 'var(--sp-6)'}}>
        <h2>Manufacturing & Ordering</h2>
        <p>{svc.manufacturing}</p>
        <p className="muted" style={{marginTop: 'var(--sp-2)'}}>
          MOQs are explicit per product line — our overall minimum is around 10 pieces. Get in touch
          to confirm capacity for your quantity and timeline.
        </p>
      </div>
      {/* Pricing lives on /services only. The calculator has a service picker, so
          one copy covers all eight categories — repeating it on every detail page
          only made the same form eight times over. */}
      <div
        style={{
          marginTop: 'var(--sp-7)',
          display: 'flex',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link className="btn btn-gold" to={quoteHref(svc.slug)}>
          Get a Quote
        </Link>
        <Link className="btn" to={sampleHref(svc.slug)}>
          Request a Sample
        </Link>
        <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
          WhatsApp Us
        </a>
      </div>
      <p style={{textAlign: 'center', marginTop: 'var(--sp-4)'}}>
        <Link className="btn" to="/services">
          <Icon name="back" /> Back to Services
        </Link>
      </p>
    </section>
  )
}
