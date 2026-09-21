import { useHashRoute } from './ui.jsx'
import { SiteApp } from './pages/site.jsx'

// The public marketing site is the whole app right now.
//
// The customer/admin portal (login, dashboards, RFQ builder) is intentionally
// disabled behind this single entry point: App renders SiteApp for every route,
// so '#/login', '#/app' and '#/admin' simply fall back to the home page.
//
// Nothing was deleted - re-enabling is a one-file revert:
//   git revert <commit>   (or)   git checkout <commit> -- frontend/src/App.jsx
// The portal pages in ./pages (Login, Customer, Admin, Catalogue, NewRfq,
// lists, tables, admin-*), every API client call in ./api.js and all backend
// routes in ../../src/routes.mjs are untouched and still work.
export default function App() {
  const { parts } = useHashRoute()
  return <SiteApp parts={parts} />
}
