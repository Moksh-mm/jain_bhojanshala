import { useEffect, useState, useCallback } from 'react'
import { superAdmin } from '../../lib/api'

const EMPTY_CREATE = {
  nameEnglish: '', nameGujarati: '', cityEnglish: '',
  adminUsername: '', adminPassword: '',
  isActive: true,
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="a-modal-bg" onClick={onClose}>
      <div className="a-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="a-modal-head">
          <h2 className="a-modal-title">{title}</h2>
          <button className="a-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="a-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 24px 8px' }}>
          {children}
        </div>
        {footer && <div className="a-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="a-toggle-wrap">
      <span className="a-toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="a-toggle-track" /><span className="a-toggle-thumb" />
      </span>
      {label && <span className="a-toggle-label">{label}</span>}
    </label>
  )
}

function CreateForm({ form, setForm }) {
  const inp = (key, extra = {}) => (
    <input className="a-input" value={form[key] ?? ''}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} {...extra} />
  )
  return (
    <div style={{ paddingTop: 8 }}>
      <p className="a-section-title">Bhojanshala Name</p>
      <div className="a-form-grid">
        <div className="a-field">
          <label className="a-label">English Name <span className="req">*</span></label>
          {inp('nameEnglish', { placeholder: 'Shri Adinath Bhojanshala' })}
        </div>
        <div className="a-field">
          <label className="a-label">Gujarati Name <span className="req">*</span></label>
          {inp('nameGujarati', { placeholder: 'શ્રી આદિનાથ ભોજનશાળા' })}
        </div>
        <div className="a-field" style={{ gridColumn: '1 / -1' }}>
          <label className="a-label">City <span className="req">*</span></label>
          {inp('cityEnglish', { placeholder: 'Ahmedabad' })}
        </div>
      </div>

      <p className="a-section-title" style={{ marginTop: 20 }}>Admin Login Credentials</p>
      <div className="a-hint" style={{ marginBottom: 12 }}>
        The bhojanshala admin will use these to log in and manage their listing.
      </div>
      <div className="a-form-grid">
        <div className="a-field">
          <label className="a-label">Username <span className="req">*</span></label>
          {inp('adminUsername', { placeholder: 'adinath.ahmedabad' })}
        </div>
        <div className="a-field">
          <label className="a-label">Password <span className="req">*</span></label>
          {inp('adminPassword', { placeholder: 'Min. 6 characters', type: 'password' })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Toggle checked={!!form.isActive}
          onChange={v => setForm(p => ({ ...p, isActive: v }))}
          label="Visible on public website immediately" />
      </div>
    </div>
  )
}

function AssignAdminModal({ bhoj, admins, onClose, onAssigned }) {
  const [selectedAdmin, setSelectedAdmin] = useState(bhoj.admin?.id || '')
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')

  const handleAssign = async () => {
    setBusy(true); setErr('')
    try {
      if (selectedAdmin) {
        await superAdmin.updateAdmin(selectedAdmin, { bhojanshalaId: bhoj.id })
      } else if (bhoj.admin?.id) {
        await superAdmin.updateAdmin(bhoj.admin.id, { bhojanshalaId: null })
      }
      onAssigned()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Assign Admin — ${bhoj.nameEnglish}`}
      onClose={onClose}
      footer={<>
        <button className="a-btn a-btn-secondary" onClick={onClose}>Cancel</button>
        <button className="a-btn a-btn-primary" onClick={handleAssign} disabled={busy}>
          {busy ? 'Saving…' : 'Save Assignment'}
        </button>
      </>}
    >
      {err && <div className="a-alert a-alert-error">{err}</div>}
      <div className="a-field" style={{ padding: '16px 0' }}>
        <label className="a-label">Select Admin</label>
        <select className="a-select" value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}>
          <option value="">— No admin assigned —</option>
          {admins.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}{a.bhojanshalaId && a.bhojanshalaId !== bhoj.id ? ' (assigned elsewhere)' : ''}
            </option>
          ))}
        </select>
        <div className="a-hint">One admin manages one bhojanshala.</div>
      </div>
    </Modal>
  )
}

export default function BhojanshalaManagement({ navigate, payload }) {
  const [bhojList,   setBhojList]   = useState([])
  const [admins,     setAdmins]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState(EMPTY_CREATE)
  const [assignBhoj, setAssignBhoj] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [busy,       setBusy]       = useState(false)
  const [alert,      setAlert]      = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [bhojRes, adminsRes] = await Promise.all([
        superAdmin.getBhojanshalas(),
        superAdmin.getAdmins(),
      ])
      setBhojList(bhojRes.data || [])
      setAdmins(adminsRes.data || [])
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    if (payload?.action === 'create') openCreate()
  }, [])

  function openCreate() {
    setForm({ ...EMPTY_CREATE })
    setShowCreate(true)
    setAlert(null)
  }

  async function handleCreate() {
    const { nameEnglish, nameGujarati, cityEnglish, adminUsername, adminPassword } = form
    if (!nameEnglish?.trim())   { setAlert({ type: 'error', msg: 'English name is required.' }); return }
    if (!nameGujarati?.trim())  { setAlert({ type: 'error', msg: 'Gujarati name is required.' }); return }
    if (!cityEnglish?.trim())   { setAlert({ type: 'error', msg: 'City is required.' }); return }
    if (!adminUsername?.trim()) { setAlert({ type: 'error', msg: 'Admin username is required.' }); return }
    if (!adminPassword || adminPassword.length < 6) { setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' }); return }

    setBusy(true); setAlert(null)
    try {
      await superAdmin.createBhojanshala({
        nameEnglish:   nameEnglish.trim(),
        nameGujarati:  nameGujarati.trim(),
        cityEnglish:   cityEnglish.trim(),
        isActive:      form.isActive,
        adminName:     adminUsername.trim(),
        adminUsername: adminUsername.trim(),
        adminPassword: adminPassword,
      })
      setShowCreate(false)
      loadData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(b) {
    try {
      await superAdmin.updateBhojanshala(b.id, { isActive: !b.isActive })
      loadData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  async function handleDelete(b) {
    try {
      await superAdmin.deleteBhojanshala(b.id)
      setConfirmDel(null)
      loadData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  const filtered = bhojList.filter(b =>
    !search ||
    b.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
    b.cityEnglish.toLowerCase().includes(search.toLowerCase()) ||
    (b.nameGujarati || '').includes(search)
  )

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Bhojanshalas</h2>
        <button className="a-btn a-btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      {alert && !showCreate && (
        <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>
      )}

      <div className="a-search-row">
        <div className="a-search-wrap">
          <span className="a-search-icon">🔍</span>
          <input className="a-input" placeholder="Search by name or city…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-icon">🏛</div>
            <p>No bhojanshalas yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th><th>City</th><th>Admin</th>
                  <th>Status</th><th>Updated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="a-cell-main">{b.nameEnglish}</div>
                      <div className="a-cell-sub">{b.nameGujarati}</div>
                    </td>
                    <td>{b.cityEnglish}</td>
                    <td>
                      {b.admin
                        ? <span className="a-badge a-badge-blue">{b.admin.name}</span>
                        : <span className="a-badge a-badge-gray">Unassigned</span>}
                    </td>
                    <td>
                      <span className={`a-badge ${b.isActive ? 'a-badge-green' : 'a-badge-red'}`}>
                        {b.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(b.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <div className="a-actions">
                        <button className="a-btn a-btn-xs"
                          style={b.isActive
                            ? { background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' }
                            : { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
                          onClick={() => handleToggle(b)}>
                          {b.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button className="a-btn a-btn-danger a-btn-xs" onClick={() => setConfirmDel(b)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal
          title="Add New Bhojanshala"
          onClose={() => setShowCreate(false)}
          footer={<>
            {alert && <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{alert.msg}</span>}
            <button className="a-btn a-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleCreate} disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </button>
          </>}
        >
          <CreateForm form={form} setForm={setForm} />
        </Modal>
      )}

      {assignBhoj && (
        <AssignAdminModal
          bhoj={assignBhoj} admins={admins}
          onClose={() => setAssignBhoj(null)} onAssigned={loadData}
        />
      )}

      {confirmDel && (
        <Modal
          title="Delete Bhojanshala"
          onClose={() => setConfirmDel(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
            <button className="a-btn a-btn-danger" onClick={() => handleDelete(confirmDel)}>Yes, Delete</button>
          </>}
        >
          <div className="a-confirm" style={{ padding: '16px 0' }}>
            <p>Delete <strong>{confirmDel.nameEnglish}</strong>? All meal data and logs will be removed. Cannot be undone.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
