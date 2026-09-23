// components/SubcategoryCard.jsx — sub-category card with quote CTAs.
import { Link } from 'react-router-dom'
import { IMG_DIMS, MISSING_IMAGES, imgSrc, imgSrcFallback, waLink } from '../data/services.js'

export default function SubcategoryCard({ svc, sub, index }) {
  const pick = (svc.galleryImages && svc.galleryImages[index % svc.galleryImages.length]) || svc.image
  const src = imgSrc(pick)
  const fb = imgSrcFallback(pick)
  const [w, h] = IMG_DIMS[pick] || [800, 1000]
  const missing = MISSING_IMAGES.includes(pick)
  const wa = waLink(`Hi Customwear — I need a quotation for ${sub.name} (${svc.name}).`)
  const alt = `${sub.name} — ${svc.short} example`
  return (
    <article className="cw-card cw-subcard">
      {missing ? (
        <div className="cw-img-missing" role="img" aria-label={alt}>
          <span>{sub.name}</span>
          <small>Photo coming soon</small>
        </div>
      ) : (
        <img
          src={src}
          onError={(e) => { if (!e.currentTarget.dataset.fb) { e.currentTarget.dataset.fb = '1'; e.currentTarget.src = fb } }}
          alt={alt}
          loading="lazy"
          width={w}
          height={h}
        />
      )}
      <h3>{sub.name}</h3>
      <p>{sub.blurb}</p>
      <div className="cw-subcard-ctas">
        <Link className="btn btn-gold" to={`/contact?type=quote&service=${svc.slug}`}>Get a Quote</Link>
        <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </article>
  )
}
