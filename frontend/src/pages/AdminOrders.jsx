import {useState} from 'react'
import {Customers, Orders, Reference, asRows} from '../api.js'
import {useAsync, Loading, ErrorBox, Badge, StageTimeline} from '../ui.jsx'
import {waLink} from '../data/services.js'

/**
 * Opens WhatsApp with a ready-made tracking message for the buyer. Only the
 * Order ID goes in the link - the registered email/phone is deliberately NOT
 * pre-filled, so a forwarded link cannot be used on its own.
 */
function shareOnWhatsApp(order, company) {
  const url = `${window.location.origin}/track?orderId=${encodeURIComponent(order.id)}`
  const text = `Hi${company ? ` ${company}` : ''} — you can track your order ${order.id} here: ${url}`
  window.open(waLink(text), '_blank', 'noopener,noreferrer')
}

/**
 * Creates an order. The server assigns the order id and ties it to the
 * customer's registered contact, so the panel shows exactly which email/phone
 * the buyer must enter on /track — that binding is what stops anyone else
 * looking the order up.
 */
function NewOrderForm({customers, onCreated}) {
  const [form, setForm] = useState({customerId: '', qty: '', dueDate: ''})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}))
  const customer = customers.find((c) => c.id === form.customerId) || null
  // A customer record always carries at least one contact (enforced by the
  // customers API), so every order created here is trackable in principle.
  const canTrack = Boolean(customer && (customer.email || customer.phone))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const qty = Number(form.qty)
    if (!form.customerId) return setError(new Error('Pick the customer this order is for'))
    if (!Number.isFinite(qty) || qty <= 0)
      return setError(new Error('Quantity must be a positive number'))
    setBusy(true)
    try {
      const res = await Orders.create({
        customerId: form.customerId,
        qty,
        dueDate: form.dueDate || null,
      })
      setCreated({...res.order, customer})
      setForm({customerId: '', qty: '', dueDate: ''})
      onCreated()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{marginTop: 0}}>New order</h2>
      <div className="grid grid-3">
        <div className="field">
          <label htmlFor="no-customer">Customer *</label>
          <select id="no-customer" value={form.customerId} onChange={set('customerId')}>
            <option value="">Choose a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company} ({c.id})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="no-qty">Quantity *</label>
          <input
            id="no-qty"
            type="number"
            min="1"
            step="1"
            value={form.qty}
            onChange={set('qty')}
            placeholder="500"
          />
        </div>
        <div className="field">
          <label htmlFor="no-due">Expected delivery</label>
          <input id="no-due" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </div>
      </div>

      {customer && (
        <p className="muted" style={{marginTop: 4}}>
          {canTrack ? (
            <>
              Only this contact can open the order on <code>/track</code>:{' '}
              {customer.email || 'no email'} · {customer.phone || 'no phone'}
            </>
          ) : (
            <span className="error">
              This customer has no registered email or phone, so the order cannot be tracked.
            </span>
          )}
        </p>
      )}

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={busy || !canTrack}>
          {busy ? 'Creating…' : 'Create order'}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      {created && (
        <p className="muted" role="status" style={{marginTop: 8}}>
          Created <strong>{created.id}</strong> for {created.customer?.company} · {created.qty} pcs.
          Share {created.id} with the buyer — they track it at <code>/track</code> using{' '}
          {created.customer?.email || created.customer?.phone}.
        </p>
      )}
    </form>
  )
}

export function AdminOrders() {
  const orders = useAsync(() => Orders.list(), [])
  const ref = useAsync(() => Reference.get(), [])
  const customers = useAsync(() => Customers.list(), [])
  const [busyId, setBusyId] = useState(null)
  const rows = asRows(orders.data, 'orders')
  const customerRows = asRows(customers.data, 'customers')
  const stages = (ref.data?.productionStages || []).map((s) => (typeof s === 'object' ? s.id : s))
  const statuses = ref.data?.orderStatuses || []

  if (orders.error) return <ErrorBox error={orders.error} onRetry={orders.retry} />
  if (customers.error) return <ErrorBox error={customers.error} onRetry={customers.retry} />
  // Only blank the page on the FIRST load. Unmounting on every mutation refetch
  // also destroyed the New-order form's success note and made stage clicks feel
  // like they did nothing.
  if (orders.loading && !rows.length) return <Loading />
  if (ref.loading && !stages.length) return <Loading />
  if (customers.loading && !customerRows.length) return <Loading />

  async function setStage(o, stage) {
    setBusyId(o.id)
    try {
      await Orders.setStage(o.id, stage)
      orders.retry()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function setStatus(o, value) {
    setBusyId(o.id)
    try {
      await Orders.setStatus(o.id, value)
      orders.retry()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>Orders & production</h1>
      <NewOrderForm customers={asRows(customers.data, 'customers')} onCreated={orders.retry} />
      <h2>All orders</h2>
      {!rows.length ? (
        <p className="muted">No orders.</p>
      ) : (
        rows.map((o) => {
          const owner = customerRows.find((c) => c.id === o.customerId) || null
          return (
            <div className="card" key={o.id} style={{marginBottom: 12}}>
              <div className="spread">
                <div>
                  <strong>{o.id}</strong> · <Badge value={o.status} />
                  <div className="muted">
                    customer {o.customerId}
                    {owner ? ` · ${owner.company}` : ''} · value{' '}
                    {o.totalValue != null ? `₹${o.totalValue}` : '—'}
                  </div>
                  <div className="muted">
                    trackable by:{' '}
                    {owner && (owner.email || owner.phone)
                      ? `${owner.email || 'no email'} · ${owner.phone || 'no phone'}`
                      : 'no registered contact on file'}
                  </div>
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => shareOnWhatsApp(o, owner?.company)}
                  >
                    Send tracking link
                  </button>
                  {stages.map((s) => {
                    const current =
                      typeof o.stage === 'object' ? o.stage?.id : o.stage || o.productionStage
                    return (
                      <button
                        key={s}
                        className="btn"
                        disabled={busyId === o.id || s === current}
                        onClick={() => setStage(o, s)}
                      >
                        → {String(s).replace(/-/g, ' ')}
                      </button>
                    )
                  })}
                  {statuses
                    .filter((s) => s !== o.status && !/production/i.test(s))
                    .slice(0, 2)
                    .map((s) => (
                      <button
                        key={s}
                        className="btn"
                        disabled={busyId === o.id}
                        onClick={() => setStatus(o, s)}
                      >
                        → {String(s).replace(/-/g, ' ')}
                      </button>
                    ))}
                </div>
              </div>
              {stages.length > 0 && (
                <div style={{marginTop: 10}}>
                  <StageTimeline
                    stages={stages}
                    current={
                      typeof o.stage === 'object' ? o.stage?.id : o.stage || o.productionStage
                    }
                  />
                </div>
              )}
            </div>
          )
        })
      )}
    </>
  )
}
