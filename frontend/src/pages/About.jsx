// pages/About.jsx — extracted verbatim from site.jsx About().
export default function About() {
  const stats = [
    ['20 years', 'Family-run manufacturing in Tiruppur'],
    ['10 pcs', 'Minimum order quantity'],
    ['In-house QC', 'Daylight-lamp inspection every lot'],
    ['6 stages', 'From sourcing to dispatch'],
  ]
  return (
    <section className="cw-section cw-page">
      <h1>About Customwear</h1>
      <p className="cw-lead">
        A family-run B2B apparel manufacturer in Tiruppur for two decades — built around
        one promise: your brand, produced properly.
      </p>
      <div className="cw-grid2">
        <img src="/showcase/mfg-sourcing.jpg" alt="Fabric sourcing" loading="lazy" width="889" height="667" />
        <div>
          <h2>From yarn to export carton</h2>
          <p>
            We run the full chain in and around Tiruppur — fabric sourcing, cutting, stitching,
            printing, quality inspection and export packing — so a single enquiry covers the
            whole programme.
          </p>
          <h2>Built for B2B buyers</h2>
          <p>
            MOQs are explicit per product line. Every bulk run is preceded by a physical sample
            for approval. Production status is tracked through five defined stages, visible to
            you from enquiry to dispatch.
          </p>
          <h2>Branding that ships with the garment</h2>
          <p>
            Screen printing, embroidery, heat transfer, woven neck labels and private-label
            packaging are part of the line — not an afterthought.
          </p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginTop: '28px' }}>
        {stats.map(([value, label]) => (
          <div key={label} className="cw-stat-card">
            <div className="cw-stat-value">{value}</div>
            <div className="cw-stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div className="cw-photo-card">
        <img src="/showcase/hero.jpg" alt="Customwear manufacturing floor" loading="lazy" width="1024" height="576" />
        <div className="cw-photo-card-body">
          <h2 className="cw-photo-card-title">A floor built for volume and precision</h2>
          <p className="cw-photo-card-text">Cutting, stitching, print and packing run under one roof so quality never depends on a subcontractor's schedule.</p>
        </div>
      </div>
    </section>
  )
}
