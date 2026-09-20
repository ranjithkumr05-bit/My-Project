import { useEffect, useState } from 'react'
import { Auth, getToken, setToken } from './api.js'
import { useHashRoute, navigate, Loading, ErrorBox } from './ui.jsx'
import { Login } from './pages/Login.jsx'
import { CustomerApp } from './pages/Customer.jsx'
import { AdminApp } from './pages/Admin.jsx'
import { SiteApp } from './pages/site.jsx'

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

  // Public marketing site is the default for every route that isn't
  // the login page or an authenticated dashboard area.
  const area = parts[0] || ''
  const isPortalArea = area === 'app' || area === 'admin' || area === 'login'

  async function handleLogout() {
    await Auth.logout()
    setUser(null)
    navigate('')
  }

  // ---- authenticated portal (customer + admin dashboards) ----
  if (isPortalArea && user) {
    const isAdmin = user.role === 'admin'
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
            <a href="#/" className="cw-backlink">← Site</a>
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

  // ---- login page (explicit route only) ----
  if (area === 'login') {
    return (
      <div className="shell">
        <header className="topbar">
          <a className="brand" href="#/">Custom<em>wear</em></a>
          <div className="row"><a href="#/" className="cw-backlink">← Back to site</a></div>
        </header>
        <Login onLoggedIn={setUser} next={parts.slice(1).join('/')} />
      </div>
    )
  }

  // Deep links into the portal while logged out: show login, keep destination.
  if (isPortalArea) {
    return (
      <div className="shell">
        <header className="topbar">
          <a className="brand" href="#/">Custom<em>wear</em></a>
          <div className="row"><a href="#/" className="cw-backlink">← Back to site</a></div>
        </header>
        <Login onLoggedIn={setUser} next={parts.join('/')} />
      </div>
    )
  }

  // ---- public site (default) ----
  return <SiteApp parts={parts} />
}
