// pages/Contact.jsx — enquiry intake (quote / sample / general) → POST /api/leads.
// Deep links preselect enquiry state: /contact?type=quote|sample|general&service=<slug>.
import {useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {CONTACT_EMAIL, SERVICES, WA_DEFAULT_MSG, serviceBySlug, waLink} from '../data/services.js'
import Icon from '../components/Icon.jsx'

const TYPES = [
  ['quote', 'Get a Quote'],
  ['sample', 'Request a Sample'],
  ['general', 'General Enquiry'],
]

const validType = (t) => (TYPES.some(([v]) => v === t) ? t : 'general')

export default function Contact() {
  const [params] = useSearchParams()
  const initialType = validType(params.get('type'))
  const initialSvc = serviceBySlug(params.get('service'))
  // Prefill from calculator deep link: /contact?type=quote&service=&qty=&fabric=&branding=
  const prefill = [
    params.get('qty') ? `${params.get('qty')} pcs` : null,
    params.get('fabric'),
    params.get('branding'),
  ]
    .filter(Boolean)
    .join(' | ')
  const [state, setState] = useState({done: false, busy: false, error: null})
  const [kind, setKind] = useState(initialType)
  const [service, setService] = useState(initialSvc ? initialSvc.slug : '')
  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') || '').trim()
    const phone = String(fd.get('phone') || '').trim()
    if (!email && !phone) {
      setState({
        done: false,
        busy: false,
        error: new Error(
          'Add an email or a phone / WhatsApp number so we can send your quotation.',
        ),
      })
      return
    }
    setState({done: false, busy: true, error: null})
    try {
      const svc = serviceBySlug(service)
      const label = TYPES.find(([v]) => v === kind)?.[1] || 'General Enquiry'
      const detail = String(fd.get('message') || '').trim()
      const message = `[${label}${svc ? ` — ${svc.name}` : ''}]${detail ? `\n${detail}` : ''}`
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: fd.get('name'),
          company: fd.get('company'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          message,
          source: 'website_form',
        }),
      })
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error || `Request failed (${res.status})`,
        )
      setState({done: true, busy: false, error: null})
    } catch (err) {
      setState({done: false, busy: false, error: err})
    }
  }
  return (
    <section className="cw-section cw-page">
      <h1>
        {kind === 'sample' ? 'Request a Sample' : kind === 'quote' ? 'Get a Quote' : 'Contact'}
      </h1>
      <p className="cw-lead">
        Tell us what you need made. We reply with questions, a quotation, then a sample.
      </p>
      <div className="cw-grid2">
        {state.done ? (
          <div className="cw-card cw-thanks">
            <h2>
              Enquiry received <Icon name="check" />
            </h2>
            <p>Our team will reach out. Reference your name in any follow-up.</p>
            <Link className="btn" to="/portfolio">
              Browse the portfolio meanwhile
            </Link>
          </div>
        ) : (
          <form className="cw-form" onSubmit={onSubmit}>
            <div className="cw-kind" role="radiogroup" aria-label="Enquiry type">
              {TYPES.map(([v, label]) => (
                <label key={v} className={kind === v ? 'on' : ''}>
                  <input
                    type="radio"
                    name="kind"
                    value={v}
                    checked={kind === v}
                    onChange={() => setKind(v)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <label>
              Your name
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              Company
              <input name="company" autoComplete="organization" />
            </label>
            <label>
              Apparel category
              <select name="service" value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">Not sure yet</option>
                {SERVICES.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label>
              Phone / WhatsApp
              <input name="phone" type="tel" autoComplete="tel" />
            </label>
            <label>
              What do you need made?
              <textarea
                name="message"
                rows="4"
                placeholder="Product, quantity, target date, branding…"
                defaultValue={prefill ? `Estimate: ${prefill}` : undefined}
              />
            </label>
            <p className="cw-hint">
              Add an email or a phone / WhatsApp number — we need at least one to send your
              quotation.
            </p>
            {state.error && (
              <p className="cw-formerr" role="alert">
                {state.error.message}
              </p>
            )}
            <button className="btn btn-gold" disabled={state.busy}>
              {state.busy
                ? 'Sending…'
                : kind === 'sample'
                  ? 'Request Sample'
                  : kind === 'quote'
                    ? 'Get a Quote'
                    : 'Send Enquiry'}
            </button>
          </form>
        )}
        <aside>
          <h2>Prefer WhatsApp?</h2>
          <p>
            <a
              className="btn"
              href={waLink(WA_DEFAULT_MSG)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </p>
          <h2>Prefer email?</h2>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <h2>What happens next</h2>
          <p className="muted">
            We confirm fabric, sizes and branding, share a quotation, then cut a sample for approval
            before bulk.
          </p>
        </aside>
      </div>
    </section>
  )
}
