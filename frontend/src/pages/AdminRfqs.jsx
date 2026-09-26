import {useState} from 'react'
import {Rfqs, Reference, asRows} from '../api.js'
import {useAsync, Badge} from '../ui.jsx'

export function AdminRfqs() {
  const rfqs = useAsync(() => Rfqs.list(), [])
  const ref = useAsync(() => Reference.get(), [])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [made, setMade] = useState(null)
  // The backend only converts quoted/accepted RFQs.
  const CONVERTIBLE = ['quoted', 'accepted']

  const rows = asRows(rfqs.data, 'rfqs')
  // "converted" is never a plain status target: it must go through convert(),
  // otherwise the RFQ would claim to be an order that was never created.
  const statuses = (
    ref.data?.rfqStatuses || ['submitted', 'in_review', 'quoted', 'accepted', 'rejected']
  ).filter((s) => s !== 'converted')

  async function setStatus(id, status) {
    setBusyId(id)
    setError(null)
    try {
      await Rfqs.setStatus(id, status)
      rfqs.retry()
    } catch (e) {
      setError(e)
    } finally {
      setBusyId(null)
    }
  }

  async function convert(id) {
    setBusyId(id)
    setError(null)
    setMade(null)
    try {
      // customerId is left out on purpose: the server defaults to the RFQ's own
      // customer, so the order stays bound to the contact that can track it.
      const res = await Rfqs.convert(id)
      setMade(`${res.order.id} created for ${res.order.customer || ''} · ${res.order.qty} pcs`)
      rfqs.retry()
    } catch (e) {
      setError(e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>RFQ queue</h1>
      <p className="muted">Converting an RFQ creates a real order and hands back its Order ID.</p>
      {made && (
        <p className="muted" role="status">
          Order <strong>{made}</strong> — share the Order ID so the buyer can track it.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      {!rows.length ? (
        <p className="muted">No RFQs.</p>
      ) : (
        rows.map((r) => (
          <div className="card" key={r.id} style={{marginBottom: 12}}>
            <div className="spread">
              <div>
                <strong>{r.id}</strong> · <Badge value={r.status} />
                <div className="muted">
                  customer {r.customerId} · {(r.createdAt || '').slice(0, 10)}
                </div>
              </div>
              <div className="row">
                {CONVERTIBLE.includes(r.status) && (
                  <button
                    className="btn btn-primary"
                    disabled={busyId === r.id}
                    onClick={() => convert(r.id)}
                  >
                    Convert to order
                  </button>
                )}
                {statuses
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <button
                      key={s}
                      className="btn"
                      disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, s)}
                    >
                      → {String(s).replace(/-/g, ' ')}
                    </button>
                  ))}
              </div>
            </div>
            {(r.items || r.lines || []).length > 0 && (
              <table style={{marginTop: 10}}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Colour</th>
                    <th>Branding</th>
                  </tr>
                </thead>
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
        ))
      )}
    </>
  )
}
