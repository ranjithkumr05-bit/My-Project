import { Dashboard } from '../api.js'
import { Loading, ErrorBox } from '../ui.jsx'
import { AdminRfqs } from './admin-rfqs.jsx'
import { AdminOrders } from './admin-orders.jsx'
import { AdminSamples } from './admin-samples.jsx'
import { LeadsPage } from './admin-ops.jsx'

export { LeadsPage, AdminRfqs, AdminOrders, AdminSamples }

const asRows = (d, key) => (Array.isArray(d) ? d : d?.[key] || [])

export function AdminApp({ parts }) {
  const page = parts[0] || 'dashboard'
  if (page === 'leads') return <LeadsPage />
  if (page === 'rfqs') return <AdminRfqs />
  if (page === 'orders') return <AdminOrders />
  if (page === 'samples') return <AdminSamples />
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
        {Object.entries(kpis).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
          <div className="card" key={k}>
            <div className="kpi">{v}</div>
            <div className="muted">{k.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ')}</div>
          </div>
        ))}
      </div>
    </>
  )
}
