// components/CostCalculator.jsx — frontend-only indicative estimate.
// DATA RULE: every number shown comes from data/catalogue.json values
// (indicativePrice, moq, leadTimeDays, fabric gsm, branding minQty).
// The catalogue header states prices are illustrative placeholders, so the UI
// labels them DEMO and never presents them as a formal quotation.
// No volume-discount tiers or branding surcharges exist in the catalogue, so
// none are applied — lot total is qty × catalogue baseline only.
import {useMemo, useState} from 'react'
import {Link} from 'react-router-dom'
import {REQUIRED_SLUGS, serviceBySlug} from '../data/services.js'

// Central demo grouping: marketing slug → catalogue product ids.
// DEMO DATA mapping (presentation only): backend groups by garment type,
// not by the 8 marketing slugs. Replace with real business mapping later.
const SERVICE_PRODUCTS = {
  'corporate-office-apparel': ['p-polo-001', 'p-polo-002', 'p-tshirt-001', 'p-tshirt-002'],
  'sportswear-team-jerseys': ['p-jersey-001', 'p-jersey-002'],
  'school-college-tshirts': ['p-tshirt-001', 'p-tshirt-002', 'p-staff-001'],
  'workwear-staff-apparel': ['p-staff-002', 'p-hoodie-002'],
  'retail-store-apparel': ['p-tshirt-001', 'p-staff-001', 'p-staff-002'],
  'hoodies-sweatshirts': ['p-hoodie-001', 'p-hoodie-002'],
  'group-event-tshirts': ['p-tshirt-001', 'p-tshirt-002'],
  'private-label': ['p-pl-001', 'p-pl-002'],
}

const CATALOGUE = {
  meta: {currency: 'INR'},
  brandingOptions: [
    {
      id: 'screen-print',
      label: 'Screen print',
      minQty: 50,
      note: 'Best value for 1-3 spot colours',
    },
    {id: 'embroidery', label: 'Embroidery', minQty: 50, note: 'Chest, sleeve and back placement'},
    {id: 'dtf', label: 'DTF transfer', minQty: 24, note: 'Full-colour artwork, no plate cost'},
    {
      id: 'sublimation',
      label: 'Sublimation',
      minQty: 50,
      note: 'All-over print, polyester substrates only',
    },
    {
      id: 'woven-label',
      label: 'Woven label + care tag',
      minQty: 300,
      note: 'Private-label neck label and size tag',
    },
    {id: 'hangtag', label: 'Custom hangtag', minQty: 300, note: 'Printed card, string or pin'},
  ],
  fabricOptions: [
    {id: 'cotton-pique', label: 'Cotton piqué', gsmRange: [200, 240]},
    {id: 'micro-mesh', label: 'Polyester micro-mesh', gsmRange: [140, 180]},
    {id: 'cotton-single', label: 'Single jersey cotton', gsmRange: [160, 220]},
    {id: 'fleece-brushed', label: 'Brushed fleece', gsmRange: [300, 360]},
    {id: 'interlock', label: 'Poly interlock', gsmRange: [180, 220]},
    {id: 'canvas-twill', label: 'Canvas twill', gsmRange: [240, 280]},
  ],
  products: [
    {
      id: 'p-polo-001',
      name: 'Corporate Piqué Polo',
      fabric: 'cotton-pique',
      gsm: 220,
      moq: 100,
      leadTimeDays: 21,
      branding: ['embroidery', 'screen-print', 'woven-label'],
      indicativePrice: 285,
    },
    {
      id: 'p-polo-002',
      name: 'Performance Dry-Fit Polo',
      fabric: 'micro-mesh',
      gsm: 160,
      moq: 100,
      leadTimeDays: 18,
      branding: ['sublimation', 'embroidery', 'screen-print'],
      indicativePrice: 310,
    },
    {
      id: 'p-tshirt-001',
      name: 'Heavyweight Crew Tee',
      fabric: 'cotton-single',
      gsm: 180,
      moq: 100,
      leadTimeDays: 14,
      branding: ['screen-print', 'dtf', 'woven-label'],
      indicativePrice: 195,
    },
    {
      id: 'p-tshirt-002',
      name: 'Drop-Shoulder Street Tee',
      fabric: 'cotton-single',
      gsm: 240,
      moq: 100,
      leadTimeDays: 16,
      branding: ['dtf', 'screen-print'],
      indicativePrice: 240,
    },
    {
      id: 'p-jersey-001',
      name: 'Sublimated Team Jersey',
      fabric: 'interlock',
      gsm: 180,
      moq: 50,
      leadTimeDays: 20,
      branding: ['sublimation'],
      indicativePrice: 365,
    },
    {
      id: 'p-jersey-002',
      name: 'Cricket Match Jersey',
      fabric: 'micro-mesh',
      gsm: 170,
      moq: 50,
      leadTimeDays: 22,
      branding: ['sublimation'],
      indicativePrice: 395,
    },
    {
      id: 'p-hoodie-001',
      name: 'Fleece Pullover Hoodie',
      fabric: 'fleece-brushed',
      gsm: 320,
      moq: 50,
      leadTimeDays: 24,
      branding: ['screen-print', 'embroidery', 'woven-label'],
      indicativePrice: 720,
    },
    {
      id: 'p-hoodie-002',
      name: 'Zip-Through Work Hoodie',
      fabric: 'fleece-brushed',
      gsm: 340,
      moq: 50,
      leadTimeDays: 26,
      branding: ['screen-print', 'embroidery', 'hangtag'],
      indicativePrice: 845,
    },
    {
      id: 'p-staff-001',
      name: 'School Campus Tee Set',
      fabric: 'canvas-twill',
      gsm: 240,
      moq: 100,
      leadTimeDays: 28,
      branding: ['embroidery', 'woven-label'],
      indicativePrice: 335,
    },
    {
      id: 'p-staff-002',
      name: 'Workshop Staff Tee Set',
      fabric: 'canvas-twill',
      gsm: 280,
      moq: 100,
      leadTimeDays: 30,
      branding: ['embroidery', 'screen-print', 'hangtag'],
      indicativePrice: 690,
    },
    {
      id: 'p-pl-001',
      name: 'Private Label Programme (full package)',
      fabric: 'cotton-single',
      gsm: 180,
      moq: 300,
      leadTimeDays: 35,
      branding: ['woven-label', 'hangtag', 'dtf'],
      indicativePrice: 265,
    },
    {
      id: 'p-pl-002',
      name: 'Retail-Ready Fleece Programme',
      fabric: 'fleece-brushed',
      gsm: 320,
      moq: 300,
      leadTimeDays: 38,
      branding: ['woven-label', 'hangtag', 'embroidery'],
      indicativePrice: 780,
    },
  ],
}

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

function calculateEstimate({slug, qty, fabricId}) {
  const ids = SERVICE_PRODUCTS[slug]
  if (!ids || !ids.length) return {ok: false, reason: 'unavailable'}
  const all = ids.map((id) => CATALOGUE.products.find((p) => p.id === id)).filter(Boolean)
  if (!all.length) return {ok: false, reason: 'unavailable'}
  const pool = fabricId ? all.filter((p) => p.fabric === fabricId) : all
  if (!pool.length) return {ok: false, reason: 'fabric-unavailable'}
  const prices = pool.map((p) => p.indicativePrice).filter((n) => Number.isFinite(n))
  if (!prices.length) return {ok: false, reason: 'unavailable'}
  const moq = Math.min(...pool.map((p) => p.moq))
  const leads = pool.map((p) => p.leadTimeDays).filter((n) => Number.isFinite(n))
  if (!Number.isFinite(qty) || qty <= 0) return {ok: false, reason: 'qty', moq, pool}
  if (qty < moq) return {ok: false, reason: 'moq', moq, pool}
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return {
    ok: true,
    lo,
    hi,
    lotLo: lo * qty,
    lotHi: hi * qty,
    moq,
    pool,
    leadLo: Math.min(...leads),
    leadHi: Math.max(...leads),
  }
}

// One calculator, mounted on /services. It opens on the first category; the
// service picker below is how a buyer reaches any of the other seven.
export default function CostCalculator() {
  const [slug, setSlug] = useState(REQUIRED_SLUGS[0])
  const [qtyRaw, setQtyRaw] = useState('')
  const [fabricId, setFabricId] = useState('')
  const [brandingId, setBrandingId] = useState('')
  const groupProducts = useMemo(() => {
    const ids = SERVICE_PRODUCTS[slug] || []
    return ids.map((id) => CATALOGUE.products.find((p) => p.id === id)).filter(Boolean)
  }, [slug])
  const fabrics = useMemo(() => {
    const ids = [...new Set(groupProducts.map((p) => p.fabric))]
    return ids.map((id) => CATALOGUE.fabricOptions.find((f) => f.id === id)).filter(Boolean)
  }, [groupProducts])
  const brandings = useMemo(() => {
    const ids = [...new Set(groupProducts.flatMap((p) => p.branding))]
    return ids.map((id) => CATALOGUE.brandingOptions.find((b) => b.id === id)).filter(Boolean)
  }, [groupProducts])
  const branding = CATALOGUE.brandingOptions.find((b) => b.id === brandingId) || null
  const qty = qtyRaw === '' ? NaN : Number(qtyRaw)
  const result = useMemo(
    () => calculateEstimate({slug, qty, fabricId: fabricId || null}),
    [slug, qty, fabricId],
  )
  const moq =
    result.moq ?? (groupProducts.length ? Math.min(...groupProducts.map((p) => p.moq)) : 0)
  const qtyError =
    qtyRaw !== '' && Number.isFinite(qty) && qty > 0 && qty < moq
      ? `Minimum order quantity for this category is ${moq} pieces.`
      : null
  const brandingWarn =
    branding && Number.isFinite(qty) && qty > 0 && qty < branding.minQty
      ? `${branding.label} needs min ${branding.minQty} pcs.`
      : null
  const fabric = fabricId ? fabrics.find((f) => f.id === fabricId) || null : null
  const fabricLabel = fabric ? fabric.label : null
  const quoteHref =
    `/contact?type=quote&service=${slug}` +
    (Number.isFinite(qty) && qty > 0 ? `&qty=${Math.floor(qty)}` : '') +
    (fabricLabel ? `&fabric=${encodeURIComponent(fabricLabel)}` : '') +
    (branding ? `&branding=${encodeURIComponent(branding.label)}` : '')

  return (
    <div className="cw-cost-calc">
      <div className="cw-cost-calc__grid">
        <div className="cw-cost-calc__fields">
          <label className="cw-cost-calc__field">
            Apparel category
            <select
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setFabricId('')
                setBrandingId('')
              }}
            >
              {REQUIRED_SLUGS.map((s) => {
                const o = serviceBySlug(s)
                return (
                  <option key={s} value={s}>
                    {o ? o.name : s}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="cw-cost-calc__field">
            Quantity (pieces)
            <input
              type="number"
              inputMode="numeric"
              min={moq}
              step="1"
              value={qtyRaw}
              placeholder={`Min ${moq} pcs`}
              onChange={(e) => setQtyRaw(e.target.value)}
              aria-describedby="cw-cost-moq"
            />
          </label>
          <p id="cw-cost-moq" className="cw-cost-calc__moq">
            MOQ: {moq} pieces
          </p>
          <label className="cw-cost-calc__field">
            Fabric
            <select value={fabricId} onChange={(e) => setFabricId(e.target.value)}>
              <option value="">All fabrics in this category</option>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="cw-cost-calc__field">
            Branding
            <select value={brandingId} onChange={(e) => setBrandingId(e.target.value)}>
              <option value="">No branding selected</option>
              {brandings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} · min {b.minQty} pcs
                </option>
              ))}
            </select>
          </label>
          {qtyError && (
            <p className="cw-formerr" role="alert">
              {qtyError}
            </p>
          )}
          {brandingWarn && (
            <p className="cw-cost-calc__warn" role="status">
              {brandingWarn}
            </p>
          )}
        </div>
        <div className="cw-cost-calc__summary" aria-live="polite">
          {result.ok ? (
            <>
              <p className="cw-kicker">Indicative estimate · demo catalogue</p>
              <p className="cw-cost-calc__result">
                {result.lo === result.hi ? inr(result.lo) : `${inr(result.lo)} – ${inr(result.hi)}`}{' '}
                <span>/ pc</span>
              </p>
              <dl className="cw-cost-calc__specs">
                <div>
                  <dt>Est. lot total</dt>
                  <dd>
                    {result.lo === result.hi
                      ? inr(result.lotLo)
                      : `${inr(result.lotLo)} – ${inr(result.lotHi)}`}
                  </dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>{Math.floor(qty)} pcs</dd>
                </div>
                <div>
                  <dt>MOQ</dt>
                  <dd>{moq} pcs</dd>
                </div>
                {fabric && (
                  <div>
                    <dt>Fabric</dt>
                    <dd>
                      {fabric.label} · {fabric.gsmRange[0]}–{fabric.gsmRange[1]} GSM
                    </dd>
                  </div>
                )}
                {branding && (
                  <div>
                    <dt>Branding</dt>
                    <dd>
                      {branding.label} · min {branding.minQty} pcs
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Catalogue basis</dt>
                  <dd>{result.pool.map((p) => p.name).join(' · ')}</dd>
                </div>
              </dl>
              <Link className="cw-gold-btn" to={quoteHref}>
                Get a Formal Quote
              </Link>
            </>
          ) : result.reason === 'fabric-unavailable' ? (
            <>
              <p className="cw-kicker">Indicative pricing unavailable</p>
              <p className="cw-cost-calc__hint">
                That fabric is not in the catalogue for this category. Choose another fabric to see
                an estimate.
              </p>
            </>
          ) : result.reason === 'moq' ? (
            <>
              <p className="cw-kicker">Below MOQ</p>
              <p className="cw-cost-calc__hint">
                Minimum order quantity for this category is {result.moq} pieces. Raise the quantity
                to see an indicative estimate.
              </p>
            </>
          ) : (
            <>
              <p className="cw-kicker">Your estimate</p>
              <p className="cw-cost-calc__result cw-cost-calc__result--empty">
                — <span>/ pc</span>
              </p>
              <dl className="cw-cost-calc__specs">
                <div>
                  <dt>Quantity</dt>
                  <dd>Not set</dd>
                </div>
                <div>
                  <dt>MOQ</dt>
                  <dd>{moq} pcs</dd>
                </div>
              </dl>
              <p className="cw-cost-calc__hint">
                Enter {moq} pieces or more and this panel will show an indicative unit price and lot
                total.
              </p>
            </>
          )}
          <p className="cw-cost-calc__disclaimer">
            Indicative estimate only — demo prices, not a quotation. Final pricing depends on
            fabric, GSM, quantity, branding, artwork, size mix and specifications.
          </p>
        </div>
      </div>
    </div>
  )
}
