import { useEffect, useState } from 'react'

// Tiny hash router: '#/app/...' for customer, '#/admin/...' for staff.
export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  return { hash, parts } // e.g. ['app','orders'] or ['admin','leads']
}

export function navigate(to) { window.location.hash = to }

// Fetch-on-mount helper: { data, error, loading, retry }
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
  }, [...deps, tick])
  return { ...state, retry: () => setTick((t) => t + 1) }
}

export function Badge({ value }) {
  const tone =
    /^(accepted|approved|converted|completed|delivered|won|closed.won|fulfilled)/i.test(value) ? 'ok'
    : /^(pending|draft|new|open|submitted|in.review)/i.test(value) ? 'warn'
    : /^(rejected|lost|cancelled|declined)/i.test(value) ? 'bad'
    : /^(quote.sent|approved|active|in.production|sample.requested)/i.test(value) ? 'gold'
    : ''
  return <span className={`badge ${tone}`}>{String(value).replace(/[-_]/g, ' ')}</span>
}

export function StageTimeline({ stages, current }) {
  const idx = stages.findIndex((s) => s === current)
  return (
    <div className="stages" aria-label="production stages">
      {stages.map((s, i) => (
        <span key={s} className={`stage ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}>
          {s.replace(/[-_]/g, ' ')}
        </span>
      ))}
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return <p className="muted" role="status">{label}</p>
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="card">
      <p className="error" role="alert">{error?.message || String(error)}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
    </div>
  )
}
