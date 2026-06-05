import { useEffect, useState, useCallback } from 'react'
import { superAdmin } from '../../lib/api'

const EMPTY_FORM = {
  nameEnglish: '', nameGujarati: '', areaEnglish: '', areaGujarati: '',
  cityEnglish: '', cityGujarati: '', addressEnglish: '', addressGujarati: '',
  phone: '', description: '',
  tiffinAvailable: false, tiffinType: 'OWN', tiffinNotes: '',
  dharamshalaAvailable: false, parking: false, washroom: false,
  drinkingWater: false, templeNearby: false, familyFriendly: true,
  wheelchairAccessible: false, isActive: true,
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="a-modal-bg" onClick={onClose}>
      <div className="a-modal" onClick={e => e.stopPropagation()}>
        <div className="a-modal-head">
          <h2 className="a-modal-title">{title}</h2>
          <button className="a-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="a-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>{children}</div>
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

function BhojForm({ form, setForm }) {
  const f = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }))
  const inp = (key, ...rest) => (
    <input className="a-input" value={form[key]}
      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} {...rest} />
  )
  return (
    <div>
      <p className="a-section-title">Basic Info</p>
      <div className="a-form-grid">
        <div className="a-field">
          <label className="a-label">English Name <span className="req">*</span></label>
          {inp('nameEnglish', { placeholder: 'Shri Adinath Bhojanshala', required: true })}
        </div>
        <div className="a-field">
          <label className="a-label">Gujarati Name <span className="req">*</span></label>
          {inp('nameGujarati', { placeholder: 'શ્રી આદિનાથ ભોજનશાળા', required: true })}
        </div>
        <div className="a-field">
          <label className="a-label">City (English) <span className="req">*</span></label>
          {inp('cityEnglish', { placeholder: 'Ahmedabad', required: true })}
        </div>
        <div className="a-field">
          <label className="a-label">City (Gujarati)</label>
          {inp('cityGujarati', { placeholder: 'અમદાવાદ' })}
        </div>
        <div className="a-field">
          <label className="a-label">Area (English)</label>
          {inp('areaEnglish', { placeholder: 'Paldi' })}
        </div>
        <div className="a-field">
          <label className="a-label">Area (Gujarati)</label>
          {inp('areaGujarati', { placeholder: 'પાલડી' })}
        </div>
        <div className="a-field" style={{ gridColumn: '1 / -1' }}>
          <label className="a-label">Address (English)</label>
          {inp('addressEnglish', { placeholder: 'Full address' })}
        </div>
        <div className="a-field">
          <label className="a-label">Phone</label>
          {inp('phone', { placeholder: '+91 98765 43210' })}
        </div>
        <div className="a-field">
          <label className="a-label">Description</label>
          {inp('description', { placeholder: 'Short description' })}
        </div>
      </div>

      <p className="a-section-title" style={{ marginTop: 18 }}>Facilities</p>
      <div className="a-check-grid">
        {[
          ['parking',              'Parking'],
          ['drinkingWater',        'Drinking Water'],
          ['washroom',             'Washroom'],
          ['dharamshalaAvailable', 'Dharamshala'],
          ['templeNearby',         'Temple Nearby'],
          ['familyFriendly',       'Family Friendly'],
          ['wheelchairAccessible', 'Wheelchair'],
        ].map(([key, label]) => (
          <label key={key} className={`a-check-chip ${form[key] ? 'selected' : ''}`}>
            <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
            {label}
          </label>
        ))}
      </div>

      <p className="a-section-title" style={{ marginTop: 18 }}>Tiffin Service</p>
      <div className="a-row" style={{ marginBottom: 10 }}>
        <Toggle checked={form.tiffinAvailable} onChange={f('tiffinAvailable')} label="Tiffin Available" />
      </div>
      {form.tiffinAvailable && (
        <div className="a-form-grid">
          <div className="a-field">
            <label className="a-label">Type</label>
            <select className="a-select" value={form.tiffinType} onChange={e => setForm(p => ({ ...p, tiffinType: e.target.value }))}>
              <option value="OWN">Bring Your Own Tiffin</option>
              <option value="PROVIDED">Container Provided</option>
            </select>
          </div>
          <div className="a-field">
            <label className="a-label">Notes</label>
            {inp('tiffinNotes', { placeholder: 'Extra charges, etc.' })}
          </div>
        </div>
      )}

      <div className="a-row" style={{ marginTop: 14 }}>
        <Toggle checked={form.isActive} onChange={f('isActive')} label="Visible on public website" />
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
      <div className="a-field">
        <label className="a-label">Select Admin</label>
        <select className="a-select" value={selectedAdmin} onChange={e => setSelectedAdmin(e.target.value)}>
          <option value="">— No admin assigned —</option>
          {admins.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} {a.bhojanshalaId && a.bhojanshalaId !== bhoj.id ? `(currently assigned elsewhere)` : ''}
            </option>
          ))}
        </select>
        <div className="a-hint">One admin manages one bhojanshala. Reassigning will unassign them from their current one.</div>
      </div>
    </Modal>
  )
}

export default function BhojanshalaManagement({ navigate, payload }) {
  const [bhojList,   setBhojList]   = useState([])
  const [admins,     setAdmins]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modalMode,  setModalMode]  = useState(null)
  const [editBhoj,   setEditBhoj]   = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
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
    setForm({ ...EMPTY_FORM })
    setEditBhoj(null)
    setModalMode('create')
  }

  function openEdit(b) {
    setForm({
      nameEnglish:          b.nameEnglish,
      nameGujarati:         b.nameGujarati,
      areaEnglish:          b.areaEnglish  || '',
      areaGujarati:         b.areaGujarati || '',
      cityEnglish:          b.cityEnglish,
      cityGujarati:         b.cityGujarati || '',
      addressEnglish:       b.addressEnglish  || '',
      addressGujarati:      b.addressGujarati || '',
      phone:                b.phone       || '',
      description:          b.description || '',
      tiffinAvailable:      b.tiffin?.available     ?? false,
      tiffinType:           b.tiffin?.type          ?? 'OWN',
      tiffinNotes:          b.tiffin?.notes         ?? '',
      dharamshalaAvailable: b.facilities?.dharamshalaAvailable ?? false,
      parking:              b.facilities?.parking              ?? false,
      washroom:             b.facilities?.washroom             ?? false,
      drinkingWater:        b.facilities?.drinkingWater        ?? false,
      templeNearby:         b.facilities?.templeNearby         ?? false,
      familyFriendly:       b.facilities?.familyFriendly       ?? true,
      wheelchairAccessible: b.facilities?.wheelchairAccessible ?? false,
      isActive:             b.isActive,
    })
    setEditBhoj(b)
    setModalMode('edit')
  }

  async function handleSave() {
    if (!form.nameEnglish || !form.nameGujarati || !form.cityEnglish) {
      setAlert({ type: 'error', msg: 'Name (English + Gujarati) and City are required.' })
      return
    }
    setBusy(true); setAlert(null)
    try {
      if (modalMode === 'create') {
        await superAdmin.createBhojanshala(form)
      } else {
        await superAdmin.updateBhojanshala(editBhoj.id, form)
      }
      setModalMode(null)
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
    b.nameGujarati?.includes(search)
  )

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Bhojanshalas</h2>
        <button className="a-btn a-btn-primary" onClick={openCreate}>+ Add New</button>
      </div>

      {alert && <div className={`a-alert a-alert-${alert.type}`}>{alert.msg}</div>}

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
                <tr><th>Name</th><th>City</th><th>Admin</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
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
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => openEdit(b)}>Edit</button>
                        <button className="a-btn a-btn-secondary a-btn-xs" onClick={() => setAssignBhoj(b)}>Assign Admin</button>
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

      {modalMode && (
        <Modal
          title={modalMode === 'create' ? 'Add New Bhojanshala' : `Edit — ${editBhoj?.nameEnglish}`}
          onClose={() => setModalMode(null)}
          footer={<>
            <button className="a-btn a-btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving…' : modalMode === 'create' ? 'Create Bhojanshala' : 'Save Changes'}
            </button>
          </>}
        >
          <BhojForm form={form} setForm={setForm} />
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
          <div className="a-confirm">
            <p>Delete <strong>{confirmDel.nameEnglish}</strong>? This will remove all meal data and logs. Cannot be undone.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
