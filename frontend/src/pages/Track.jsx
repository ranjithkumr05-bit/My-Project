// pages/Track.jsx — public B2B order tracking (no portal auth).
// Lookup is Order ID + registered email/phone → POST /api/track.
// Response is sanitized via toPublicTrackingResponse; hidden sections stay hidden.
import {useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {Tracking} from '../api.js'
import {Badge} from '../ui.jsx'
import {waLink, quoteHref} from '../data/services.js'
import Icon from '../components/Icon.jsx'

const fmtDate = (iso) => {
  if (!iso) return null
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})
}

const fmtAt = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Track() {
  const [params] = useSearchParams()
  const [orderId, setOrderId] = useState(params.get('orderId') || '')
  const [contact, setContact] = useState(params.get('contact') || '')
  const [state, setState] = useState({busy: false, error: null, tracking: null})

  async function onSubmit(e) {
    e.preventDefault()
    const id = orderId.trim()
    const c = contact.trim()
    if (!id)
      return setState({
        busy: false,
        error: new Error('Enter your Order ID (e.g. ORD-3001).'),
        tracking: null,
      })
    if (!c)
      return setState({
        busy: false,
        error: new Error('Enter the email or phone number used on the order.'),
        tracking: null,
      })
    setState({busy: true, error: null, tracking: null})
    try {
      const res = await Tracking.lookup(id, c)
      setState({busy: false, error: null, tracking: res.tracking})
    } catch (err) {
      setState({busy: false, error: err, tracking: null})
    }
  }

  const t = state.tracking
  const wa = t ? waLink(`Hello Customwear — I would like an update on order ${t.orderId}.`) : null

  return (
    <section className="cw-section cw-page cw-track">
      <title>Track Your Order | Customwear — Tiruppur B2B Apparel</title>
      <meta
        name="description"
        content="Check your Customwear apparel order status by Order ID and registered email or phone."
      />
      <p className="cw-kicker">Order status</p>
      <h1>Track Your Order</h1>
      <p className="cw-lead">Follow your apparel order through our production process.</p>

      <div className="cw-track-layout">
        <form className="cw-form cw-track-form" onSubmit={onSubmit}>
          <label>
            Order ID
            <input
              name="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-3001"
              autoComplete="off"
              inputMode="text"
            />
          </label>
          <label>
            Registered email or phone
            <input
              name="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone used on the order"
              autoComplete="email"
            />
          </label>
          <button className="cw-gold-btn" disabled={state.busy} type="submit">
            {state.busy ? 'Checking order status…' : 'Track Order'}
          </button>
          {state.error && (
            <p className="cw-formerr" role="alert">
              {state.error.message}
            </p>
          )}
        </form>
        <aside className="cw-track-guide">
          <h2>How to look up your order</h2>
          <ol className="cw-track-guide__list">
            <li>
              Enter the <strong>Order ID</strong> from your order confirmation, e.g. ORD-3001.
            </li>
            <li>
              Enter the <strong>registered email or phone number</strong> used on the order.
            </li>
          </ol>
          <p>
            Both details must match the order we hold, so a result is only shown for a verified
            order.
          </p>
        </aside>
      </div>

      {t && (
        <div className="cw-track-result">
          <div className="cw-card cw-track-summary">
            <p className="cw-track-order">ORDER: {t.orderId}</p>
            {t.productSummary && <h2>{t.productSummary}</h2>}
            <div className="cw-track-meta">
              {t.quantity != null && (
                <span>
                  <strong>{t.quantity}</strong> pieces
                </span>
              )}
              {t.expectedDelivery && (
                <span>
                  Expected delivery: <strong>{fmtDate(t.expectedDelivery)}</strong>
                </span>
              )}
              {t.createdAt && <span>Order placed: {fmtDate(t.createdAt)}</span>}
              <Badge value={t.status} />
            </div>
            <div
              className="cw-track-progress"
              role="progressbar"
              aria-valuenow={t.progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Production progress ${t.progressPercent}%`}
            >
              <div className="cw-track-bar">
                <span style={{width: `${t.progressPercent}%`}} />
              </div>
              <p>
                Current stage: <strong>{t.stageLabel}</strong> · {t.progressPercent}%
              </p>
            </div>
          </div>

          <h2>Production journey</h2>
          <ol className="cw-track-steps">
            {t.timeline.map((s) => (
              <li key={s.id} className={`cw-track-step ${s.state}`}>
                <span className="cw-track-dot" aria-hidden="true">
                  {s.state === 'completed' ? '✓' : s.state === 'in_progress' ? '●' : '○'}
                </span>
                <div>
                  <strong>{s.label}</strong>
                  <span className="cw-track-state">
                    {s.state === 'completed'
                      ? 'Completed'
                      : s.state === 'in_progress'
                        ? 'In progress'
                        : 'Upcoming'}
                  </span>
                  {s.at && <span className="cw-track-at">Updated: {fmtAt(s.at)}</span>}
                </div>
              </li>
            ))}
          </ol>

          {t.dispatch && (
            <div className="cw-card cw-track-dispatch">
              <h2>Dispatch information</h2>
              {t.dispatch.courier && (
                <p>
                  Courier: <strong>{t.dispatch.courier}</strong>
                </p>
              )}
              {t.dispatch.trackingNumber && (
                <p>
                  Tracking / waybill: <strong>{t.dispatch.trackingNumber}</strong>
                </p>
              )}
            </div>
          )}

          <div className="cw-track-help">
            <h2>Need help with this order?</h2>
            <div className="cw-cta-row">
              <a className="cw-gold-btn" href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp Production Team <Icon name="arrow" />
              </a>
              <Link className="btn" to={quoteHref()}>
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
