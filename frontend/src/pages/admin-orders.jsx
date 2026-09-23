import { useState } from 'react'
import { Orders, Reference } from '../api.js'
import { useAsync, Loading, ErrorBox, Badge, StageTimeline } from '../ui.jsx'

const asRows = (d, key) => (Array.isArray(d) ? d : d?.[key] || [])

export function AdminOrders() {
  const orders = useAsync(() => Orders.list(), [])
  const ref = useAsync(() => Reference.get(), [])
  const [busyId, setBusyId] = useState(null)
  if (orders.loading || ref.loading) return <Loading />
  if (orders.error) return <ErrorBox error={orders.error} onRetry={orders.retry} />
  const rows = asRows(orders.data, 'orders')
  const stages = (ref.data?.productionStages || []).map((s) => (typeof s === 'object' ? s.id : s))
  const statuses = ref.data?.orderStatuses || []

  async function setStage(o, stage) {
    setBusyId(o.id)
    try { await Orders.setStage(o.id, stage); orders.retry() } catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  async function setStatus(o, value) {
    setBusyId(o.id)
    try { await Orders.setStatus(o.id, value); orders.retry() } catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  return (
    <>
      <h1>Orders & production</h1>
      {!rows.length ? <p className="muted">No orders.</p> : rows.map((o) => (
        <div className="card" key={o.id} style={{ marginBottom: 12 }}>
          <div className="spread">
            <div>
              <strong>{o.id}</strong> · <Badge value={o.status} />
              <div className="muted">customer {o.customerId} · value {o.totalValue != null ? `₹${o.totalValue}` : '—'}</div>
            </div>
            <div className="row">
              {stages.map((s) => {
                const current = typeof o.stage === 'object' ? o.stage?.id : (o.stage || o.productionStage)
                return (
                  <button key={s} className="btn" disabled={busyId === o.id || s === current} onClick={() => setStage(o, s)}>
                    → {String(s).replace(/-/g, ' ')}
                  </button>
                )
              })}
              {statuses.filter((s) => s !== o.status && !/production/i.test(s)).slice(0, 2).map((s) => (
                <button key={s} className="btn" disabled={busyId === o.id} onClick={() => setStatus(o, s)}>
                  → {String(s).replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {stages.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <StageTimeline stages={stages} current={typeof o.stage === 'object' ? o.stage?.id : (o.stage || o.productionStage)} />
            </div>
          )}
        </div>
      ))}
    </>
  )
}
