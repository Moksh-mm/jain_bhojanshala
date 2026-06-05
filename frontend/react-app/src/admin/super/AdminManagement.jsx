import { useEffect, useState, useCallback } from 'react'
import { superAdmin } from '../../lib/api'

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="a-modal-bg" onClick={onClose}>
      <div className="a-modal" onClick={e => e.stopPropagation()}>
        <div className="a-modal-head">
          <h2 className="a-modal-title">{title}</h2>
          <button className="a-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="a-modal-body">{children}</div>
        {footer && <div className="a-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

const EMPTY_CREATE = { name: '', email: '', phone: '', password: '', bhojanshalaId: '' }

export default function AdminManagement({ navigate, payload }) {
  const [admins,   setAdmins]   = useState([])
  const [bhojList, setBhojList] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null)
  const [target,   setTarget]   = useState(null)
  const [busy,     setBusy]     = useState(false)
  const [alert,    setAlert]    = useState(null)

  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm,   setEditForm]   = useState({ name: '', phone: '', bhojanshalaId: '', isActive: true, password: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [admRes, bhojRes] = await Promise.all([
        superAdmin.getAdmins(),
        superAdmin.getBhojanshalas(),
      ])
      setAdmins(admRes.data || [])
      setBhojList((bhojRes.data || []).filter(b => b.isActive))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (payload?.action === 'create') setModal('create')
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!createForm.name || !createForm.email || !createForm.password) {
      setAlert({ type: 'error', msg: 'Name, email and password are required.' })
      return
    }
    setBusy(true); setAlert(null)
    try {
      await superAdmin.createAdmin({
        name:          createForm.name,
        email:         createForm.email,
        phone:         createForm.phone || undefined,
        password:      createForm.password,
        bhojanshalaId: createForm.bhojanshalaId || undefined,
      })
      setAlert({ type: 'success', msg: `Admin account created for ${createForm.name}.` })
      setCreateForm(EMPTY_CREATE)
      load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  function openEdit(admin) {
    setEditForm({
      name:          admin.name,
      phone:         admin.phone || '',
      bhojanshalaId: admin.bhojanshalaId || '',
      isActive:      admin.isActive,
      password:      '',
    })
    setTarget(admin)
    setModal('edit')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setBusy(true); setAlert(null)
    try {
      const body = {
        name:          editForm.name,
        phone:         editForm.phone || null,
        bhojanshalaId: editForm.bhojanshalaId || null,
        isActive:      editForm.isActive,
      }
      if (editForm.password) body.password = editForm.password
      await superAdmin.updateAdmin(target.id, body)
      setModal(null); load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(admin) {
    try {
      await superAdmin.updateAdmin(admin.id, { isActive: !admin.isActive })
      load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  async function handleDelete(admin) {
    try {
      await superAdmin.deleteAdmin(admin.id)
      setModal(null); load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    }
  }

  const filtered = admins.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.bhojanshala?.nameEnglish?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Admin Users</h2>
        <button className="a-btn a-btn-primary" onClick={() => { setAlert(null); setModal('create') }}>
          + Create Admin
        </button>
      </div>

      {alert && <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>}

      <div className="a-search-row">
        <div className="a-search-wrap">
          <span className="a-search-icon">🔍</span>
          <input className="a-input" placeholder="Search by name or bhojanshala…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-icon">👥</div>
            <p>No admins yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr><th>Admin</th><th>Phone</th><th>Bhojanshala</th><th>Status</th><th>Since</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div className="a-cell-main">{admin.name}</div>
                      <div className="a-cell-sub" style={{ color: '#94a3b8', fontSize: 11 }}>{admin.email}</div>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{admin.phone || '—'}</td>
                    <td>
                      {admin.bhojanshala
                        ? <>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{admin.bhojanshala.nameEnglish}</div>
                            <div className="a-cell-sub">{admin.bhojanshala.cityEnglish}</div>
                          </>
                        : <span className="a-badge a-badge-yellow">Unassigned</span>}
                    </td>
                    <td>
                      <span className={`a-badge ${admin.isActive ? 'a-badge-green' : 'a-badge-red'}`}>
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="a-actions">
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => openEdit(admin)}>Edit</button>
                        <button
                          className={`a-btn a-btn-xs ${admin.isActive ? 'a-btn-warning' : 'a-btn-success'}`}
                          onClick={() => handleToggle(admin)}>
                          {admin.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button className="a-btn a-btn-danger a-btn-xs"
                          onClick={() => { setTarget(admin); setModal('delete') }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {modal === 'create' && (
        <Modal
          title="Create Admin Account"
          onClose={() => setModal(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleCreate} disabled={busy}>
              {busy ? 'Creating…' : 'Create Account'}
            </button>
          </>}
        >
          {alert && <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>}
          <form onSubmit={handleCreate}>
            <div className="a-form-grid">
              <div className="a-field">
                <label className="a-label">Full Name <span className="req">*</span></label>
                <input className="a-input" value={createForm.name} required
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Rajesh Shah" />
              </div>
              <div className="a-field">
                <label className="a-label">Phone</label>
                <input className="a-input" value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Email <span className="req">*</span></label>
                <input className="a-input" type="email" value={createForm.email} required
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" />
              </div>
              <div className="a-field">
                <label className="a-label">Password <span className="req">*</span></label>
                <input className="a-input" type="password" value={createForm.password} required minLength={6}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" />
              </div>
              <div className="a-field">
                <label className="a-label">Assign Bhojanshala</label>
                <select className="a-select" value={createForm.bhojanshalaId}
                  onChange={e => setCreateForm(f => ({ ...f, bhojanshalaId: e.target.value }))}>
                  <option value="">— No assignment yet —</option>
                  {bhojList.map(b => (
                    <option key={b.id} value={b.id}>{b.nameEnglish} ({b.cityEnglish})</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && target && (
        <Modal
          title={`Edit Admin — ${target.name}`}
          onClose={() => setModal(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleEdit} disabled={busy}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          {alert && <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>}
          <form onSubmit={handleEdit}>
            <div className="a-form-grid">
              <div className="a-field">
                <label className="a-label">Full Name <span className="req">*</span></label>
                <input className="a-input" value={editForm.name} required
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="a-field">
                <label className="a-label">Phone</label>
                <input className="a-input" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Assigned Bhojanshala</label>
                <select className="a-select" value={editForm.bhojanshalaId}
                  onChange={e => setEditForm(f => ({ ...f, bhojanshalaId: e.target.value }))}>
                  <option value="">— No assignment —</option>
                  {bhojList.map(b => (
                    <option key={b.id} value={b.id}>{b.nameEnglish} ({b.cityEnglish})</option>
                  ))}
                </select>
              </div>
              <div className="a-field">
                <label className="a-label">Account Status</label>
                <select className="a-select" value={editForm.isActive ? 'active' : 'disabled'}
                  onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'active' }))}>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="a-field">
                <label className="a-label">New Password <span style={{ fontSize: 11, color: '#94a3b8' }}>(leave blank to keep current)</span></label>
                <input className="a-input" type="password" value={editForm.password} minLength={6}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="New password" />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && target && (
        <Modal
          title="Delete Admin"
          onClose={() => setModal(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="a-btn a-btn-danger" onClick={() => handleDelete(target)}>Yes, Delete Account</button>
          </>}
        >
          <div className="a-confirm">
            <p>Delete <strong>{target.name}</strong>'s account? They will lose access immediately.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
