// pages/Process.jsx — extracted verbatim from site.jsx Process(), hash links → <Link>.
import {Link} from 'react-router-dom'
import {imgSrc, quoteHref} from '../data/services.js'

// Six stages, three available step photos. Stages without a dedicated shot
// reuse the closest match; the old mfg-*.jpg set is gone from /showcase and
// every key below must resolve to a file that actually exists.
const FALLBACK_STEP = 'step-discuss'
const PROCESS_STEPS = [
  [
    'Fabric Sourcing',
    'step-discuss',
    'We source knit, woven and fleece from mills we trust, with GSM and hand-feel matched to your programme before anything is cut.',
  ],
  [
    'Cutting',
    'step-production',
    'Patterns are nested, fabric is spread to the required GSM and layer count, then cut on auto spreaders with grader accuracy across the size set.',
  ],
  [
    'Stitching',
    'step-production',
    'Garments are assembled on our floor across lockstitch, coverstitch and reinforcement operations, with style-specific workstations for polos, tees, jerseys and hoodies.',
  ],
  [
    'Printing & Embroidery',
    'step-production',
    'Screen print, DTG, sublimation and embroidery run as parallel lines. Colour is matched to your reference and verified on a strike-off before bulk.',
  ],
  [
    'Quality Inspection',
    'step-production',
    'Each lot is inspected under daylight lamps — measurements, seams, stitch density and finish — with a QC report shared before dispatch.',
  ],
  [
    'Packing & Dispatch',
    'step-deliver',
    'Polybagged, tagged, cartonised and palletised to your spec, with packing lists and export documentation ready for shipment.',
  ],
]

export default function Process() {
  return (
    <section className="cw-section cw-page">
      <h1>Our Manufacturing Process</h1>
      <p className="cw-lead">
        From fabric to shipped carton — six defined stages, visible to you at every step.
      </p>
      <div
        className="cw-grid2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--sp-5)',
        }}
      >
        {PROCESS_STEPS.map(([title, img, desc], i) => (
          <div key={title} className="cw-step-card">
            <span className="cw-step-badge">Step {String(i + 1).padStart(2, '0')}</span>
            <img
              src={imgSrc(img)}
              onError={(e) => {
                if (!e.currentTarget.dataset.fb) {
                  e.currentTarget.dataset.fb = '1'
                  e.currentTarget.src = imgSrc(FALLBACK_STEP)
                }
              }}
              alt={title}
              loading="lazy"
              className="cw-step-img"
            />
            <div className="cw-step-body">
              <h2 className="cw-step-title">{title}</h2>
              <p className="cw-step-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 'var(--sp-6)',
          display: 'flex',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Link className="btn btn-gold" to={quoteHref()}>
          Start a programme
        </Link>
        <Link className="btn" to="/services">
          See all services
        </Link>
      </div>
    </section>
  )
}
