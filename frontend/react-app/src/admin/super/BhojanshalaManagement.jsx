import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../auth/AuthContext'

const FACILITIES = ['parking','water','washroom','dharamshala','temple','family','wheelchair']
const EMPTY_FORM = {
  id: '', name_en: '', name_gu: '', area_en: '', area_gu: '',
  city_en: '', city_gu: '', address_en: '', address_gu: '',
  phone: '', facilities: [], tiffin_available: false, tiffin_mode: 'own',
  tiffin_notes: '', enabled: true,
  base_bs: 420, base_be: 510, base_bp: 0,
  base_ls: 660, base_le: 810, base_lp: 40,
  base_ds: 1080, base_de: 1200, base_dp: 40,
}

function minsToHHMM(m) {
  const h  = Math.floor(m / 60).toString().padStart(2, '0')
  const mm = (m % 60).toString().padStart(2, '0')
  return `${h}:${mm}`
}
function HHMMToMins(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="a-modal-bg" onClick={onClose}>
      <div className="a-modal" onClick={e => e.stopPropagation()}>
        <div className="a-modal-head">
          <h2 className="a-modal-title">{title}</h2>
          <button className="a-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="a-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {children}
        </div>
        {footer && <div className="a-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

function BhojForm({ form, setForm }) {
  const toggle = (key) => {
    const next = form.facilities.includes(key)
      ? form.facilities.filter(f => f !== key)
      : [...form.facilities, key]
    setForm(f => ({ ...f, facilities: next }))
  }

  return (
    <div>
      <p className="a-section-title">Basic Info</p>
      <div className="a-form-grid">
        <div className="a-field">
          <label className="a-label">English Name <span className="req">*</span></label>
          <input className="a-input" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Shri Adinath Bhojanshala" required />
        </div>
        <div className="a-field">
          <label className="a-label">Gujarati Name <span className="req">*</span></label>
          <input className="a-input" value={form.name_gu} onChange={e => setForm(f => ({ ...f, name_gu: e.target.value }))} placeholder="શ્રી આદિનાથ ભોજનશાળા" required />
        </div>
        <div className="a-field">
          <label className="a-label">City (English) <span className="req">*</span></label>
          <input className="a-input" value={form.city_en} onChange={e => setForm(f => ({ ...f, city_en: e.target.value }))} placeholder="Ahmedabad" required />
        </div>
        <div className="a-field">
          <label className="a-label">City (Gujarati)</label>
          <input className="a-input" value={form.city_gu} onChange={e => setForm(f => ({ ...f, city_gu: e.target.value }))} placeholder="અમદાવાદ" />
        </div>
        <div className="a-field">
          <label className="a-label">Area (English)</label>
          <input className="a-input" value={form.area_en} onChange={e => setForm(f => ({ ...f, area_en: e.target.value }))} placeholder="Paldi" />
        </div>
        <div className="a-field">
          <label className="a-label">Area (Gujarati)</label>
          <input className="a-input" value={form.area_gu} onChange={e => setForm(f => ({ ...f, area_gu: e.target.value }))} placeholder="પાલડી" />
        </div>
        <div className="a-field" style={{ gridColumn: '1 / -1' }}>
          <label className="a-label">Address (English)</label>
          <input className="a-input" value={form.address_en} onChange={e => setForm(f => ({ ...f, address_en: e.target.value }))} placeholder="Full address" />
        </div>
        <div className="a-field">
          <label className="a-label">Phone</label>
          <input className="a-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
        </div>
        <div className="a-field">
          <label className="a-label">Slug ID <span className="req">*</span></label>
          <input className="a-input" value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="shri-adinath" required
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <div className="a-hint">Unique ID (lowercase, no spaces). Cannot be changed later.</div>
        </div>
      </div>

      <p className="a-section-title" style={{ marginTop: 18 }}>Facilities</p>
      <div className="a-check-grid">
        {FACILITIES.map(f => (
          <label key={f} className={`a-check-chip ${form.facilities.includes(f) ? 'selected' : ''}`}>
            <input type="checkbox" checked={form.facilities.includes(f)} onChange={() => toggle(f)} />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </label>
        ))}
      </div>

      <p className="a-section-title" style={{ marginTop: 18 }}>Tiffin Service</p>
      <div className="a-row" style={{ marginBottom: 10 }}>
        <label className="a-toggle-wrap">
          <span className="a-toggle">
            <input type="checkbox" checked={form.tiffin_available} onChange={e => setForm(f => ({ ...f, tiffin_available: e.target.checked }))} />
            <span className="a-toggle-track" />
            <span className="a-toggle-thumb" />
          </span>
          <span className="a-toggle-label">Tiffin Available</span>
        </label>
      </div>
      {form.tiffin_available && (
        <div className="a-form-grid">
          <div className="a-field">
            <label className="a-label">Mode</label>
            <select className="a-select" value={form.tiffin_mode} onChange={e => setForm(f => ({ ...f, tiffin_mode: e.target.value }))}>
              <option value="own">Bring Your Own Tiffin</option>
              <option value="provided">Container Provided</option>
            </select>
          </div>
          <div className="a-field">
            <label className="a-label">Notes</label>
            <input className="a-input" value={form.tiffin_notes} onChange={e => setForm(f => ({ ...f, tiffin_notes: e.target.value }))} placeholder="Extra charges, etc." />
          </div>
        </div>
      )}

      <p className="a-section-title" style={{ marginTop: 18 }}>Base Meal Times</p>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        These are the default times. Admins can override per day in the Meal Editor.
      </div>

      {[
        { label: 'Breakfast', start: 'base_bs', end: 'base_be', price: 'base_bp' },
        { label: 'Lunch',     start: 'base_ls', end: 'base_le', price: 'base_lp' },
        { label: 'Dinner',    start: 'base_ds', end: 'base_de', price: 'base_dp' },
      ].map(meal => (
        <div key={meal.label} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{meal.label}</div>
          <div className="a-form-grid" style={{ gridTemplateColumns: '1fr 1fr 120px' }}>
            <div className="a-field">
              <label className="a-label">Start</label>
              <input type="time" className="a-input" value={minsToHHMM(form[meal.start])}
                onChange={e => setForm(f => ({ ...f, [meal.start]: HHMMToMins(e.target.value) }))} />
            </div>
            <div className="a-field">
              <label className="a-label">End</label>
              <input type="time" className="a-input" value={minsToHHMM(form[meal.end])}
                onChange={e => setForm(f => ({ ...f, [meal.end]: HHMMToMins(e.target.value) }))} />
            </div>
            <div className="a-field">
              <label className="a-label">Price (₹)</label>
              <input type="number" className="a-input" min="0" value={form[meal.price]}
                onChange={e => setForm(f => ({ ...f, [meal.price]: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>
      ))}

      <div className="a-row" style={{ marginTop: 8 }}>
        <label className="a-toggle-wrap">
          <span className="a-toggle">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            <span className="a-toggle-track" />
            <span className="a-toggle-thumb" />
          </span>
          <span className="a-toggle-label">Visible on public website</span>
        </label>
      </div>
    </div>
  )
}

function AssignAdminModal({ bhoj, admins, onClose, onAssigned }) {
  const { profile } = useAuth()
  const [selectedAdmin, setSelectedAdmin] = useState(bhoj.assigned_admin_id || '')
  const [busy, setBusy] = useState(false)

  const handleAssign = async () => {
    setBusy(true)
    // Remove bhojanshala from previous admin
    await supabase.from('profiles')
      .update({ bhojanshala_id: null })
      .eq('bhojanshala_id', bhoj.id)

    if (selectedAdmin) {
      await supabase.from('profiles')
        .update({ bhojanshala_id: bhoj.id })
        .eq('id', selectedAdmin)
    }

    await supabase.from('activity_logs').insert({
      admin_id: profile.id,
      bhojanshala_id: bhoj.id,
      action: selectedAdmin ? 'Assigned Admin' : 'Removed Admin',
      details: { bhojanshala_name: bhoj.name_en, admin_id: selectedAdmin }
    })

    setBusy(false)
    onAssigned()
    onClose()
  }

  return (
    <Modal
      title={`Assign Admin — ${bhoj.name_en}`}
      onClose={onClose}
      footer={<>
        <button className="a-btn a-btn-secondary" onClick={onClose}>Cancel</button>
        <button className="a-btn a-btn-primary" onClick={handleAssign} disabled={busy}>
          {busy ? 'Saving…' : 'Save Assignment'}
        </button>
      </>}
    >
      <div className="a-field">
        <label className="a-label">Select Admin</label>
        <select className="a-select" value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}>
          <option value="">— No admin assigned —</option>
          {admins.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} {a.bhojanshala_id && a.bhojanshala_id !== bhoj.id ? `(assigned: ${a.bhojanshala_id})` : ''}
            </option>
          ))}
        </select>
        <div className="a-hint">One admin can only manage one bhojanshala. Selecting an admin already assigned elsewhere will reassign them here.</div>
      </div>
    </Modal>
  )
}

export default function BhojanshalaManagement({ navigate, payload }) {
  const { profile }  = useAuth()
  const [bhojList,   setBhojList]   = useState([])
  const [admins,     setAdmins]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modalMode,  setModalMode]  = useState(null)  // 'create' | 'edit'
  const [editBhoj,   setEditBhoj]   = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [assignBhoj, setAssignBhoj] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [busy,       setBusy]       = useState(false)
  const [alert,      setAlert]      = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: bhoj }, { data: adminProfiles }] = await Promise.all([
      supabase.from('bhojanshalas').select('*').order('name_en'),
      supabase.from('profiles').select('*').eq('role', 'admin'),
    ])

    // Attach assigned admin to each bhojanshala
    const adminMap = {}
    ;(adminProfiles || []).forEach(a => { if (a.bhojanshala_id) adminMap[a.bhojanshala_id] = a })
    const enriched = (bhoj || []).map(b => ({
      ...b,
      assigned_admin_id:   adminMap[b.id]?.id   || null,
      assigned_admin_name: adminMap[b.id]?.name || null,
    }))

    setBhojList(enriched)
    setAdmins(adminProfiles || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    if (payload?.action === 'create') openCreate()
  }, [])

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setEditBhoj(null)
    setModalMode('create')
  }

  function openEdit(b) {
    setForm({
      id: b.id, name_en: b.name_en, name_gu: b.name_gu,
      area_en: b.area_en || '', area_gu: b.area_gu || '',
      city_en: b.city_en, city_gu: b.city_gu,
      address_en: b.address_en || '', address_gu: b.address_gu || '',
      phone: b.phone || '',
      facilities: b.facilities || [],
      tiffin_available: b.tiffin_available || false,
      tiffin_mode: b.tiffin_mode || 'own',
      tiffin_notes: b.tiffin_notes || '',
      enabled: b.enabled !== false,
      base_bs: b.base_bs, base_be: b.base_be, base_bp: b.base_bp,
      base_ls: b.base_ls, base_le: b.base_le, base_lp: b.base_lp,
      base_ds: b.base_ds, base_de: b.base_de, base_dp: b.base_dp,
    })
    setEditBhoj(b)
    setModalMode('edit')
  }

  async function handleSave() {
    if (!form.name_en || !form.city_en || !form.id) {
      setAlert({ type: 'error', msg: 'Name (English), City (English) and Slug ID are required.' })
      return
    }
    setBusy(true)
    setAlert(null)

    const payload = { ...form }
    delete payload.assigned_admin_id
    delete payload.assigned_admin_name

    let error
    if (modalMode === 'create') {
      const res = await supabase.from('bhojanshalas').insert(payload)
      error = res.error
    } else {
      const { id, ...rest } = payload
      const res = await supabase.from('bhojanshalas').update(rest).eq('id', id)
      error = res.error
    }

    if (error) {
      setAlert({ type: 'error', msg: error.message })
      setBusy(false)
      return
    }

    await supabase.from('activity_logs').insert({
      admin_id: profile.id,
      bhojanshala_id: form.id,
      action: modalMode === 'create' ? 'Created Bhojanshala' : 'Updated Bhojanshala',
      details: { bhojanshala_name: form.name_en }
    })

    setModalMode(null)
    setBusy(false)
    loadData()
  }

  async function handleToggleEnabled(b) {
    await supabase.from('bhojanshalas').update({ enabled: !b.enabled }).eq('id', b.id)
    await supabase.from('activity_logs').insert({
      admin_id: profile.id, bhojanshala_id: b.id,
      action: b.enabled ? 'Disabled Bhojanshala' : 'Enabled Bhojanshala',
      details: { bhojanshala_name: b.name_en }
    })
    loadData()
  }

  async function handleDelete(b) {
    await supabase.from('bhojanshalas').delete().eq('id', b.id)
    await supabase.from('activity_logs').insert({
      admin_id: profile.id,
      bhojanshala_id: null,
      action: 'Deleted Bhojanshala',
      details: { bhojanshala_name: b.name_en, bhojanshala_id: b.id }
    })
    setConfirmDel(null)
    loadData()
  }

  const filtered = bhojList.filter(b =>
    !search ||
    b.name_en.toLowerCase().includes(search.toLowerCase()) ||
    b.city_en.toLowerCase().includes(search.toLowerCase()) ||
    b.name_gu?.includes(search)
  )

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Bhojanshalas</h2>
        <button className="a-btn a-btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      {alert && (
        <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>
      )}

      <div className="a-search-row">
        <div className="a-search-wrap">
          <span className="a-search-icon">🔍</span>
          <input
            className="a-input" placeholder="Search by name or city…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-icon">🏛</div>
            <p>No bhojanshalas found</p>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="a-cell-main">{b.name_en}</div>
                      <div className="a-cell-sub">{b.name_gu}</div>
                    </td>
                    <td>{b.city_en}</td>
                    <td>
                      {b.assigned_admin_name
                        ? <span className="a-badge a-badge-blue">{b.assigned_admin_name}</span>
                        : <span className="a-badge a-badge-gray">Unassigned</span>
                      }
                    </td>
                    <td>
                      <span className={`a-badge ${b.enabled ? 'a-badge-green' : 'a-badge-red'}`}>
                        {b.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(b.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <div className="a-actions">
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => openEdit(b)}>Edit</button>
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => setAssignBhoj(b)}>Assign Admin</button>
                        <button className="a-btn a-btn-xs" style={b.enabled
                          ? { background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' }
                          : { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
                          onClick={() => handleToggleEnabled(b)}
                        >
                          {b.enabled ? 'Disable' : 'Enable'}
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

      {/* Create / Edit Modal */}
      {modalMode && (
        <Modal
          title={modalMode === 'create' ? 'Add New Bhojanshala' : `Edit — ${editBhoj?.name_en}`}
          onClose={() => setModalMode(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving…' : modalMode === 'create' ? 'Create Bhojanshala' : 'Save Changes'}
            </button>
          </>}
        >
          <BhojForm form={form} setForm={setForm} isNew={modalMode === 'create'} />
        </Modal>
      )}

      {/* Assign Admin Modal */}
      {assignBhoj && (
        <AssignAdminModal
          bhoj={assignBhoj}
          admins={admins}
          onClose={() => setAssignBhoj(null)}
          onAssigned={loadData}
        />
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <Modal
          title="Delete Bhojanshala"
          onClose={() => setConfirmDel(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
            <button className="a-btn a-btn-danger" onClick={() => handleDelete(confirmDel)}>Yes, Delete</button>
          </>}
        >
          <div className="a-confirm">
            <p>
              Are you sure you want to delete <strong>{confirmDel.name_en}</strong>?<br />
              This will also delete all meal data and activity logs for this bhojanshala. This cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
