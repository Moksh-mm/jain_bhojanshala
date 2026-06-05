import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../auth/AuthContext'
import { WEEKDAYS } from '../../data/data'

const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export default function MyDashboard({ navigate }) {
  const { profile } = useAuth()
  const [bhoj,    setBhoj]    = useState(null)
  const [meals,   setMeals]   = useState([])
  const [days,    setDays]    = useState([])
  const [loading, setLoading] = useState(true)

  const today   = new Date().getDay()
  const todayEn = WEEKDAYS.long.en[today]

  useEffect(() => { loadData() }, [profile?.bhojanshala_id])

  async function loadData() {
    if (!profile?.bhojanshala_id) { setLoading(false); return }
    setLoading(true)

    const [{ data: b }, { data: m }, { data: d }] = await Promise.all([
      supabase.from('bhojanshalas').select('*').eq('id', profile.bhojanshala_id).single(),
      supabase.from('bhojanshala_meals').select('*')
        .eq('bhojanshala_id', profile.bhojanshala_id)
        .eq('day_of_week', today),
      supabase.from('bhojanshala_days').select('*')
        .eq('bhojanshala_id', profile.bhojanshala_id)
        .eq('day_of_week', today)
        .single(),
    ])

    setBhoj(b || null)
    setMeals(m || [])
    setDays(d)
    setLoading(false)
  }

  function minsToTime(m) {
    if (!m) return ''
    const h  = Math.floor(m / 60)
    const mm = (m % 60).toString().padStart(2, '0')
    const ap = h >= 12 ? 'PM' : 'AM'
    const hh = h % 12 || 12
    return `${hh}:${mm} ${ap}`
  }

  if (loading) return <div className="a-inline-loading"><div className="a-spinner" /></div>

  if (!profile?.bhojanshala_id || !bhoj) {
    return (
      <div className="a-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
        <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>No Bhojanshala Assigned</h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
          The Super Admin needs to assign a bhojanshala to your account before you can manage it.
        </p>
      </div>
    )
  }

  const todayClosed = days?.closed === true
  const availMeals  = meals.filter(m => m.available)

  return (
    <div>
      {/* Hero card */}
      <div className="a-hero-card">
        <div className="a-hero-name">{bhoj.name_en}</div>
        <div className="a-hero-sub">{bhoj.area_en ? `${bhoj.area_en}, ` : ''}{bhoj.city_en}</div>
        <div className="a-hero-row">
          <div className="a-hero-item">
            <strong>{todayClosed ? '🔴 Closed Today' : `✅ ${availMeals.length} meal${availMeals.length !== 1 ? 's' : ''} today`}</strong>
          </div>
          <div className="a-hero-item">📅 {todayEn}</div>
          <div className="a-hero-item">
            {bhoj.enabled ? '👁 Visible on website' : '⚠️ Hidden from website'}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <button
          className="a-card"
          style={{ padding: '16px 18px', cursor: 'pointer', border: '1.5px solid #7c3aed', textAlign: 'left', background: '#fff' }}
          onClick={() => navigate('meals')}
        >
          <div style={{ fontSize: 20, marginBottom: 6 }}>🍽</div>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Edit Meal Schedule</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Update timings, menu, prices</div>
        </button>
        <button
          className="a-card"
          style={{ padding: '16px 18px', cursor: 'pointer', border: '1.5px solid #e2e8f0', textAlign: 'left', background: '#fff' }}
          onClick={() => navigate('meals')}
        >
          <div style={{ fontSize: 20, marginBottom: 6 }}>📢</div>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Special Notice</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Set a notice for visitors</div>
        </button>
      </div>

      {/* Today's schedule */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Today — {todayEn}</span>
          <button className="a-btn a-btn-primary a-btn-sm" onClick={() => navigate('meals')}>
            Edit Today
          </button>
        </div>
        <div className="a-card-body">
          {todayClosed ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#dc2626' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔴</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Closed Today</div>
            </div>
          ) : meals.length === 0 ? (
            <div className="a-empty" style={{ padding: '24px 0' }}>
              <p>No meal data yet. <button style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('meals')}>Set up meals →</button></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['breakfast', 'lunch', 'dinner'].map(type => {
                const meal = meals.find(m => m.meal_type === type)
                if (!meal) return null
                return (
                  <div key={type} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 10,
                    background: meal.available ? '#f8fafc' : '#fafafa',
                    border: '1px solid #e2e8f0',
                    opacity: meal.available ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize: 22 }}>{MEAL_EMOJI[type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize', color: '#0f172a' }}>{type}</div>
                      {meal.available ? (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {minsToTime(meal.time_start)} – {minsToTime(meal.time_end)}
                          {meal.price > 0 && ` · ₹${meal.price}/person`}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Not available today</div>
                      )}
                    </div>
                    {meal.available && meal.items?.length > 0 && (
                      <div style={{ fontSize: 12, color: '#7c3aed', textAlign: 'right', maxWidth: 140 }}>
                        {meal.items.slice(0, 3).join(', ')}{meal.items.length > 3 ? ` +${meal.items.length - 3}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bhojanshala details */}
      <div className="a-section-gap" />
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Bhojanshala Details</span>
        </div>
        <div className="a-card-body">
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Name (English)',  bhoj.name_en],
                ['Name (Gujarati)', bhoj.name_gu],
                ['City',           `${bhoj.city_en}${bhoj.area_en ? ', ' + bhoj.area_en : ''}`],
                ['Phone',          bhoj.phone || '—'],
                ['Tiffin Service', bhoj.tiffin_available ? (bhoj.tiffin_mode === 'own' ? 'Yes – Bring Your Own' : 'Yes – Container Provided') : 'Not available'],
                ['Facilities',     (bhoj.facilities || []).join(', ') || '—'],
                ['Status',         bhoj.enabled ? '✅ Visible on website' : '⚠️ Hidden from website'],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '8px 0', color: '#64748b', width: '40%', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
                  <td style={{ padding: '8px 0', fontWeight: 500, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current notice */}
      {(bhoj.notice_en || bhoj.notice_gu) && (
        <>
          <div className="a-section-gap" />
          <div className="a-alert a-alert-warn">
            <strong>Active Special Notice:</strong> {bhoj.notice_en || bhoj.notice_gu}
          </div>
        </>
      )}
    </div>
  )
}
