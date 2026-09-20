import { useEffect, useState } from 'react'
import { Auth, getToken, setToken } from './api.js'
import { useHashRoute, navigate, Loading, ErrorBox } from './ui.jsx'
import { Login } from './pages/Login.jsx'
import { CustomerApp } from './pages/Customer.jsx'
import { AdminApp } from './pages/Admin.jsx'

export default function App() {
  const { parts } = useHashRoute()
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(Boolean(getToken()))

  // Restore session from a persisted token on first paint.
  useEffect(() => {
    if (!getToken()) return
    Auth.me()
      .then((res) => setUser(res.user || res))
      .catch(() => setToken(null))
      .finally(() => setBooting(false))
  }, [])

  if (booting) return <div className="shell"><Loading label="Restoring session…" /></div>

  if (!user) {
    return <Login onLoggedIn={setUser} next={parts.join('/')} />
  }

  const isAdmin = user.role === 'admin'
  const area = parts[0] || (isAdmin ? 'admin' : 'app')

  async function handleLogout() {
    await Auth.logout()
    setUser(null)
    navigate('')
  }

  const nav = isAdmin
    ? [['admin', 'Dashboard'], ['admin/leads', 'Leads'], ['admin/rfqs', 'RFQs'], ['admin/orders', 'Orders'], ['admin/samples', 'Samples']]
    : [['app', 'Dashboard'], ['app/catalogue', 'Catalogue'], ['app/rfq-new', 'New RFQ'], ['app/rfqs', 'My RFQs'], ['app/orders', 'Orders'], ['app/samples', 'Samples']]

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/">Custom<em>wear</em></a>
        <nav className="nav" aria-label="primary">
          {nav.map(([to, label]) => (
            <a key={to} href={`#/${to}`} className={area === to || (to !== 'admin' && to !== 'app' && parts.join('/') === to) ? 'active' : ''}>
              {label}
            </a>
          ))}
        </nav>
        <div className="row">
          <span className="muted">{user.email} · {user.role}</span>
          <button className="btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {isAdmin ? <AdminApp parts={parts.slice(1)} user={user} /> : <CustomerApp parts={parts.slice(1)} user={user} />}

      {!isAdmin && area.startsWith('admin') && (
        <ErrorBox error={{ message: 'Admin area requires an admin account.' }} />
      )}
    </div>
  )
}
