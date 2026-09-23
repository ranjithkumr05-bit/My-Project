import { Badge, StageTimeline } from '../ui.jsx'

export function RfqTable({ rows }) {
  if (!rows?.length) return <p className="muted">No RFQs yet — start with “New RFQ”.</p>
  return (
    <div className="card" style={{ padding: 0 }}>
      <table>
        <thead><tr><th>RFQ</th><th>Created</th><th>Items</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td className="muted">{(r.createdAt || '').slice(0, 10)}</td>
              <td>{(r.items || r.lines || []).length}</td>
              <td><Badge value={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OrderTable({ rows }) {
  if (!rows?.length) return <p className="muted">No orders yet.</p>
  return (
    <div className="card" style={{ padding: 0 }}>
      <table>
        <thead><tr><th>Order</th><th>Status</th><th>Value</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>
                <Badge value={o.status} />
                {(o.stage && o.stages?.length > 0) || (o.productionStage && o.allStages?.length > 0) ? (
                  <div style={{ marginTop: 6 }}>
                    <StageTimeline
                      stages={o.stages ? o.stages.map((s) => s.id || s) : o.allStages}
                      current={o.stage ? (typeof o.stage === 'object' ? o.stage.id : o.stage) : o.productionStage}
                    />
                  </div>
                ) : null}
              </td>
              <td>{o.totalValue != null ? `₹${o.totalValue}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
