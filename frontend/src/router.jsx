// router.jsx — BrowserRouter with clean URLs + legacy hash/slug redirects.
import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import PageShell from './components/PageShell.jsx'
import { Auth, getToken, setToken } from './api.js'
import { Loading } from './ui.jsx'
import { Login } from './pages/Login.jsx'
import { CustomerApp } from './pages/Customer.jsx'
import { AdminApp } from './pages/Admin.jsx'
import { resolveCanonicalSlug } from './data/services.js'
import About from './pages/About.jsx'
import Blog, { BlogPost } from './pages/Blog.jsx'
import Contact from './pages/Contact.jsx'
import Home from './pages/Home.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Process from './pages/Process.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import Services from './pages/Services.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ServiceAlias() {
  const { slug } = useParams()
  const canonical = resolveCanonicalSlug(slug)
  if (canonical) return <Navigate to={`/services/${canonical}`} replace />
  return <Navigate to="/" replace />
}

// Ponytail: one Auth.me() restore at the shell — portal guards read { user,
// booting } from context-free props instead of each page re-fetching session.
function PortalShell({ user, booting, allow, children, onLogout }) {
  const { pathname } = useLocation()
  if (booting) return <div className="shell"><Loading label="Restoring session…" /></div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname.replace(/^\//, ''))}`} replace />
  if (allow === 'admin' && user.role !== 'admin') return <Navigate to="/app" replace />
  if (allow === 'customer' && user.role === 'admin') return <Navigate to="/admin" replace />
  const nav = user.role === 'admin'
    ? [['/admin', 'Dashboard'], ['/admin/leads', 'Leads'], ['/admin/rfqs', 'RFQs'], ['/admin/orders', 'Orders'], ['/admin/samples', 'Samples']]
    : [['/app', 'Dashboard'], ['/app/catalogue', 'Catalogue'], ['/app/rfq-new', 'New RFQ'], ['/app/rfqs', 'My RFQs'], ['/app/orders', 'Orders'], ['/app/samples', 'Samples']]
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">Custom<em>wear</em></Link>
        <nav className="nav" aria-label="portal">
          {nav.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>
        <div className="row">
          <Link className="cw-backlink" to="/">← Site</Link>
          <span className="muted">{user.email} · {user.role}</span>
          <button className="btn" onClick={onLogout}>Log out</button>
        </div>
      </header>
      {children}
    </div>
  )
}

function LoginRoute({ user, booting, onLoggedIn }) {
  const { search } = useLocation()
  const next = new URLSearchParams(search).get('next') || ''
  if (booting) return <div className="shell"><Loading label="Restoring session…" /></div>
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : `/${next || 'app'}`} replace />
  return <div className="shell"><Login onLoggedIn={onLoggedIn} next={next} /></div>
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
    try { await Auth.logout() } catch { /* token may be dead */ }
    setUser(null)
    window.location.assign('/')
  }
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginRoute user={user} booting={booting} onLoggedIn={setUser} />} />
        <Route path="/app" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp user={user} /></PortalShell>} />
        <Route path="/app/catalogue" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp page="catalogue" user={user} /></PortalShell>} />
        <Route path="/app/rfq-new" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp page="rfq-new" user={user} /></PortalShell>} />
        <Route path="/app/rfqs" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp page="rfqs" user={user} /></PortalShell>} />
        <Route path="/app/orders" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp page="orders" user={user} /></PortalShell>} />
        <Route path="/app/samples" element={<PortalShell user={user} booting={booting} allow="customer" onLogout={handleLogout}><CustomerApp page="samples" user={user} /></PortalShell>} />
        <Route path="/admin" element={<PortalShell user={user} booting={booting} allow="admin" onLogout={handleLogout}><AdminApp /></PortalShell>} />
        <Route path="/admin/leads" element={<PortalShell user={user} booting={booting} allow="admin" onLogout={handleLogout}><AdminApp page="leads" /></PortalShell>} />
        <Route path="/admin/rfqs" element={<PortalShell user={user} booting={booting} allow="admin" onLogout={handleLogout}><AdminApp page="rfqs" /></PortalShell>} />
        <Route path="/admin/orders" element={<PortalShell user={user} booting={booting} allow="admin" onLogout={handleLogout}><AdminApp page="orders" /></PortalShell>} />
        <Route path="/admin/samples" element={<PortalShell user={user} booting={booting} allow="admin" onLogout={handleLogout}><AdminApp page="samples" /></PortalShell>} />
        <Route path="/*" element={(
          <PageShell>
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
              <Route path="*" element={<Home />} />
            </Routes>
          </PageShell>
        )} />
      </Routes>
    </BrowserRouter>
  )
}
