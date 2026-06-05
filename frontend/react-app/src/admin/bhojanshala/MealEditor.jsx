import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { adminApi } from '../../lib/api'
import { FOODS, SMART_FOODS } from '../../data/data'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Navkarshi 🌅', lunch: 'Lunch ☀️', dinner: 'Chovihar 🌙' }

const DEFAULT_TIMES = {
  breakfast: { startTime: '07:30', endTime: '09:30' },
  lunch:     { startTime: '11:30', endTime: '14:00' },
  dinner:    { startTime: '18:30', endTime: '21:00' },
}

function emptyMeal(type) {
  return {
    available: false,
    startTime: DEFAULT_TIMES[type].startTime,
    endTime:   DEFAULT_TIMES[type].endTime,
    price:     0,
    items:     [],
  }
}

function dayFromApi(apiDay) {
  return {
    date:          apiDay.date,
    isClosed:      apiDay.isClosed ?? false,
    specialNotice: apiDay.specialNotice ?? '',
    meals: {
      breakfast: mealFromApi(apiDay.meals?.breakfast, 'breakfast'),
      lunch:     mealFromApi(apiDay.meals?.lunch,     'lunch'),
      dinner:    mealFromApi(apiDay.meals?.dinner,    'dinner'),
    },
  }
}

function mealFromApi(m, type) {
  if (!m) return emptyMeal(type)
  return {
    available: m.available ?? false,
    startTime: m.startTime ?? DEFAULT_TIMES[type].startTime,
    endTime:   m.endTime   ?? DEFAULT_TIMES[type].endTime,
    price:     m.price     ?? 0,
    items:     m.items     ?? [],
  }
}

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
        background: checked ? '#7c3aed' : '#cbd5e1', transition: 'background .15s',
        position: 'relative',
      }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>}
    </label>
  )
}

function FoodPicker({ selected, onChange }) {
  const allKeys = [...SMART_FOODS, ...Object.keys(FOODS).filter(k => !SMART_FOODS.includes(k))]
  const toggle = (key) => {
    onChange(selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {allKeys.map(key => (
        <button key={key} type="button"
          onClick={() => toggle(key)}
          style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 12,
            border: selected.includes(key) ? '1.5px solid #7c3aed' : '1.5px solid #e2e8f0',
            background: selected.includes(key) ? '#ede9fe' : '#f8fafc',
            color: selected.includes(key) ? '#5b21b6' : '#475569',
            cursor: 'pointer', fontWeight: selected.includes(key) ? 600 : 400,
          }}>
          {FOODS[key].emoji} {FOODS[key].en}
        </button>
      ))}
    </div>
  )
}

function MealPanel({ type, meal, onChange }) {
  const set = (field, val) => onChange({ ...meal, [field]: val })
  return (
    <div style={{
      borderRadius: 10, border: '1px solid #e2e8f0', padding: 14,
      background: meal.available ? '#fafafe' : '#f8fafc',
      opacity: meal.available ? 1 : 0.65,
      transition: 'opacity .15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: meal.available ? 14 : 0 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{MEAL_LABELS[type]}</span>
        <Toggle checked={meal.available} onChange={v => set('available', v)} label={meal.available ? 'Open' : 'Closed'} />
      </div>
      {meal.available && <>
        <div className="a-form-grid" style={{ marginBottom: 12 }}>
          <div className="a-field">
            <label className="a-label">Start Time</label>
            <input className="a-input" type="time" value={meal.startTime}
              onChange={e => set('startTime', e.target.value)} />
          </div>
          <div className="a-field">
            <label className="a-label">End Time</label>
            <input className="a-input" type="time" value={meal.endTime}
              onChange={e => set('endTime', e.target.value)} />
          </div>
          <div className="a-field">
            <label className="a-label">Price (₹/person)</label>
            <input className="a-input" type="number" min={0} value={meal.price}
              onChange={e => set('price', parseInt(e.target.value, 10) || 0)} />
          </div>
        </div>
        <div className="a-field">
          <label className="a-label">Menu Items</label>
          <FoodPicker selected={meal.items} onChange={v => set('items', v)} />
        </div>
      </>}
    </div>
  )
}

export default function MealEditor({ navigate }) {
  const { user } = useAuth()
  const [timeline, setTimeline] = useState([])
  const [sel,      setSel]      = useState(0)
  const [draft,    setDraft]    = useState(null)
  const [bhoj,     setBhoj]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')

  const [noticeForm,    setNoticeForm]    = useState({ noticeEnglish: '', noticeGujarati: '' })
  const [noticeSaving,  setNoticeSaving]  = useState(false)
  const [noticeSaved,   setNoticeSaved]   = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [schedRes, bhojRes] = await Promise.all([
        adminApi.getSchedule(7),
        adminApi.getMyBhojanshala(),
      ])
      const days = (schedRes.data || []).map(dayFromApi)
      setTimeline(days)
      setDraft(days[0] || null)
      const b = bhojRes.data
      setBhoj(b)
      setNoticeForm({
        noticeEnglish:  b?.noticeEnglish  ?? '',
        noticeGujarati: b?.noticeGujarati ?? '',
      })
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  function selectDay(idx) {
    setSel(idx)
    setDraft(timeline[idx] || null)
    setSaved(false)
    setErr('')
  }

  function setMeal(type, meal) {
    setDraft(d => ({ ...d, meals: { ...d.meals, [type]: meal } }))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true); setErr(''); setSaved(false)
    try {
      await adminApi.updateSchedule({
        date:          draft.date,
        isClosed:      draft.isClosed,
        specialNotice: draft.specialNotice || null,
        meals: MEAL_TYPES.map(type => ({
          mealType:  type.toUpperCase(),
          available: draft.meals[type].available,
          startTime: draft.meals[type].startTime,
          endTime:   draft.meals[type].endTime,
          price:     draft.meals[type].price,
          items:     draft.meals[type].items,
        })),
      })
      const updated = [...timeline]
      updated[sel] = draft
      setTimeline(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotice() {
    setNoticeSaving(true); setNoticeSaved(false)
    try {
      await adminApi.updateMyBhojanshala({
        noticeEnglish:  noticeForm.noticeEnglish  || null,
        noticeGujarati: noticeForm.noticeGujarati || null,
      })
      setBhoj(b => ({ ...b, ...noticeForm }))
      setNoticeSaved(true)
      setTimeout(() => setNoticeSaved(false), 3000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setNoticeSaving(false)
    }
  }

  if (loading) return <div className="a-inline-loading"><div className="a-spinner" /></div>

  if (!bhoj) {
    return (
      <div className="a-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
        <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>No Bhojanshala Assigned</h3>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Contact the Super Admin to assign a bhojanshala to your account.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Meal Schedule</h2>
        <span style={{ fontSize: 13, color: '#64748b' }}>{bhoj.nameEnglish}</span>
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        {timeline.map((day, i) => (
          <button key={day.date} type="button"
            onClick={() => selectDay(i)}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: i === sel ? 700 : 400, fontSize: 13,
              background: i === sel ? '#7c3aed' : day.isClosed ? '#fee2e2' : '#f1f5f9',
              color: i === sel ? '#fff' : day.isClosed ? '#dc2626' : '#374151',
            }}>
            {fmt(day.date)}
          </button>
        ))}
      </div>

      {draft && (
        <div className="a-card" style={{ marginBottom: 20 }}>
          <div className="a-card-head" style={{ marginBottom: 14 }}>
            <span className="a-card-title">{fmt(draft.date)}</span>
            <Toggle
              checked={draft.isClosed}
              onChange={v => setDraft(d => ({ ...d, isClosed: v }))}
              label={draft.isClosed ? '🔴 Closed all day' : '🟢 Open'}
            />
          </div>
          <div className="a-card-body">
            {!draft.isClosed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {MEAL_TYPES.map(type => (
                  <MealPanel key={type} type={type}
                    meal={draft.meals[type]}
                    onChange={meal => setMeal(type, meal)} />
                ))}
              </div>
            )}
            <div className="a-field">
              <label className="a-label">
                Day Notice <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional — shown for this day only)</span>
              </label>
              <input className="a-input" value={draft.specialNotice}
                onChange={e => setDraft(d => ({ ...d, specialNotice: e.target.value }))}
                placeholder="e.g. Paryushana special menu today" />
            </div>
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : `Save ${fmt(draft.date)}`}
            </button>
            {saved && <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>✓ Saved!</span>}
            {err && <span style={{ color: '#dc2626', fontSize: 13 }}>{err}</span>}
          </div>
        </div>
      )}

      {/* Bhojanshala-level special notice */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">📢 Special Notice (all visitors)</span>
        </div>
        <div className="a-card-body">
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
            This notice appears on your bhojanshala page regardless of which day visitors view.
          </p>
          <div className="a-form-grid">
            <div className="a-field">
              <label className="a-label">Notice (English)</label>
              <input className="a-input" value={noticeForm.noticeEnglish}
                onChange={e => setNoticeForm(f => ({ ...f, noticeEnglish: e.target.value }))}
                placeholder="e.g. Closed for Paryushana — 14th to 22nd Aug" />
            </div>
            <div className="a-field">
              <label className="a-label">Notice (Gujarati)</label>
              <input className="a-input" value={noticeForm.noticeGujarati}
                onChange={e => setNoticeForm(f => ({ ...f, noticeGujarati: e.target.value }))}
                placeholder="e.g. પર્યુષણ નિમિત્તે બંધ — ૧૪ થી ૨૨ ઓગષ્ટ" />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="a-btn a-btn-secondary" onClick={handleSaveNotice} disabled={noticeSaving}>
              {noticeSaving ? 'Saving…' : 'Save Notice'}
            </button>
            {noticeSaved && <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>✓ Saved!</span>}
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Leave blank to clear</span>
          </div>
        </div>
      </div>
    </div>
  )
}
