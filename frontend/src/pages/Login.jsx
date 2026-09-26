import {useState} from 'react'
import {Link} from 'react-router-dom'
import {Auth} from '../api.js'
import {navigate} from '../ui.jsx'

export function Login({onLoggedIn}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await Auth.login(email.trim(), password)
      onLoggedIn(user)
      // Ponytail: clean paths — ui.navigate() strips any legacy '#/' prefix,
      // so both styles land on the same BrowserRouter route. Only admins have a
      // portal now; a buyer who signs in simply returns to the public site.
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="card">
        <h1 style={{marginBottom: 2}}>
          Custom<em style={{color: 'var(--gold-500)', fontStyle: 'normal'}}>wear</em>
        </h1>
        <p className="muted" style={{marginTop: 0}}>
          B2B apparel manufacturing platform
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" style={{width: '100%'}} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {/* /login renders outside PageShell, so it has no header, footer or nav —
            without these two links it is a dead end that only an admin can use.
            Register is public self-registration (it files a lead and returns the
            visitor home); "Back to site" is the only way out for anyone else. */}
        <p style={{marginTop: 16}}>
          New customer? <Link to="/register">Register</Link> and we will send you a quote — no
          portal login needed.
        </p>
        <p className="muted" style={{marginTop: 8}}>
          <Link to="/">Back to site</Link>
        </p>
      </div>
    </div>
  )
}
