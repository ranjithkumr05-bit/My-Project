import {useState} from 'react'
import {Leads, asRows} from '../api.js'
import {useAsync, Loading, ErrorBox, Badge} from '../ui.jsx'

export function LeadsPage() {
  const leads = useAsync(() => Leads.list(), [])
  const [busyId, setBusyId] = useState(null)
  if (leads.loading) return <Loading />
  if (leads.error) return <ErrorBox error={leads.error} onRetry={leads.retry} />
  const rows = asRows(leads.data, 'leads')

  async function setStatus(id, status) {
    setBusyId(id)
    try {
      await Leads.update(id, {status})
      leads.retry()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>Lead management</h1>
      {!rows.length ? (
        <p className="muted">No leads yet.</p>
      ) : (
        <div className="card" style={{padding: 0}}>
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.id}
                    <div className="muted">{(l.createdAt || '').slice(0, 10)}</div>
                  </td>
                  <td>
                    {l.contactName || l.name || '—'}
                    <div className="muted">
                      {l.email || ''} {l.phone || ''}
                    </div>
                  </td>
                  <td>
                    <Badge value={l.source || 'unknown'} />
                  </td>
                  <td>
                    <Badge value={l.status} />
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn"
                        disabled={busyId === l.id}
                        onClick={() => setStatus(l.id, 'contacted')}
                      >
                        Contacted
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={busyId === l.id}
                        onClick={() => setStatus(l.id, 'qualified')}
                      >
                        Qualify
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyId === l.id}
                        onClick={() => setStatus(l.id, 'lost')}
                      >
                        Lost
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
