// pages/ServiceDetail.jsx — per-slug page: hero + exactly its 8 subcards.
import { Link, Navigate, useParams } from 'react-router-dom'
import SubcategoryCard from '../components/SubcategoryCard.jsx'
import { IMG_DIMS, MISSING_IMAGES, imgSrc, imgSrcFallback, serviceBySlug, waLink } from '../data/services.js'

export default function ServiceDetail() {
  const { slug } = useParams()
  const svc = serviceBySlug(slug)
  if (!svc) return <Navigate to="/" replace />
  const missing = MISSING_IMAGES.includes(svc.image)
  const [imgW, imgH] = IMG_DIMS[svc.image] || [800, 1000]
  const wa = waLink(`Hi Customwear — I need a quotation for ${svc.name}.`)
  return (
    <section className="cw-section cw-page">
      <p><Link className="btn" to="/services">← All Services</Link></p>
      <div className="cw-grid2">
        {missing ? (
          <div className="cw-img-missing" role="img" aria-label={`${svc.name} — sample photo coming soon`} style={{ borderRadius: '12px', minHeight: '220px' }}>
            <span>{svc.name}</span>
            <small>Photo coming soon</small>
          </div>
        ) : (
          <img
            src={imgSrc(svc.image)}
            onError={(e) => { if (!e.currentTarget.dataset.fb) { e.currentTarget.dataset.fb = '1'; e.currentTarget.src = imgSrcFallback(svc.image) } }}
            alt={svc.alt}
            loading="lazy"
            width={imgW}
            height={imgH}
            style={{ width: '100%', borderRadius: '12px' }}
          />
        )}
        <div>
          <p className="badge gold">{svc.short}</p>
          <h1 style={{ marginTop: '8px', fontSize: 'clamp(26px, 3.4vw, 40px)' }}>{svc.heroHeadline}</h1>
          <p className="cw-lead">{svc.heroSub}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
            <Link className="btn btn-gold" to={`/contact?type=quote&service=${svc.slug}`}>Get a Quote</Link>
            <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp Enquiry</a>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '28px' }}>
        <h2>Overview</h2>
        <p>{svc.intro}</p>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h2>Subcategories</h2>
        <div className="cw-cards">
          {svc.subs.map((sub, i) => <SubcategoryCard key={sub.name} svc={svc} sub={sub} index={i} />)}
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h2>Manufacturing &amp; Ordering</h2>
        <p>{svc.manufacturing}</p>
        <p className="muted" style={{ marginTop: '8px' }}>MOQs are explicit per product line — our overall minimum is around 10 pieces. Get in touch to confirm capacity for your quantity and timeline.</p>
      </div>
      <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn btn-gold" to={`/contact?type=quote&service=${svc.slug}`}>Get a Quote</Link>
        <Link className="btn" to={`/contact?type=sample&service=${svc.slug}`}>Request a Sample</Link>
        <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
      </div>
      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        <Link className="btn" to="/services">← Back to Services</Link>
      </p>
    </section>
  )
}
