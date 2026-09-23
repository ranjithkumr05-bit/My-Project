// components/SubcategoryCard.jsx — sub-category card (image + name + blurb).
import { IMG_DIMS, MISSING_IMAGES, imgSrc, imgSrcFallback } from '../data/services.js'

export default function SubcategoryCard({ svc, sub, index }) {
  const pick = (svc.galleryImages && svc.galleryImages[index % svc.galleryImages.length]) || svc.image
  const src = imgSrc(pick)
  const fb = imgSrcFallback(pick)
  const [w, h] = IMG_DIMS[pick] || [800, 1000]
  const missing = MISSING_IMAGES.includes(pick)
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
    </article>
  )
}
