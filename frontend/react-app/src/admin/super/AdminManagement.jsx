import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../auth/AuthContext'

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

export default function AdminManagement({ navigate, payload }) {
  const { profile } = useAuth()

  const [admins,    setAdmins]    = useState([])
  const [bhojList,  setBhojList]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(null) // 'invite' | 'edit' | 'reset' | 'delete'
  const [target,    setTarget]    = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [alert,     setAlert]     = useState(null)

  // Invite form
  const [invForm, setInvForm] = useState({ name: '', email: '', phone: '', bhojanshala_id: '' })

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', phone: '', bhojanshala_id: '', status: 'active' })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: adminRows }, { data: bhoj }] = await Promise.all([
      supabase.from('profiles').select('*, bhojanshalas(name_en, city_en)').eq('role', 'admin').order('created_at'),
      supabase.from('bhojanshalas').select('id, name_en, city_en').eq('enabled', true).order('name_en'),
    ])
    setAdmins(adminRows || [])
    setBhojList(bhoj || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    if (payload?.action === 'create') setModal('invite')
  }, [])

  // ---- Invite new admin ----
  async function handleInvite(e) {
    e.preventDefault()
    if (!invForm.name || !invForm.email) {
      setAlert({ type: 'error', msg: 'Name and email are required.' })
      return
    }
    setBusy(true); setAlert(null)

    // Check if email already in pending or profiles
    const { data: existing } = await supabase
      .from('pending_admins').select('id').eq('email', invForm.email).single()
    if (existing) {
      setAlert({ type: 'error', msg: 'This email already has a pending invitation.' })
      setBusy(false); return
    }

    const { error } = await supabase.from('pending_admins').insert({
      email:          invForm.email,
      name:           invForm.name,
      phone:          invForm.phone,
      bhojanshala_id: invForm.bhojanshala_id || null,
      created_by:     profile.id,
    })

    if (error) {
      setAlert({ type: 'error', msg: error.message })
      setBusy(false); return
    }

    await supabase.from('activity_logs').insert({
      admin_id:       profile.id,
      bhojanshala_id: invForm.bhojanshala_id || null,
      action:         'Invited Admin',
      details:        { admin_email: invForm.email, admin_name: invForm.name, bhojanshala_name: bhojList.find(b => b.id === invForm.bhojanshala_id)?.name_en || '' }
    })

    setAlert({
      type: 'success',
      msg: `Invitation prepared for ${invForm.name} (${invForm.email}). They must go to the Admin Portal and register with this email.`
    })
    setInvForm({ name: '', email: '', phone: '', bhojanshala_id: '' })
    setBusy(false)
    load()
  }

  // ---- Edit admin ----
  function openEdit(admin) {
    setEditForm({
      name:           admin.name,
      phone:          admin.phone || '',
      bhojanshala_id: admin.bhojanshala_id || '',
      status:         admin.status,
    })
    setTarget(admin)
    setModal('edit')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setBusy(true); setAlert(null)

    // If changing bhojanshala assignment, unassign old one
    if (editForm.bhojanshala_id !== target.bhojanshala_id) {
      if (editForm.bhojanshala_id) {
        // Remove any other admin currently assigned to new bhojanshala
        await supabase.from('profiles')
          .update({ bhojanshala_id: null })
          .eq('bhojanshala_id', editForm.bhojanshala_id)
          .neq('id', target.id)
      }
    }

    const { error } = await supabase.from('profiles').update({
      name:           editForm.name,
      phone:          editForm.phone,
      bhojanshala_id: editForm.bhojanshala_id || null,
      status:         editForm.status,
    }).eq('id', target.id)

    if (error) {
      setAlert({ type: 'error', msg: error.message })
      setBusy(false); return
    }

    await supabase.from('activity_logs').insert({
      admin_id:       profile.id,
      bhojanshala_id: editForm.bhojanshala_id || null,
      action:         'Updated Admin',
      details:        { admin_name: editForm.name, bhojanshala_name: bhojList.find(b => b.id === editForm.bhojanshala_id)?.name_en || '' }
    })

    setModal(null); setBusy(false); load()
  }

  // ---- Toggle status ----
  async function handleToggleStatus(admin) {
    const next = admin.status === 'active' ? 'disabled' : 'active'
    await supabase.from('profiles').update({ status: next }).eq('id', admin.id)
    await supabase.from('activity_logs').insert({
      admin_id: profile.id,
      bhojanshala_id: admin.bhojanshala_id,
      action: next === 'active' ? 'Enabled Admin Account' : 'Disabled Admin Account',
      details: { admin_name: admin.name, bhojanshala_name: admin.bhojanshalas?.name_en || '' }
    })
    load()
  }

  // ---- Reset password ----
  async function handleResetPassword(admin) {
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(admin.email || '')
    if (error) {
      setAlert({ type: 'error', msg: 'Could not send reset email: ' + error.message })
    } else {
      setAlert({ type: 'success', msg: `Password reset email sent to ${admin.name}.` })
      await supabase.from('activity_logs').insert({
        admin_id: profile.id,
        bhojanshala_id: admin.bhojanshala_id,
        action: 'Reset Admin Password',
        details: { admin_name: admin.name }
      })
    }
    setBusy(false); setModal(null)
  }

  // ---- Delete admin ----
  async function handleDelete(admin) {
    // Delete profile (auth user cascade will handle auth.users)
    await supabase.from('profiles').delete().eq('id', admin.id)
    await supabase.from('activity_logs').insert({
      admin_id: profile.id,
      bhojanshala_id: null,
      action: 'Deleted Admin Account',
      details: { admin_name: admin.name }
    })
    setModal(null); load()
  }

  const filtered = admins.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.bhojanshalas?.name_en?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Admin Users</h2>
        <button className="a-btn a-btn-primary" onClick={() => { setAlert(null); setModal('invite') }}>
          + Invite Admin
        </button>
      </div>

      {alert && (
        <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>
      )}

      <div className="a-search-row">
        <div className="a-search-wrap">
          <span className="a-search-icon">🔍</span>
          <input
            className="a-input" placeholder="Search by name or bhojanshala…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-icon">👥</div>
            <p>No admins yet. Invite one to get started.</p>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Phone</th>
                  <th>Bhojanshala</th>
                  <th>Status</th>
                  <th>Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div className="a-cell-main">{admin.name}</div>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{admin.phone || '—'}</td>
                    <td>
                      {admin.bhojanshalas
                        ? <>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{admin.bhojanshalas.name_en}</div>
                            <div className="a-cell-sub">{admin.bhojanshalas.city_en}</div>
                          </>
                        : <span className="a-badge a-badge-yellow">Unassigned</span>
                      }
                    </td>
                    <td>
                      <span className={`a-badge ${admin.status === 'active' ? 'a-badge-green' : 'a-badge-red'}`}>
                        {admin.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(admin.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="a-actions">
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => openEdit(admin)}>Edit</button>
                        <button
                          className={`a-btn a-btn-xs ${admin.status === 'active'
                            ? 'a-btn-warning'
                            : 'a-btn-success'}`}
                          onClick={() => handleToggleStatus(admin)}
                        >
                          {admin.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => { setTarget(admin); setModal('reset') }}>
                          Reset PW
                        </button>
                        <button className="a-btn a-btn-danger a-btn-xs" onClick={() => { setTarget(admin); setModal('delete') }}>
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

      {/* ---- Invite Modal ---- */}
      {modal === 'invite' && (
        <Modal
          title="Invite New Admin"
          onClose={() => setModal(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleInvite} disabled={busy}>
              {busy ? 'Sending…' : 'Send Invitation'}
            </button>
          </>}
        >
          <div className="a-alert a-alert-info" style={{ marginBottom: 14 }}>
            The new admin must register themselves at the Admin Portal using this exact email address. They will automatically receive the correct role and bhojanshala assignment.
          </div>
          {alert && <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>}
          <form onSubmit={handleInvite}>
            <div className="a-form-grid">
              <div className="a-field">
                <label className="a-label">Full Name <span className="req">*</span></label>
                <input className="a-input" value={invForm.name} onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} placeholder="Rajesh Shah" required />
              </div>
              <div className="a-field">
                <label className="a-label">Phone</label>
                <input className="a-input" value={invForm.phone} onChange={e => setInvForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Email <span className="req">*</span></label>
                <input className="a-input" type="email" value={invForm.email} onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" required />
              </div>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Assign Bhojanshala <span className="req">*</span></label>
                <select className="a-select" value={invForm.bhojanshala_id} onChange={e => setInvForm(f => ({ ...f, bhojanshala_id: e.target.value }))}>
                  <option value="">— Select a bhojanshala —</option>
                  {bhojList.map(b => (
                    <option key={b.id} value={b.id}>{b.name_en} ({b.city_en})</option>
                  ))}
                </select>
                <div className="a-hint">Each admin manages exactly one bhojanshala. Required.</div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ---- Edit Modal ---- */}
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
          <form onSubmit={handleEdit}>
            <div className="a-form-grid">
              <div className="a-field">
                <label className="a-label">Full Name <span className="req">*</span></label>
                <input className="a-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="a-field">
                <label className="a-label">Phone</label>
                <input className="a-input" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="a-field" style={{ gridColumn: '1 / -1' }}>
                <label className="a-label">Assigned Bhojanshala</label>
                <select className="a-select" value={editForm.bhojanshala_id} onChange={e => setEditForm(f => ({ ...f, bhojanshala_id: e.target.value }))}>
                  <option value="">— No assignment —</option>
                  {bhojList.map(b => (
                    <option key={b.id} value={b.id}>{b.name_en} ({b.city_en})</option>
                  ))}
                </select>
              </div>
              <div className="a-field">
                <label className="a-label">Account Status</label>
                <select className="a-select" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ---- Reset Password Confirm ---- */}
      {modal === 'reset' && target && (
        <Modal
          title="Reset Password"
          onClose={() => setModal(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="a-btn a-btn-warning" onClick={() => handleResetPassword(target)} disabled={busy}>
              {busy ? 'Sending…' : 'Send Reset Email'}
            </button>
          </>}
        >
          <div className="a-confirm">
            <p>Send a password reset email to <strong>{target.name}</strong>?</p>
          </div>
        </Modal>
      )}

      {/* ---- Delete Confirm ---- */}
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
            <p>
              Are you sure you want to delete <strong>{target.name}</strong>'s account?<br />
              They will lose access immediately. Their bhojanshala will become unmanaged.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
