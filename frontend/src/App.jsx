import Router from './router.jsx'
import {useEffect} from 'react'

// The public marketing site is the whole app.
// The customer/admin portal (login, dashboards, RFQ builder) stays disabled:
// portal pages in ./pages (Login, Customer, Admin, Catalogue, NewRfq,
// lists, tables, admin-*), every API client call in ./api.js and all backend
// routes in ../../src/routes.mjs are untouched and still work.
export default function App() {
  // One-time: legacy '#/…' URL → clean URL before first paint of Routes.
  useEffect(() => {
    if (window.location.hash && window.location.hash.length > 1) {
      const raw = window.location.hash.replace(/^#\/?/, '')
      window.history.replaceState(null, '', `/${raw}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [])
  return <Router />
}
