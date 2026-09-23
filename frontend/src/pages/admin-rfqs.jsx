import { useState } from 'react'
import { Rfqs, Catalogue, Reference } from '../api.js'
import { useAsync, Loading, ErrorBox, Badge } from '../ui.jsx'

const asRows = (d, key) => (Array.isArray(d) ? d : d?.[key] || [])

export function AdminRfqs() {
  const rfqs = useAsync(() => Rfqs.list(), [])
  const ref = useAsync(() => Reference.get(), [])
  const [busyId, setBusyId] = useState(null)
  if (rfqs.loading || ref.loading) return <Loading />
  if (rfqs.error) return <ErrorBox error={rfqs.error} onRetry={rfqs.retry} />
  const rows = asRows(rfqs.data, 'rfqs')
  const statuses = ref.data?.rfqStatuses || ['new', 'quote-sent', 'accepted', 'rejected']

  async function setStatus(id, status) {
    setBusyId(id)
    try { await Rfqs.setStatus(id, status); rfqs.retry() } catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  return (
    <>
      <h1>RFQ queue</h1>
      {!rows.length ? <p className="muted">No RFQs.</p> : rows.map((r) => (
        <div className="card" key={r.id} style={{ marginBottom: 12 }}>
          <div className="spread">
            <div>
              <strong>{r.id}</strong> · <Badge value={r.status} />
              <div className="muted">customer {r.customerId} · {(r.createdAt || '').slice(0, 10)}</div>
            </div>
            <div className="row">
              {statuses.filter((s) => s !== r.status).map((s) => (
                <button key={s} className="btn" disabled={busyId === r.id} onClick={() => setStatus(r.id, s)}>
                  → {String(s).replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {(r.items || r.lines || []).length > 0 && (
            <table style={{ marginTop: 10 }}>
              <thead><tr><th>Product</th><th>Qty</th><th>Colour</th><th>Branding</th></tr></thead>
              <tbody>
                {(r.items || r.lines).map((ln, i) => (
                  <tr key={i}>
                    <td>{ln.productId || ln.name}</td>
                    <td>{ln.qty}</td>
                    <td>{ln.color || '—'}</td>
                    <td className="muted">{(ln.branding || []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </>
  )
}
