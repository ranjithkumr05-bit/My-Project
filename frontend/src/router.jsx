// router.jsx — BrowserRouter with clean URLs + legacy hash/slug redirects.
import {useEffect, useState} from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import PageShell from './components/PageShell.jsx'
import Icon from './components/Icon.jsx'
import {Auth, getToken, setToken} from './api.js'
import {Loading} from './ui.jsx'
import {Login} from './pages/Login.jsx'
import {AdminApp} from './pages/Admin.jsx'
import {resolveCanonicalSlug} from './data/services.js'
import About from './pages/About.jsx'
import Blog, {BlogPost} from './pages/Blog.jsx'
import Contact from './pages/Contact.jsx'
import Home from './pages/Home.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Process from './pages/Process.jsx'
import Register from './pages/Register.jsx'
import Track from './pages/Track.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import Services from './pages/Services.jsx'

function ScrollToTop() {
  const {pathname} = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ServiceAlias() {
  const {slug} = useParams()
  const canonical = resolveCanonicalSlug(slug)
  if (canonical) return <Navigate to={`/services/${canonical}`} replace />
  return <Navigate to="/" replace />
}

// Ponytail: one Auth.me() restore at the shell — the portal guard reads { user,
// booting } from context-free props instead of each page re-fetching session.
// Admin-only now: buyers self-serve through /track and never sign in.
function PortalShell({user, booting, children, onLogout}) {
  if (booting)
    return (
      <div className="shell">
        <Loading label="Restoring session…" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  const nav = [
    ['/admin', 'Dashboard'],
    ['/admin/leads', 'Leads'],
    ['/admin/rfqs', 'RFQs'],
    ['/admin/orders', 'Orders'],
    ['/admin/customers', 'Customers'],
    ['/admin/samples', 'Samples'],
  ]
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <img
            className="brand-logo"
            src="/logo-small.png"
            alt="Customwear logo"
            width="40"
            height="40"
          />
          <span className="brand-text">
            CUSTOM<em>WEAR</em>
          </span>
        </Link>
        <nav className="nav" aria-label="portal">
          {nav.map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="row">
          <Link className="cw-backlink" to="/">
            <Icon name="back" size={18} /> Site
          </Link>
          <span className="muted">
            {user.email} · {user.role}
          </span>
          <button className="btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}

function LoginRoute({user, booting, onLoggedIn}) {
  if (booting)
    return (
      <div className="shell">
        <Loading label="Restoring session…" />
      </div>
    )
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  return (
    <div className="shell">
      <Login onLoggedIn={onLoggedIn} />
    </div>
  )
}

export default function Router() {
  // Session restore on first paint (same flow as the legacy hash App).
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(Boolean(getToken()))
  useEffect(() => {
    if (!getToken()) return
    Auth.me()
      .then((res) => setUser(res.user || res))
      .catch(() => setToken(null))
      .finally(() => setBooting(false))
  }, [])
  async function handleLogout() {
    try {
      await Auth.logout()
    } catch {
      /* token may be dead */
    }
    setUser(null)
    window.location.assign('/')
  }
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/login"
          element={<LoginRoute user={user} booting={booting} onLoggedIn={setUser} />}
        />
        <Route
          path="/admin"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp />
            </PortalShell>
          }
        />
        <Route
          path="/admin/leads"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp page="leads" />
            </PortalShell>
          }
        />
        <Route
          path="/admin/rfqs"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp page="rfqs" />
            </PortalShell>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp page="orders" />
            </PortalShell>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp page="customers" />
            </PortalShell>
          }
        />
        <Route
          path="/admin/samples"
          element={
            <PortalShell user={user} booting={booting} onLogout={handleLogout}>
              <AdminApp page="samples" />
            </PortalShell>
          }
        />
        <Route
          path="/*"
          element={
            <PageShell user={user}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/services/:slug/*" element={<ServiceAlias />} />
                <Route path="/process" element={<Process />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/register" element={<Register />} />
                <Route path="/track" element={<Track />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </PageShell>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
