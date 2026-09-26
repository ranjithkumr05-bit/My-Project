import {useState} from 'react'
import {Samples, asRows} from '../api.js'
import {useAsync, Loading, ErrorBox, Badge} from '../ui.jsx'

export function AdminSamples() {
  const samples = useAsync(() => Samples.list(), [])
  const [busyId, setBusyId] = useState(null)
  if (samples.loading) return <Loading />
  if (samples.error) return <ErrorBox error={samples.error} onRetry={samples.retry} />
  const rows = asRows(samples.data, 'samples')

  async function setStatus(id, status) {
    setBusyId(id)
    try {
      await Samples.setStatus(id, status)
      samples.retry()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>Sample requests</h1>
      {!rows.length ? (
        <p className="muted">No sample requests.</p>
      ) : (
        <div className="card" style={{padding: 0}}>
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td className="muted">{s.customerId || '—'}</td>
                  <td>{s.productId}</td>
                  <td>
                    <Badge value={s.status} />
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn btn-primary"
                        disabled={busyId === s.id}
                        onClick={() => setStatus(s.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyId === s.id}
                        onClick={() => setStatus(s.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
