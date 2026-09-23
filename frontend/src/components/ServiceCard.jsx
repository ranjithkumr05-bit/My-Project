// components/ServiceCard.jsx — main-category card (image + title + description + CTA).
import { Link } from 'react-router-dom'
import { IMG_DIMS, MISSING_IMAGES, imgSrc, imgSrcFallback } from '../data/services.js'

export default function ServiceCard({ svc }) {
  const src = imgSrc(svc.image)
  const fb = imgSrcFallback(svc.image)
  const [w, h] = IMG_DIMS[svc.image] || [800, 1000]
  const missing = MISSING_IMAGES.includes(svc.image)
  return (
    <article className="cw-card">
      <Link to={`/services/${svc.slug}`} aria-label={`Explore ${svc.name}`}>
        {missing ? (
          <div className="cw-img-missing" role="img" aria-label={svc.alt}>
            <span>{svc.name}</span>
            <small>Photo coming soon</small>
          </div>
        ) : (
          <img
            src={src}
            onError={(e) => { if (!e.currentTarget.dataset.fb) { e.currentTarget.dataset.fb = '1'; e.currentTarget.src = fb } }}
            alt={svc.alt}
            loading="lazy"
            width={w}
            height={h}
          />
        )}
      </Link>
      <h3>{svc.name}</h3>
      <p>{svc.description}</p>
      <div className="cw-card-ctas">
        <Link className="btn btn-gold" to={`/services/${svc.slug}`}>Explore {svc.short} ↗</Link>
        <Link className="cw-card-quote" to={`/contact?type=quote&service=${svc.slug}`}>Get a Quote →</Link>
      </div>
    </article>
  )
}
