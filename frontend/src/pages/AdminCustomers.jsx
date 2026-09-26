// pages/AdminCustomers.jsx — admin book of business (admin-only, server enforced).
// A registered email or phone is mandatory on every record because
// POST /api/track resolves the buyer's contact through customer.email /
// customer.phone. The client check mirrors the server rule so the admin sees the
// problem immediately; the server stays the authority.
//
// Also manages the 1:1 customer portal login. user.email and customer.email are
// separate by design and are never synchronised - the tracker keeps using the
// registered contact regardless of where the portal login lives.
import {useState} from 'react'
import {Customers, Users, asRows} from '../api.js'
import {useAsync, Loading, ErrorBox, Badge} from '../ui.jsx'

const TIERS = ['key', 'standard', 'prospect']
const COUNTRIES = ['IN', 'GB', 'DE', 'US']
const blank = {
  company: '',
  contactName: '',
  email: '',
  phone: '',
  city: '',
  country: 'IN',
  tier: 'standard',
}

// Same rules the server applies, so errors show without a failed round trip.
function checkContact(email, phone) {
  const e = String(email || '').trim()
  const p = String(phone || '').trim()
  if (!e && !p)
    return 'A registered email or phone is required — customers verify their orders with it.'
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return `"${e}" is not a valid email address.`
  if (p && p.replace(/\D/g, '').length < 6)
    return 'Phone must contain at least 6 digits — that is the minimum the order tracker can match on.'
  return null
}

function ContactFields({draft, setDraft, idPrefix}) {
  const set = (k) => (e) => setDraft((d) => ({...d, [k]: e.target.value}))
  const id = (f) => `${idPrefix}-${f}`
  return (
    <>
      <div className="field">
        <label htmlFor={id('company')}>Company *</label>
        <input
          id={id('company')}
          value={draft.company}
          onChange={set('company')}
          placeholder="Company name"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('contact')}>Contact name</label>
        <input
          id={id('contact')}
          value={draft.contactName}
          onChange={set('contactName')}
          placeholder="Full name"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('email')}>Registered email</label>
        <input
          id={id('email')}
          type="email"
          value={draft.email}
          onChange={set('email')}
          placeholder="buyer@company.com"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('phone')}>Registered phone</label>
        <input
          id={id('phone')}
          value={draft.phone}
          onChange={set('phone')}
          placeholder="+91-90000-00000"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('city')}>City</label>
        <input
          id={id('city')}
          value={draft.city}
          onChange={set('city')}
          placeholder="Tiruppur"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('country')}>Country</label>
        <select id={id('country')} value={draft.country} onChange={set('country')}>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={id('tier')}>Tier</label>
        <select id={id('tier')} value={draft.tier} onChange={set('tier')}>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

const PASSWORD_MIN = 8
const accountBlank = {email: '', name: '', password: '', confirm: ''}

// Same rules the server applies to POST/PATCH /api/users.
function checkAccount(draft, {isNew}) {
  const email = String(draft.email || '').trim()
  if (!email) return 'Login email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return `"${email}" is not a valid email address.`
  if (isNew && !String(draft.name || '').trim()) return 'Name is required.'
  const pw = String(draft.password || '')
  // On edit a blank password means "leave it unchanged".
  if (isNew || pw !== '') {
    if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`
    if (pw !== draft.confirm) return 'Passwords do not match.'
  }
  return null
}

function AccountFields({draft, setDraft, idPrefix, isNew}) {
  const set = (k) => (e) => setDraft((d) => ({...d, [k]: e.target.value}))
  const id = (f) => `${idPrefix}-${f}`
  return (
    <>
      <div className="field">
        <label htmlFor={id('email')}>Login email *</label>
        <input
          id={id('email')}
          type="email"
          value={draft.email}
          onChange={set('email')}
          placeholder="portal.login@company.com"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor={id('name')}>Name *</label>
        <input
          id={id('name')}
          value={draft.name}
          onChange={set('name')}
          placeholder="Contact name"
          autoComplete="off"
        />
      </div>
      {isNew && (
        <>
          <div className="field">
            <label htmlFor={id('password')}>Password *</label>
            <input
              id={id('password')}
              type="password"
              value={draft.password}
              onChange={set('password')}
              placeholder={`At least ${PASSWORD_MIN} characters`}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor={id('confirm')}>Confirm password *</label>
            <input
              id={id('confirm')}
              type="password"
              value={draft.confirm}
              onChange={set('confirm')}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </div>
        </>
      )}
    </>
  )
}

/**
 * Portal login for one customer (1:1). The login email is independent of the
 * registered order-tracking contact, so a mismatch is surfaced as a notice and
 * never auto-corrected. Passwords are write-only: never rendered back.
 */
function AccountPanel({
  customer,
  account,
  isOpen,
  mode,
  draft,
  setDraft,
  busy,
  error,
  notice,
  onToggle,
  onReset,
  onRevoke,
  onSubmit,
}) {
  const diverged =
    account &&
    customer.email &&
    account.email.toLowerCase() !== String(customer.email).toLowerCase()
  return (
    <>
      <div className="row" style={{marginTop: 12}}>
        <strong>Portal account</strong>
        {!account && <span className="muted">none yet</span>}
        {account && (
          <span className="muted">
            {account.email} · {account.role} · {account.id}
          </span>
        )}
        <div className="row">
          <button type="button" className="btn" disabled={busy} onClick={onToggle}>
            {isOpen ? 'Cancel' : account ? 'Edit account' : 'Create Account'}
          </button>
          {account && (
            <>
              <button type="button" className="btn" disabled={busy} onClick={onReset}>
                Reset password
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => onRevoke(account)}
              >
                Revoke
              </button>
            </>
          )}
        </div>
      </div>

      {diverged && (
        <p className="notice" style={{marginTop: 8}}>
          Login email differs from the registered order-tracking contact. Both are kept separately —
          order tracking still verifies on the registered contact.
        </p>
      )}

      {isOpen && (
        <form onSubmit={onSubmit} style={{marginTop: 12}}>
          <div className="grid grid-3">
            <AccountFields
              draft={draft}
              setDraft={setDraft}
              idPrefix={`acct-${customer.id}`}
              isNew={mode === 'create'}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy
                ? 'Saving…'
                : mode === 'create'
                  ? 'Create account'
                  : mode === 'reset'
                    ? 'Set new password'
                    : 'Save account'}
            </button>
            <button type="button" className="btn" disabled={busy} onClick={onToggle}>
              Cancel
            </button>
          </div>
          <p className="muted" style={{marginTop: 8}}>
            {mode === 'create'
              ? `Defaults to the registered contact email. Minimum ${PASSWORD_MIN} characters.`
              : 'Leave the password blank to keep the current one.'}
          </p>
          {error && (
            <p className="error" role="alert">
              {error.message}
            </p>
          )}
          {notice && !error && (
            <p className="muted" role="status">
              {notice}
            </p>
          )}
        </form>
      )}
    </>
  )
}

export function AdminCustomers() {
  const customers = useAsync(() => Customers.list(), [])
  const accounts = useAsync(() => Users.list(), [])
  const [draft, setDraft] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [editing, setEditing] = useState(null)
  const [acctFor, setAcctFor] = useState(null) // customer id whose account form is open
  const [acct, setAcct] = useState(accountBlank)
  const [acctMode, setAcctMode] = useState('create') // 'create' | 'edit' | 'reset'

  // accounts and customers are separate collections, so an account lookup is a
  // plain find. Read during render and inside the handlers below.
  const accountRows = asRows(accounts.data, 'users')
  const accountFor = (customerId) => accountRows.find((u) => u.customerId === customerId) || null

  function refreshAll() {
    customers.retry()
    accounts.retry()
  }

  function closeAccount() {
    setAcctFor(null)
    setAcct(accountBlank)
    setAcctMode('create')
  }

  function openAccount(c, mode) {
    setNotice(null)
    setError(null)
    setAcctMode(mode)
    setAcctFor(c.id)
    const existing = accountRows.find((u) => u.customerId === c.id)
    if (mode === 'create') {
      // Default the login email to the registered contact; still editable, never synced.
      setAcct({...accountBlank, email: c.email || '', name: c.contactName || ''})
    } else {
      setAcct({
        ...accountBlank,
        email: existing ? existing.email : '',
        name: existing ? existing.name : c.contactName || '',
      })
    }
  }

  async function submitAccount(e, c) {
    e.preventDefault()
    setNotice(null)
    const invalid = checkAccount(acct, {isNew: acctMode === 'create'})
    if (invalid) return setError(new Error(invalid))
    setBusy(true)
    setError(null)
    try {
      if (acctMode === 'create') {
        const res = await Users.create({
          email: acct.email.trim(),
          name: acct.name.trim(),
          role: 'customer',
          customerId: c.id,
          password: acct.password,
        })
        setNotice(`Portal account created for ${c.company} (${res.user.id}).`)
      } else {
        const existing = accountRows.find((u) => u.customerId === c.id)
        // Blank password is omitted entirely, so the server keeps the current one.
        const body = {email: acct.email.trim(), name: acct.name.trim()}
        if (acct.password) body.password = acct.password
        await Users.update(existing.id, body)
        setNotice(`Portal account updated for ${c.company}.`)
      }
      closeAccount() // clears the password out of component state
      refreshAll()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function revokeAccount(u) {
    setNotice(null)
    setError(null)
    if (
      !window.confirm(
        `Delete the portal account for ${u.email}? They will no longer be able to sign in.`,
      )
    )
      return
    setBusy(true)
    try {
      await Users.remove(u.id)
      setNotice(`Deleted portal account ${u.id}.`)
      refreshAll()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function register(e) {
    e.preventDefault()
    setNotice(null)
    if (!draft.company.trim()) return setError(new Error('company is required'))
    const contactError = checkContact(draft.email, draft.phone)
    if (contactError) return setError(new Error(contactError))
    setBusy(true)
    setError(null)
    try {
      const res = await Customers.create(draft)
      setDraft(blank)
      setNotice(`Registered ${res.customer.company} as ${res.customer.id}.`)
      customers.retry()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(e, id) {
    e.preventDefault()
    setNotice(null)
    const contactError = checkContact(editing.email, editing.phone)
    if (contactError) return setError(new Error(contactError))
    setBusy(true)
    setError(null)
    try {
      const res = await Customers.update(id, editing)
      setNotice(`Updated ${res.customer.company} (${res.customer.id}).`)
      setEditing(null)
      customers.retry()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (customers.loading || accounts.loading) return <Loading />
  if (customers.error) return <ErrorBox error={customers.error} onRetry={customers.retry} />
  if (accounts.error) return <ErrorBox error={accounts.error} onRetry={accounts.retry} />
  const rows = asRows(customers.data, 'customers')
  // `editing` holds the customer object, so compare on its id, not identity.
  const isOpen = (c) => Boolean(editing) && editing.id === c.id

  return (
    <>
      <h1>Customers</h1>
      <p className="muted">
        The contact registered here is what a buyer enters on the public order tracker. Every
        customer needs at least one of email or phone, and neither can be shared with another
        customer.
      </p>

      <h2>Register customer</h2>
      <form className="card" onSubmit={register}>
        <div className="grid grid-3">
          <ContactFields draft={draft} setDraft={setDraft} idPrefix="new" />
        </div>
        <div className="row">
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Registering…' : 'Register customer'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error.message}
          </p>
        )}
        {notice && !error && (
          <p className="muted" role="status">
            {notice}
          </p>
        )}
      </form>

      <h2>Registered customers</h2>
      {!rows.length ? (
        <p className="muted">No customers.</p>
      ) : (
        rows.map((c) => (
          <div className="card" key={c.id} style={{marginBottom: 12}}>
            <div className="spread">
              <div>
                <strong>{c.company}</strong> <Badge value={c.tier} />{' '}
                <span className="muted">{c.id}</span>
                <div className="muted">
                  {c.contactName || '—'} · {c.city || '—'} · {c.country || '—'} · since {c.since}
                </div>
                <div className="muted">
                  {c.email || 'no email'} · {c.phone || 'no phone'}
                  {!c.email && !c.phone && ' · cannot verify orders'}
                </div>
                <div className="muted">
                  {c.stats.rfqs} RFQs · {c.stats.openOrders} open orders · {c.stats.samples} samples
                </div>
              </div>
              <div className="row">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => {
                    setNotice(null)
                    setError(null)
                    setEditing(isOpen(c) ? null : {...c})
                  }}
                >
                  {isOpen(c) ? 'Cancel' : 'Edit contact'}
                </button>
              </div>
            </div>

            <AccountPanel
              customer={c}
              account={accountFor(c.id)}
              isOpen={acctFor === c.id}
              mode={acctMode}
              draft={acct}
              setDraft={setAcct}
              busy={busy}
              error={error}
              notice={notice}
              onToggle={() =>
                acctFor === c.id
                  ? closeAccount()
                  : openAccount(c, accountFor(c.id) ? 'edit' : 'create')
              }
              onReset={() => openAccount(c, 'reset')}
              onRevoke={revokeAccount}
              onSubmit={(ev) => submitAccount(ev, c)}
            />

            {isOpen(c) && (
              <form onSubmit={(ev) => saveEdit(ev, c.id)} style={{marginTop: 12}}>
                <div className="grid grid-3">
                  <ContactFields draft={editing} setDraft={setEditing} idPrefix={`edit-${c.id}`} />
                </div>
                <div className="row">
                  <button className="btn btn-primary" disabled={busy} type="submit">
                    {busy ? 'Saving…' : `Save ${c.id}`}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </div>
                {error && (
                  <p className="error" role="alert">
                    {error.message}
                  </p>
                )}
              </form>
            )}
          </div>
        ))
      )}

      <h2>Portal accounts</h2>
      <p className="muted">
        Every account that can sign in to the portal. Passwords and hashes are never sent to this
        page.
      </p>
      <div className="card" style={{padding: 0}}>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Customer</th>
              <th>Account ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accountRows.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <Badge value={u.role} />
                </td>
                <td className="muted">{u.customer || '—'}</td>
                <td className="muted">{u.id}</td>
                <td>
                  {u.role === 'admin' ? (
                    <span className="muted">managed outside this page</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busy}
                      onClick={() => revokeAccount(u)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      {notice && !error && (
        <p className="muted" role="status">
          {notice}
        </p>
      )}
    </>
  )
}
