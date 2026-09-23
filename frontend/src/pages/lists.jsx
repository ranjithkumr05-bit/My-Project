import { useState } from 'react'
import { Rfqs, Orders, Samples, Catalogue } from '../api.js'
import { useAsync, Loading, ErrorBox, Badge } from '../ui.jsx'
import { RfqTable, OrderTable } from './tables.jsx'

const asRows = (d, key) => (Array.isArray(d) ? d : d?.[key] || [])

export function RfqList() {
  const rfqs = useAsync(() => Rfqs.list(), [])
  if (rfqs.loading) return <Loading />
  if (rfqs.error) return <ErrorBox error={rfqs.error} onRetry={rfqs.retry} />
  return (
    <>
      <div className="spread"><h1>My RFQs</h1><a className="btn btn-primary" href="/app/rfq-new">New RFQ</a></div>
      <RfqTable rows={asRows(rfqs.data, 'rfqs')} />
    </>
  )
}

export function OrderList() {
  const orders = useAsync(() => Orders.list(), [])
  if (orders.loading) return <Loading />
  if (orders.error) return <ErrorBox error={orders.error} onRetry={orders.retry} />
  return (
    <>
      <h1>Orders</h1>
      <OrderTable rows={asRows(orders.data, 'orders')} />
    </>
  )
}

export function SampleList() {
  const samples = useAsync(() => Samples.list(), [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  if (samples.loading) return <Loading />
  if (samples.error) return <ErrorBox error={samples.error} onRetry={samples.retry} />
  const rows = asRows(samples.data, 'samples')

  async function requestSample() {
    setBusy(true)
    setError(null)
    try {
      const products = await Catalogue.products()
      const first = products.products?.[0]
      if (!first) throw new Error('No products in catalogue to sample')
      await Samples.create({ productId: first.id, note: 'Requested from customer dashboard' })
      samples.retry()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="spread">
        <h1>Sample requests</h1>
        <button className="btn btn-primary" onClick={requestSample} disabled={busy}>
          {busy ? 'Requesting…' : 'Request a sample'}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!rows.length ? <p className="muted">No sample requests yet.</p> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Sample</th><th>Product</th><th>Status</th><th>Requested</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.productId}</td>
                  <td><Badge value={s.status} /></td>
                  <td className="muted">{(s.createdAt || '').slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
