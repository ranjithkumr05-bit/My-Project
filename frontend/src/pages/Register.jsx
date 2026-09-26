// pages/Register.jsx — public self-registration.
//
// Deliberately creates a LEAD, never a customer record. Most registrants never
// order, and the customer collection is the trust anchor for order tracking —
// whoever owns that phone/email can open the order. So a registration stays a
// lead until a human promotes it, and the copy promises no Order ID.
import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import Icon from '../components/Icon.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Long enough to read the confirmation, short enough not to feel stuck.
const RETURN_AFTER_MS = 5000

export default function Register() {
  const [state, setState] = useState({done: false, busy: false, error: null})
  const [form, setForm] = useState({name: '', company: '', email: '', phone: ''})
  const navigate = useNavigate()
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}))

  // On success, show the confirmation, then take them back to the home page.
  useEffect(() => {
    if (!state.done) return undefined
    const t = setTimeout(() => navigate('/'), RETURN_AFTER_MS)
    return () => clearTimeout(t)
  }, [state.done, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    if (!name)
      return setState({done: false, busy: false, error: new Error('Please enter your name.')})
    // Same rule as the Contact form: one usable contact is the minimum.
    if (!email && !phone) {
      return setState({
        done: false,
        busy: false,
        error: new Error('Add an email or a phone / WhatsApp number so we can reach you.'),
      })
    }
    if (email && !EMAIL_RE.test(email)) {
      return setState({
        done: false,
        busy: false,
        error: new Error('That email address does not look right.'),
      })
    }
    setState({done: true, busy: true, error: null})
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          company: form.company.trim() || null,
          email: email || null,
          phone: phone || null,
          message: 'Registered from the website.',
          source: 'registration',
        }),
      })
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error || `Request failed (${res.status})`,
        )
      setForm({name: '', company: '', email: '', phone: ''})
      setState({done: true, busy: false, error: null})
    } catch (err) {
      setState({done: false, busy: false, error: err})
    }
  }

  return (
    <section className="cw-section cw-page">
      <p className="cw-kicker">Registration</p>
      <h1>Register with Customwear</h1>
      <p className="cw-lead">
        Tell us who you are and we will get back to you about your apparel requirements.
      </p>

      <div className="cw-grid2">
        {state.done ? (
          <div className="cw-card cw-thanks">
            <h2>
              Thank you — we'll be in touch shortly. <Icon name="check" />
            </h2>
            <p>
              If we confirm your order, we'll share an Order ID so you can check on production any
              time.
            </p>
            <Link className="btn" to="/">
              Back to home
            </Link>
            <p className="muted" style={{marginTop: 16}}>
              Taking you back to the home page…
            </p>
          </div>
        ) : (
          <form className="cw-form" onSubmit={onSubmit}>
            <label>
              Your name
              <input
                name="name"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
              />
            </label>
            <label>
              Company
              <input
                name="company"
                value={form.company}
                onChange={set('company')}
                autoComplete="organization"
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </label>
            <label>
              Phone / WhatsApp
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
              />
            </label>
            <p className="cw-hint">We only use these to respond to your enquiry.</p>
            {state.error && (
              <p className="cw-formerr" role="alert">
                {state.error.message}
              </p>
            )}
            <button className="btn btn-gold" disabled={state.busy}>
              {state.busy ? 'Sending…' : 'Register'}
            </button>
          </form>
        )}
        <aside>
          <h2>Already placed an order?</h2>
          <p>
            You do not need an account. <Link to="/track">Track your order</Link> with your Order ID
            and the email or phone number you gave us.
          </p>
          <h2>What happens next</h2>
          <p className="muted">
            We review your requirement, confirm fabric, sizes and branding, and come back to you
            with a quotation.
          </p>
        </aside>
      </div>
    </section>
  )
}
