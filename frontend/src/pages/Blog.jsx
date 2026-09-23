// pages/Blog.jsx — genuine buyer-education notes (no dates/authors invented).
import { Link, Navigate, useParams } from 'react-router-dom'

export const POSTS = [
  ['Choosing GSM for your programme', 'Buying Guide', 'Fabric weight decides drape, cost and durability. 160 GSM suits promo tees; 180–200 GSM works for retail; 300+ GSM for fleece. We match GSM to use-case before quoting.'],
  ['Why sample before bulk', 'Production', 'A physical sample catches grading, stitching and colour issues while they are still cheap to fix. Every Customwear bulk order follows an approved sample — no exceptions.'],
  ['Screen print vs embroidery', 'Branding', 'Screen print scales to large artwork and photo-detail; embroidery lasts longer on polos and workwear. We advise per garment type and budget.'],
  ['What is in a tech pack', 'Getting Started', 'Measurements per size, fabric spec, artwork files, label placement and packing instructions. Send even a rough version — we help complete the rest.'],
]

export const postSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export const postBySlug = (slug) => POSTS.find(([title]) => postSlug(title) === slug)

export default function Blog() {
  return (
    <section className="cw-section cw-page">
      <h1>Blog</h1>
      <p className="cw-lead">Practical notes for apparel buyers.</p>
      <div className="cw-posts">
        {POSTS.map(([title, tag, body]) => (
          <Link className="cw-post" key={title} to={`/blog/${postSlug(title)}`}>
            <span className="badge gold">{tag}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function BlogPost() {
  const { slug } = useParams()
  const post = postBySlug(slug)
  if (!post) return <Navigate to="/blog" replace />
  const [title, tag, body] = post
  return (
    <section className="cw-section cw-page">
      <Link className="cw-backlink" to="/blog">← All notes</Link>
      <div style={{ marginTop: '16px' }}>
        <span className="badge gold">{tag}</span>
      </div>
      <h1>{title}</h1>
      <p className="cw-lead" style={{ maxWidth: '68ch' }}>{body}</p>
      <div className="cw-cta-row" style={{ marginTop: '24px' }}>
        <Link className="cw-gold-btn" to="/contact?type=quote">Get a Quote <span aria-hidden="true">↗</span></Link>
        <Link className="btn" to="/services">Explore our apparel</Link>
      </div>
    </section>
  )
}
