import { Dashboard, WhatsApp } from '../api.js'
import { useAsync, Loading, ErrorBox } from '../ui.jsx'
import { CataloguePage } from './Catalogue.jsx'
import { RfqList, OrderList, SampleList } from './lists.jsx'
import { NewRfq } from './NewRfq.jsx'
import { RfqTable, OrderTable } from './tables.jsx'

export function CustomerApp({ parts, user }) {
  const page = parts[0] || 'dashboard'
  if (page === 'catalogue') return <CataloguePage />
  if (page === 'rfq-new') return <NewRfq />
  if (page === 'rfqs') return <RfqList />
  if (page === 'orders') return <OrderList />
  if (page === 'samples') return <SampleList />
  return <CustomerHome user={user} />
}

function CustomerHome({ user }) {
  const dash = useAsync(() => Dashboard.customer(), [])
  const wa = useAsync(() => WhatsApp.cta(), [])
  if (dash.loading) return <Loading />
  if (dash.error) return <ErrorBox error={dash.error} onRetry={dash.retry} />
  const { dashboard, company } = dash.data
  const kpis = dashboard?.kpis || {}
  return (
    <>
      <h1>{company?.name || user.customerId}</h1>
      <p className="muted">Customer dashboard — sample data, no production database.</p>
      <div className="grid grid-4">
        {Object.entries(kpis).map(([k, v]) => (
          <div className="card" key={k}>
            <div className="kpi">{v}</div>
            <div className="muted">{k.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ')}</div>
          </div>
        ))}
      </div>
      <h2>Recent RFQs</h2>
      <RfqTable rows={dashboard?.rfqs || []} />
      <h2>Active orders</h2>
      <OrderTable rows={dashboard?.orders || []} />
      {wa.data && !wa.data.configured && (
        <p className="notice" style={{ marginTop: 20 }}>
          WhatsApp enquiries are not configured yet — set WHATSAPP_NUMBER on the server to enable the live CTA.
        </p>
      )}
      {wa.data?.configured && (
        <p style={{ marginTop: 20 }}>
          <a className="btn btn-primary" href={wa.data.url} target="_blank" rel="noreferrer">Enquire on WhatsApp</a>
        </p>
      )}
    </>
  )
}
