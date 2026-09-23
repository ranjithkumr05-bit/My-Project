// pages/Blog.jsx — genuine buyer-education notes (no dates/authors invented).
export const POSTS = [
  ['Choosing GSM for your programme', 'Buying Guide', 'Fabric weight decides drape, cost and durability. 160 GSM suits promo tees; 180–200 GSM works for retail; 300+ GSM for fleece. We match GSM to use-case before quoting.'],
  ['Why sample before bulk', 'Production', 'A physical sample catches grading, stitching and colour issues while they are still cheap to fix. Every Customwear bulk order follows an approved sample — no exceptions.'],
  ['Screen print vs embroidery', 'Branding', 'Screen print scales to large artwork and photo-detail; embroidery lasts longer on polos and workwear. We advise per garment type and budget.'],
  ['What is in a tech pack', 'Getting Started', 'Measurements per size, fabric spec, artwork files, label placement and packing instructions. Send even a rough version — we help complete the rest.'],
]

export default function Blog() {
  const posts = POSTS
  return (
    <section className="cw-section cw-page">
      <h1>Blog</h1>
      <p className="cw-lead">Practical notes for apparel buyers.</p>
      <div className="cw-posts">
        {posts.map(([title, tag, body]) => (
          <article className="cw-post" key={title}>
            <span className="badge gold">{tag}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
