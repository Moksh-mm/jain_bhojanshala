import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { adminApi } from '../../lib/api'
import { WEEKDAYS } from '../../data/data'

const MEAL_EMOJI  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }
const MEAL_LABEL  = { breakfast: 'Navkarshi', lunch: 'Lunch', dinner: 'Chovihar' }

function fmt12h(str) {
  if (!str) return '—'
  const [h, m] = str.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`
}

export default function MyDashboard({ navigate }) {
  const { user }    = useAuth()
  const [bhoj,    setBhoj]    = useState(null)
  const [today,   setToday]   = useState(null)  // ApiDaySchedule for today
  const [loading, setLoading] = useState(true)

  const todayDow  = new Date().getDay()
  const todayName = WEEKDAYS.long.en[todayDow]

  useEffect(() => {
    if (!user?.bhojanshalaId) { setLoading(false); return }
    loadData()
  }, [user?.bhojanshalaId])

  async function loadData() {
    setLoading(true)
    try {
      const [bhojRes, schedRes] = await Promise.all([
        adminApi.getMyBhojanshala(),
        adminApi.getSchedule(1),
      ])
      setBhoj(bhojRes.data)
      setToday(schedRes.data?.[0] ?? null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="a-inline-loading"><div className="a-spinner" /></div>

  if (!user?.bhojanshalaId || !bhoj) {
    return (
      <div className="a-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏛</div>
        <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>No Bhojanshala Assigned</h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
          The Super Admin needs to assign a bhojanshala to your account.
        </p>
      </div>
    )
  }

  const todayClosed = today?.isClosed ?? true
  const meals       = today?.meals ?? {}
  const availMeals  = Object.values(meals).filter(m => m?.available)

  return (
    <div>
      <div className="a-hero-card">
        <div className="a-hero-name">{bhoj.nameEnglish}</div>
        <div className="a-hero-sub">{bhoj.areaEnglish ? `${bhoj.areaEnglish}, ` : ''}{bhoj.cityEnglish}</div>
        <div className="a-hero-row">
          <div className="a-hero-item">
            <strong>{todayClosed ? '🔴 Closed Today' : `✅ ${availMeals.length} meal${availMeals.length !== 1 ? 's' : ''} today`}</strong>
          </div>
          <div className="a-hero-item">📅 {todayName}</div>
          <div className="a-hero-item">
            {bhoj.isActive ? '👁 Visible on website' : '⚠️ Hidden from website'}
          </div>
        </div>
      </div>

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

      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Today — {todayName}</span>
          <button className="a-btn a-btn-primary a-btn-sm" onClick={() => navigate('meals')}>Edit Today</button>
        </div>
        <div className="a-card-body">
          {todayClosed ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#dc2626' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔴</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Closed Today</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['breakfast', 'lunch', 'dinner'].map(type => {
                const meal = meals[type]
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
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{MEAL_LABEL[type]}</div>
                      {meal.available ? (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {fmt12h(meal.startTime)} – {fmt12h(meal.endTime)}
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

      <div className="a-section-gap" />
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Bhojanshala Details</span>
        </div>
        <div className="a-card-body">
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Name (English)',  bhoj.nameEnglish],
                ['Name (Gujarati)', bhoj.nameGujarati],
                ['City',           `${bhoj.cityEnglish}${bhoj.areaEnglish ? ', ' + bhoj.areaEnglish : ''}`],
                ['Phone',          bhoj.phone || '—'],
                ['Tiffin Service', bhoj.tiffin?.available ? (bhoj.tiffin.type === 'OWN' ? 'Yes – Bring Your Own' : 'Yes – Container Provided') : 'Not available'],
                ['Status',         bhoj.isActive ? '✅ Visible on website' : '⚠️ Hidden from website'],
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

      {(bhoj.noticeEnglish || bhoj.noticeGujarati) && (
        <>
          <div className="a-section-gap" />
          <div className="a-alert a-alert-warn">
            <strong>Active Special Notice:</strong> {bhoj.noticeEnglish || bhoj.noticeGujarati}
          </div>
        </>
      )}
    </div>
  )
}
