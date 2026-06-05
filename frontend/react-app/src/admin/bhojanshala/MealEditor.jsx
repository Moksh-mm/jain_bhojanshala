import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../auth/AuthContext'
import { FOODS, WEEKDAYS, BHOJ } from '../../data/data'

const FOODS_LIST = Object.entries(FOODS).map(([key, val]) => ({ key, ...val }))
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast 🌅', lunch: 'Lunch ☀️', dinner: 'Dinner 🌙' }

function minsToHHMM(m) {
  if (!m && m !== 0) return ''
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`
}
function HHMMToMins(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
function minsToDisplay(m) {
  if (!m && m !== 0) return '—'
  const h = Math.floor(m / 60), mm = (m % 60).toString().padStart(2, '0')
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${mm} ${ap}`
}

function Toggle({ checked, onChange }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="a-toggle-track" />
      <span className="a-toggle-thumb" />
    </label>
  )
}

function MealBlock({ type, meal, onChange }) {
  return (
    <div className="a-meal-block">
      <div className="a-meal-head">
        <span className="a-meal-name">{MEAL_LABELS[type]}</span>
        <label className="a-toggle-wrap">
          <Toggle checked={meal.available} onChange={v => onChange({ ...meal, available: v })} />
          <span className="a-toggle-label" style={{ fontSize: 13, color: '#64748b' }}>
            {meal.available ? 'Available' : 'Not available'}
          </span>
        </label>
      </div>

      {meal.available && (
        <div className="a-meal-body">
          <div className="a-meal-row">
            <div className="a-meal-field">
              <label className="a-label">Start Time</label>
              <input type="time" className="a-input"
                value={minsToHHMM(meal.time_start)}
                onChange={e => onChange({ ...meal, time_start: HHMMToMins(e.target.value) })}
              />
            </div>
            <div className="a-meal-field">
              <label className="a-label">End Time</label>
              <input type="time" className="a-input"
                value={minsToHHMM(meal.time_end)}
                onChange={e => onChange({ ...meal, time_end: HHMMToMins(e.target.value) })}
              />
            </div>
            <div className="a-meal-field" style={{ maxWidth: 120 }}>
              <label className="a-label">Price (₹)</label>
              <input type="number" className="a-input" min="0"
                value={meal.price || 0}
                onChange={e => onChange({ ...meal, price: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <label className="a-label">Menu Items</label>
          <div className="a-food-chips">
            {FOODS_LIST.map(f => (
              <button
                key={f.key} type="button"
                className={`a-food-chip ${(meal.items || []).includes(f.key) ? 'on' : ''}`}
                onClick={() => {
                  const items = meal.items || []
                  const next  = items.includes(f.key)
                    ? items.filter(i => i !== f.key)
                    : [...items, f.key]
                  onChange({ ...meal, items: next })
                }}
              >
                {f.emoji} {f.en}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Build default meal from bhojanshala base values
function defaultMeal(type, bhoj) {
  const map = { breakfast: ['bs', 'be', 'bp'], lunch: ['ls', 'le', 'lp'], dinner: ['ds', 'de', 'dp'] }
  const [s, e, p] = map[type]
  return {
    available:  type === 'lunch',  // lunch on by default
    time_start: bhoj[`base_${s}`] || 0,
    time_end:   bhoj[`base_${e}`] || 0,
    price:      bhoj[`base_${p}`] || 0,
    items:      [],
  }
}

export default function MealEditor({ bhojId, navigate }) {
  const { profile } = useAuth()
  const [bhoj,    setBhoj]    = useState(null)
  const [selDay,  setSelDay]  = useState(new Date().getDay())
  const [dayData, setDayData] = useState({}) // { closed, breakfast: {...}, lunch: {...}, dinner: {...} }
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  // Notice editing
  const [noticeEn, setNoticeEn] = useState('')
  const [noticeGu, setNoticeGu] = useState('')
  const [savingNotice, setSavingNotice] = useState(false)

  // Tiffin editing
  const [tiffinAvail, setTiffinAvail] = useState(false)
  const [tiffinMode,  setTiffinMode]  = useState('own')
  const [tiffinNotes, setTiffinNotes] = useState('')
  const [savingTiffin, setSavingTiffin] = useState(false)

  useEffect(() => { if (bhojId) loadBhoj() }, [bhojId])
  useEffect(() => { if (bhoj) loadDay(selDay) }, [selDay, bhoj])

  async function loadBhoj() {
    const { data } = await supabase.from('bhojanshalas').select('*').eq('id', bhojId).single()
    if (data) {
      setBhoj(data)
      setNoticeEn(data.notice_en || '')
      setNoticeGu(data.notice_gu || '')
      setTiffinAvail(data.tiffin_available || false)
      setTiffinMode(data.tiffin_mode || 'own')
      setTiffinNotes(data.tiffin_notes || '')
    }
  }

  async function loadDay(day) {
    setLoading(true)
    setError('')

    const [{ data: dayRow }, { data: mealsRows }] = await Promise.all([
      supabase.from('bhojanshala_days').select('*').eq('bhojanshala_id', bhojId).eq('day_of_week', day).single(),
      supabase.from('bhojanshala_meals').select('*').eq('bhojanshala_id', bhojId).eq('day_of_week', day),
    ])

    // If no DB data, fall back to the static BHOJ seed data
    const staticBhoj = bhoj || BHOJ.find(b => b.id === bhojId)

    const buildMeal = (type) => {
      const row = mealsRows?.find(m => m.meal_type === type)
      if (row) return { available: row.available, time_start: row.time_start, time_end: row.time_end, price: row.price, items: row.items || [] }
      // Try static seed data
      const staticDay = staticBhoj?.week?.[day]
      const staticMeal = staticDay?.meals?.[type]
      if (staticMeal && staticMeal.available) {
        return { available: true, time_start: staticMeal.sm, time_end: staticMeal.em, price: staticMeal.price, items: staticMeal.items || [] }
      }
      if (staticMeal) return { available: false, time_start: 0, time_end: 0, price: 0, items: [] }
      return defaultMeal(type, bhoj || {})
    }

    // Check static for closed
    const staticClosed = bhoj?.week?.[day]?.closed

    setDayData({
      closed:    dayRow?.closed ?? staticClosed ?? false,
      breakfast: buildMeal('breakfast'),
      lunch:     buildMeal('lunch'),
      dinner:    buildMeal('dinner'),
    })
    setLoading(false)
  }

  async function saveDay() {
    if (!bhojId) return
    setSaving(true); setError(''); setSaved(false)

    try {
      // Upsert day closed status
      await supabase.from('bhojanshala_days').upsert({
        bhojanshala_id: bhojId,
        day_of_week:    selDay,
        closed:         dayData.closed,
      }, { onConflict: 'bhojanshala_id,day_of_week' })

      // Upsert each meal
      for (const type of MEAL_TYPES) {
        const m = dayData[type]
        await supabase.from('bhojanshala_meals').upsert({
          bhojanshala_id: bhojId,
          day_of_week:    selDay,
          meal_type:      type,
          available:      dayData.closed ? false : m.available,
          time_start:     m.time_start,
          time_end:       m.time_end,
          price:          m.price,
          items:          m.items,
        }, { onConflict: 'bhojanshala_id,day_of_week,meal_type' })
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        admin_id:       profile.id,
        bhojanshala_id: bhojId,
        action:         `Updated ${WEEKDAYS.long.en[selDay]} Schedule`,
        details:        { bhojanshala_name: bhoj?.name_en || bhojId, day: WEEKDAYS.long.en[selDay], closed: dayData.closed }
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveNotice() {
    setSavingNotice(true)
    await supabase.from('bhojanshalas').update({ notice_en: noticeEn, notice_gu: noticeGu }).eq('id', bhojId)
    await supabase.from('activity_logs').insert({
      admin_id:       profile.id,
      bhojanshala_id: bhojId,
      action:         'Updated Special Notice',
      details:        { bhojanshala_name: bhoj?.name_en || bhojId }
    })
    setSavingNotice(false)
  }

  async function saveTiffin() {
    setSavingTiffin(true)
    await supabase.from('bhojanshalas').update({
      tiffin_available: tiffinAvail,
      tiffin_mode:      tiffinAvail ? tiffinMode : null,
      tiffin_notes:     tiffinNotes,
    }).eq('id', bhojId)
    await supabase.from('activity_logs').insert({
      admin_id:       profile.id,
      bhojanshala_id: bhojId,
      action:         'Updated Tiffin Settings',
      details:        { bhojanshala_name: bhoj?.name_en || bhojId }
    })
    setSavingTiffin(false)
  }

  if (!bhojId) return (
    <div className="a-card" style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ color: '#64748b' }}>No bhojanshala assigned to your account.</p>
    </div>
  )

  return (
    <div>
      {/* Day selector */}
      <div className="a-week-tabs">
        {WEEKDAYS.short.en.map((label, idx) => {
          const isToday = idx === new Date().getDay()
          return (
            <button
              key={idx}
              className={`a-day-tab ${selDay === idx ? 'active' : ''}`}
              onClick={() => setSelDay(idx)}
            >
              {label}
              {isToday && <span style={{ marginLeft: 4, fontSize: 10 }}>●</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="a-inline-loading"><div className="a-spinner" /></div>
      ) : (
        <>
          {error   && <div className="a-alert a-alert-error">{error}</div>}
          {saved   && <div className="a-alert a-alert-success">✓ Schedule saved successfully</div>}

          {/* Closed toggle */}
          <div className="a-card" style={{ marginBottom: 14 }}>
            <div className="a-card-body" style={{ padding: '14px 18px' }}>
              <label className="a-toggle-wrap">
                <Toggle checked={dayData.closed} onChange={v => setDayData(d => ({ ...d, closed: v }))} />
                <span className="a-toggle-label" style={{ fontSize: 14, fontWeight: 600 }}>
                  {dayData.closed
                    ? '🔴 Closed entire day'
                    : '✅ Open today'}
                </span>
              </label>
              {dayData.closed && (
                <p style={{ margin: '8px 0 0 50px', fontSize: 13, color: '#64748b' }}>
                  All meals will show as unavailable on the public website.
                </p>
              )}
            </div>
          </div>

          {/* Meal blocks */}
          {!dayData.closed && MEAL_TYPES.map(type => (
            <MealBlock
              key={type}
              type={type}
              meal={dayData[type] || { available: false, time_start: 0, time_end: 0, price: 0, items: [] }}
              onChange={m => setDayData(d => ({ ...d, [type]: m }))}
            />
          ))}

          {/* Save button */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="a-btn a-btn-secondary" onClick={() => loadDay(selDay)} disabled={saving}>
              Reset
            </button>
            <button className="a-btn a-btn-primary" onClick={saveDay} disabled={saving}>
              {saving ? 'Saving…' : `Save ${WEEKDAYS.short.en[selDay]} Schedule`}
            </button>
          </div>
        </>
      )}

      <div className="a-section-gap" />

      {/* Special Notice */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">📢 Special Notice</span>
        </div>
        <div className="a-card-body">
          <div className="a-field">
            <label className="a-label">Notice (English)</label>
            <textarea className="a-textarea"
              placeholder="e.g. Closed for 2 days · Lunch finished · Only breakfast available · Paryushan special timings"
              value={noticeEn} onChange={e => setNoticeEn(e.target.value)}
            />
          </div>
          <div className="a-field">
            <label className="a-label">Notice (Gujarati)</label>
            <textarea className="a-textarea"
              placeholder="e.g. 2 દિવસ બંધ · બપોરનું ભોજન સમાપ્ત"
              value={noticeGu} onChange={e => setNoticeGu(e.target.value)}
            />
          </div>
          <div className="a-hint">Leave blank to remove the notice. It will show prominently on your public page.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="a-btn a-btn-primary" onClick={saveNotice} disabled={savingNotice}>
              {savingNotice ? 'Saving…' : 'Save Notice'}
            </button>
          </div>
        </div>
      </div>

      <div className="a-section-gap" />

      {/* Tiffin settings */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">🥡 Tiffin Service</span>
        </div>
        <div className="a-card-body">
          <div className="a-row" style={{ marginBottom: 14 }}>
            <label className="a-toggle-wrap">
              <Toggle checked={tiffinAvail} onChange={setTiffinAvail} />
              <span className="a-toggle-label">Tiffin Service Available</span>
            </label>
          </div>

          {tiffinAvail && (
            <>
              <div className="a-field">
                <label className="a-label">Tiffin Mode</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {[['own', 'Bring Your Own Tiffin'], ['provided', 'Container Provided']].map(([val, label]) => (
                    <label key={val} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${tiffinMode === val ? '#7c3aed' : '#e2e8f0'}`,
                      background: tiffinMode === val ? '#ede9fe' : '#fff',
                      color: tiffinMode === val ? '#7c3aed' : '#374151',
                      fontSize: 13, fontWeight: 500,
                    }}>
                      <input type="radio" name="tiffin_mode" value={val}
                        checked={tiffinMode === val} onChange={() => setTiffinMode(val)}
                        style={{ display: 'none' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="a-field">
                <label className="a-label">Additional Notes</label>
                <input className="a-input"
                  placeholder="e.g. Extra ₹5 charge per tiffin"
                  value={tiffinNotes} onChange={e => setTiffinNotes(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="a-btn a-btn-primary" onClick={saveTiffin} disabled={savingTiffin}>
              {savingTiffin ? 'Saving…' : 'Save Tiffin Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
