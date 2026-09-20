import { Catalogue } from '../api.js'
import { useAsync, Loading, ErrorBox, Badge, navigate } from '../ui.jsx'

export function CataloguePage() {
  const cats = useAsync(() => Catalogue.categories(), [])
  const products = useAsync(() => Catalogue.products(), [])
  const [cat, setCat] = useState('')
  if (products.loading || cats.loading) return <Loading />
  if (products.error) return <ErrorBox error={products.error} onRetry={products.retry} />
  const filtered = cat ? products.data.products.filter((p) => p.category === cat) : products.data.products
  return (
    <>
      <h1>Product catalogue</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className={`btn ${cat === '' ? 'btn-primary' : ''}`} onClick={() => setCat('')}>All</button>
        {(cats.data?.categories || []).map((c) => (
          <button key={c.id} className={`btn ${cat === c.id ? 'btn-primary' : ''}`} onClick={() => setCat(c.id)}>
            {c.label || c.id}
          </button>
        ))}
      </div>
      <div className="grid grid-3">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <div className="spread">
              <strong>{p.name}</strong>
              <Badge value={p.category} />
            </div>
            <p className="muted" style={{ margin: '8px 0' }}>
              {p.fabric} · {p.gsm} GSM · lead {p.leadTimeDays} days
            </p>
            <p style={{ margin: '4px 0' }}>MOQ <strong>{p.moq}</strong> · from <strong>₹{p.indicativePrice}</strong>/pc</p>
            <div className="row">
              {p.colors.slice(0, 4).map((c) => <span className="badge" key={c}>{c}</span>)}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('#/app/rfq-new')}>
              Request quotation
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
