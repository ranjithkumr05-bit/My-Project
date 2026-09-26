import {Dashboard} from '../api.js'
import {useAsync, Loading, ErrorBox} from '../ui.jsx'
import {AdminRfqs} from './AdminRfqs.jsx'
import {AdminOrders} from './AdminOrders.jsx'
import {AdminSamples} from './AdminSamples.jsx'
import {AdminCustomers} from './AdminCustomers.jsx'
import {LeadsPage} from './LeadsPage.jsx'

export {LeadsPage, AdminRfqs, AdminOrders, AdminSamples, AdminCustomers}

// Ponytail: path-segment routing instead of hash parts — BrowserRouter gives
// AdminApp the sub-page directly (no parts parsing, no hash listener).
export function AdminApp({page = 'dashboard'}) {
  if (page === 'leads') return <LeadsPage />
  if (page === 'rfqs') return <AdminRfqs />
  if (page === 'orders') return <AdminOrders />
  if (page === 'samples') return <AdminSamples />
  if (page === 'customers') return <AdminCustomers />
  return <AdminHome />
}

function AdminHome() {
  const dash = useAsync(() => Dashboard.admin(), [])
  if (dash.loading) return <Loading />
  if (dash.error) return <ErrorBox error={dash.error} onRetry={dash.retry} />
  const kpis = dash.data?.kpis || dash.data || {}
  return (
    <>
      <h1>Admin dashboard</h1>
      <p className="muted">Sample data only — no production database connected.</p>
      <div className="grid grid-4">
        {Object.entries(kpis)
          .filter(([, v]) => typeof v === 'number')
          .map(([k, v]) => (
            <div className="card" key={k}>
              <div className="kpi">{v}</div>
              <div className="muted">{k.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ')}</div>
            </div>
          ))}
      </div>
    </>
  )
}
