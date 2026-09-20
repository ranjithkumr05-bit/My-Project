import { useState } from 'react'
import { Auth } from '../api.js'
import { navigate } from '../ui.jsx'

export function Login({ onLoggedIn, next }) {
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
      navigate(next ? `#/${next}` : user.role === 'admin' ? '#/admin' : '#/app')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="card">
        <h1 style={{ marginBottom: 2 }}>Custom<em style={{ color: 'var(--gold-500)', fontStyle: 'normal' }}>wear</em></h1>
        <p className="muted" style={{ marginTop: 0 }}>B2B apparel manufacturing platform</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" required autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Sample accounts — admin: <code>admin@customwear.sample / admin123</code><br />
          buyer: <code>buyer@greenfield.sample / buyer123</code>
        </p>
      </div>
    </div>
  )
}
