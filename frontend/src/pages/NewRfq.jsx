import { useState } from 'react'
import { Catalogue, Rfqs } from '../api.js'
import { useAsync, Loading, ErrorBox, navigate } from '../ui.jsx'

export function NewRfq() {
  const products = useAsync(() => Catalogue.products(), [])
  const [lines, setLines] = useState([]) // { productId, qty, color, branding: [] }
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (products.loading) return <Loading />
  if (products.error) return <ErrorBox error={products.error} onRetry={products.retry} />
  const all = products.data.products
  const byId = Object.fromEntries(all.map((p) => [p.id, p]))

  function addLine() {
    if (!all.length) return
    setLines((ls) => [...ls, { productId: all[0].id, qty: all[0].moq, color: all[0].colors[0], branding: [] }])
  }
  function patchLine(i, patch) {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  }
  function removeLine(i) { setLines((ls) => ls.filter((_, j) => j !== i)) }

  function lineWarnings() {
    return lines.map((l) => {
      const p = byId[l.productId]
      if (!p) return null
      if (l.qty < p.moq) return `${p.name}: below MOQ ${p.moq}`
      return null
    })
  }
  const warnings = lineWarnings().filter(Boolean)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await Rfqs.create({ note, lines })
      navigate('/app/rfqs')
    } catch (err) {
      setError(err.details?.join?.(', ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1>New quotation request (RFQ)</h1>
      <p className="muted">Indicative pricing only — the sales team confirms the formal quote.</p>
      <form onSubmit={submit}>
        {lines.map((l, i) => {
          const p = byId[l.productId]
          return (
            <div className="card" key={i} style={{ marginBottom: 12 }}>
              <div className="spread">
                <strong>Line {i + 1}</strong>
                <button type="button" className="btn btn-danger" onClick={() => removeLine(i)}>Remove</button>
              </div>
              <div className="grid grid-3" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor={`prod-${i}`}>Product</label>
                  <select id={`prod-${i}`} value={l.productId}
                    onChange={(e) => { const np = byId[e.target.value]; patchLine(i, { productId: np.id, qty: Math.max(l.qty, np.moq), color: np.colors[0], branding: [] }) }}>
                    {all.map((p2) => <option key={p2.id} value={p2.id}>{p2.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`qty-${i}`}>Quantity (MOQ {p.moq})</label>
                  <input id={`qty-${i}`} type="number" min={1} value={l.qty}
                    onChange={(e) => patchLine(i, { qty: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label htmlFor={`color-${i}`}>Colour</label>
                  <select id={`color-${i}`} value={l.color} onChange={(e) => patchLine(i, { color: e.target.value })}>
                    {p.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Branding options</label>
                <div className="row">
                  {p.branding.map((b) => (
                    <label key={b} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', textTransform: 'capitalize' }}>
                      <input type="checkbox" style={{ width: 'auto' }}
                        checked={l.branding.includes(b)}
                        onChange={(e) => patchLine(i, {
                          branding: e.target.checked ? [...l.branding, b] : l.branding.filter((x) => x !== b),
                        })} />
                      {b.replace(/-/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
              {p && l.qty < p.moq && <p className="error">Quantity is below this product's MOQ of {p.moq}.</p>}
            </div>
          )
        })}

        <button type="button" className="btn" onClick={addLine} disabled={!all.length}>+ Add line item</button>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="note">Notes for the quoting team (optional)</label>
          <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Target dates, packaging preferences, compliance needs…" />
        </div>

        {warnings.length > 0 && (
          <p className="notice">MOQ warnings: {warnings.join(' · ')}</p>
        )}
        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn-primary" disabled={busy || lines.length === 0 || warnings.length > 0}>
          {busy ? 'Submitting…' : 'Submit RFQ'}
        </button>
      </form>
    </>
  )
}
