import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'

// ─── Constants ────────────────────────────────────────────────────

const DOW_FULL = ['રવિવાર','સોમવાર','મંગળવાર','બુધવાર','ગુરૂવાર','શુક્રવાર','શનિવાર']
const DOW_SHORT = ['ર','સો','મ','બ','ગ','શુ','શ']
const MONTH_FULL = ['જાન્યુઆરી','ફેબ્રુઆરી','માર્ચ','એપ્રિલ','મે','જૂન','જુલાઈ','ઑગસ્ટ','સપ્ટેમ્બર','ઑક્ટોબર','નવેમ્બર','ડિસેમ્બર']
const CLOSE_REASONS = [
  { value: 'FESTIVAL',    label: 'ઉત્સવ / પર્વ' },
  { value: 'MAINTENANCE', label: 'સ્વચ્છતા / સમારકામ' },
  { value: 'TEMPORARY',   label: 'અસ્થાયી' },
  { value: 'OTHER',       label: 'અન્ય' },
]

// ─── Helpers ──────────────────────────────────────────────────────

function toDayStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function toMonthStr(y, m) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

function getEffective(dateStr, entries, rules, defaults) {
  const entry = entries.find(e => e.date === dateStr)
  if (entry) return { ...entry, source: 'override' }
  const dow = new Date(dateStr + 'T00:00:00').getDay()
  const rule = rules.find(r => r.dayOfWeek === dow)
  if (rule) return {
    isClosed:         rule.isClosed,
    navkarshiEnabled: rule.navkarshiEnabled,
    ayambilEnabled:   rule.ayambilEnabled ?? true,
    lunchEnabled:     rule.lunchEnabled,
    choviharEnabled:  rule.choviharEnabled,
    source: 'recurring',
  }
  return {
    isClosed:         false,
    navkarshiEnabled: defaults.navkarshiAvailable,
    ayambilEnabled:   defaults.ayambilShalaEnabled,
    lunchEnabled:     defaults.lunchAvailable,
    choviharEnabled:  defaults.choviharAvailable,
    source: 'default',
  }
}

// ─── Primitive components ─────────────────────────────────────────

function BigToggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 58, height: 32, borderRadius: 16, border: 'none', cursor: 'pointer',
      background: checked ? '#e87722' : '#d1cdc7',
      position: 'relative', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 4,
        left: checked ? 28 : 4,
        width: 24, height: 24, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,.28)',
      }} />
    </button>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '22px 20px', marginBottom: 16,
      boxShadow: '0 1px 8px rgba(0,0,0,.07)', border: '1px solid #f0e8d5', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ gu, en }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', lineHeight: 1.3 }}>{gu}</div>
      {en && <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 3 }}>{en}</div>}
    </div>
  )
}

// ─── Meal row for default-pattern section ─────────────────────────

function MealRow({ icon, guName, enName, available, onChange, startTime, onStart, endTime, onEnd, price, onPrice }) {
  return (
    <div style={{
      borderRadius: 16, border: `2px solid ${available ? '#e87722' : '#e7e5e4'}`,
      background: available ? '#fffbf5' : '#faf9f8',
      padding: '16px 18px', marginBottom: 12, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1917' }}>{guName}</div>
            <div style={{ fontSize: 12, color: '#a8a29e' }}>{enName}</div>
          </div>
        </div>
        <BigToggle checked={available} onChange={onChange} />
      </div>

      {available && (
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: '#78716c', marginBottom: 7, fontWeight: 600 }}>⏱ શરૂ સમય</div>
            <input type="time" className="gj-input" value={startTime || ''} onChange={e => onStart(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#78716c', marginBottom: 7, fontWeight: 600 }}>⏹ સમાપ્તિ</div>
            <input type="time" className="gj-input" value={endTime || ''} onChange={e => onEnd(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 13, color: '#78716c', marginBottom: 7, fontWeight: 600 }}>₹ ભાવ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" min="0" className="gj-input"
                value={price ?? 0} onChange={e => onPrice(Number(e.target.value) || 0)}
                style={{ maxWidth: 130 }}
              />
              <span style={{ fontSize: 13, color: '#a8a29e' }}>0 = નિ:શુલ્ક</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Exception modal (add / edit special day) ─────────────────────

function ExceptionModal({ initial, onSave, onDelete, onClose }) {
  const today    = new Date()
  const todayStr = toDayStr(today.getFullYear(), today.getMonth(), today.getDate())
  const isEdit   = Object.keys(initial || {}).length > 1

  const [form, setForm] = useState({
    date:             initial?.date || todayStr,
    isClosed:         initial?.isClosed        ?? true,
    closedReason:     initial?.closedReason    || '',
    navkarshiEnabled: initial?.navkarshiEnabled ?? true,
    ayambilEnabled:   initial?.ayambilEnabled   ?? true,
    lunchEnabled:     initial?.lunchEnabled     ?? true,
    choviharEnabled:  initial?.choviharEnabled  ?? true,
    specialNotice:    initial?.specialNotice    || '',
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try { await onSave(form); onClose() }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try { await onDelete(form.date); onClose() }
    finally { setDeleting(false) }
  }

  return (
    <div className="gj-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gj-modal-sheet">
        <div className="gj-sheet-handle" />
        <div className="gj-sheet-title">
          <div className="gj-sheet-date">
            {isEdit ? 'ફેરફાર સુધારો' : 'ખાસ દિવસ ઉમેરો'}
          </div>
          <button className="gj-sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="gj-sheet-body" style={{ paddingBottom: 24 }}>

          {/* Date picker */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#44403c', marginBottom: 10 }}>📅 તારીખ</div>
            <input
              type="date" className="gj-input"
              value={form.date} min={todayStr}
              onChange={e => set('date', e.target.value)}
              disabled={isEdit}
              style={{ fontSize: 17, padding: '13px 16px' }}
            />
          </div>

          {/* Closed / Open big toggle */}
          <div
            onClick={() => set('isClosed', !form.isClosed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: form.isClosed ? '#fff5f5' : '#f0fdf4',
              border: `2px solid ${form.isClosed ? '#fca5a5' : '#86efac'}`,
              borderRadius: 16, padding: '18px 20px', marginBottom: 20, cursor: 'pointer',
            }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1917' }}>
                {form.isClosed ? '🔴 આખો દિવસ બંધ છે?' : '🟢 ભોજન ઉપલબ્ધ છે'}
              </div>
              <div style={{ fontSize: 12, color: '#78716c', marginTop: 3 }}>
                {form.isClosed ? 'tap to mark as open' : 'tap to close this day'}
              </div>
            </div>
            <BigToggle checked={form.isClosed} onChange={v => set('isClosed', v)} />
          </div>

          {/* If closed: reason */}
          {form.isClosed && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#44403c', marginBottom: 12 }}>📝 કારણ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CLOSE_REASONS.map(r => (
                  <button key={r.value} onClick={() => set('closedReason', r.value)} style={{
                    padding: '14px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: form.closedReason === r.value ? 700 : 500,
                    background: form.closedReason === r.value ? '#e87722' : '#f5f5f4',
                    color: form.closedReason === r.value ? '#fff' : '#44403c',
                    transition: 'all 0.15s', lineHeight: 1.3,
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If open: which meals */}
          {!form.isClosed && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#44403c', marginBottom: 12 }}>
                કયા ભોજન ઉપલબ્ધ રહેશે?
              </div>
              {[
                { k: 'navkarshiEnabled', icon: '🌅', label: 'નવકારશી' },
                { k: 'ayambilEnabled', icon: '🥣', label: 'આયંબિલ' },
                { k: 'lunchEnabled',     icon: '🍛',  label: 'બપોરે ભોજન' },
                { k: 'choviharEnabled',  icon: '🌙',  label: 'ચોવિહાર' },
              ].map(({ k, icon, label }) => (
                <div key={k}
                  onClick={() => set(k, !form[k])}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', borderRadius: 14, cursor: 'pointer', marginBottom: 10,
                    background: form[k] ? '#fffbf5' : '#faf9f8',
                    border: `2px solid ${form[k] ? '#e87722' : '#e7e5e4'}`,
                  }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{icon} {label}</span>
                  <BigToggle checked={form[k]} onChange={v => set(k, v)} />
                </div>
              ))}
            </div>
          )}

          {/* Special notice */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#44403c', marginBottom: 8 }}>
              📢 વિશેષ સૂચના (વૈકલ્પિક)
            </div>
            <textarea
              className="gj-textarea" rows={2}
              value={form.specialNotice}
              placeholder="ઉ.દ. આજે ખિચડી ₹10 — ઉ.દ. માત્ર ભક્ત ઉપલબ્ધ"
              onChange={e => set('specialNotice', e.target.value)}
            />
          </div>
        </div>

        <div className="gj-sheet-footer" style={{ gap: 10 }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: '15px 20px', borderRadius: 14,
              border: '2px solid #fca5a5', background: '#fff5f5',
              color: '#dc2626', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>
              {deleting ? '...' : '🗑 દૂર કરો'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '16px', borderRadius: 14, border: 'none',
            background: saving ? '#d1cdc7' : '#e87722',
            color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            {saving ? 'સાચવી રહ્યા...' : '✓ સાચવો'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export default function AvailabilityCalendar({ bhoj, onSaved }) {
  const today    = new Date()
  const todayStr = toDayStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [year,        setYear]        = useState(today.getFullYear())
  const [month,       setMonth]       = useState(today.getMonth())
  const [entries,     setEntries]     = useState([])
  const [rules,       setRules]       = useState([])
  const [calLoading,  setCalLoading]  = useState(true)
  const [needMigrate, setNeedMigrate] = useState(false)
  const [exceptModal, setExceptModal] = useState(null)

  // Default weekly pattern — mirrors bhojanshala meal fields
  const [defaults, setDefaults] = useState({
    navkarshiAvailable:  bhoj.navkarshi?.available ?? true,
    navkarshiStartTime:  bhoj.navkarshi?.startTime || '',
    navkarshiEndTime:    bhoj.navkarshi?.endTime   || '',
    navkarshiPrice:      bhoj.navkarshi?.price     ?? 0,
    ayambilShalaEnabled: bhoj.ayambil?.available   ?? false,
    ayambilStartTime:    bhoj.ayambil?.startTime   || '',
    ayambilEndTime:      bhoj.ayambil?.endTime     || '',
    ayambilPrice:        bhoj.ayambil?.price       ?? 0,
    lunchAvailable:     bhoj.lunch?.available     ?? true,
    lunchStartTime:     bhoj.lunch?.startTime     || '',
    lunchEndTime:       bhoj.lunch?.endTime       || '',
    lunchPrice:         bhoj.lunch?.price         ?? 0,
    choviharAvailable:  bhoj.chovihar?.available  ?? false,
    choviharStartTime:  bhoj.chovihar?.startTime  || '',
    choviharEndTime:    bhoj.chovihar?.endTime    || '',
    choviharPrice:      bhoj.chovihar?.price      ?? 0,
  })
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [savedDefaults,  setSavedDefaults]  = useState(false)
  const [errDefaults,    setErrDefaults]    = useState('')

  const [savingWeekly, setSavingWeekly] = useState(false)

  const setD = (k, v) => setDefaults(p => ({ ...p, [k]: v }))

  // The single isClosed recurring rule represents "weekly off day"
  const weeklyOffRule = rules.find(r => r.isClosed)
  const weeklyOffDay  = weeklyOffRule?.dayOfWeek ?? null

  // ── Fetch calendar data ──────────────────────────────────────────

  const fetchCalendar = useCallback(async () => {
    setCalLoading(true)
    try {
      const res = await adminApi.getAvailability(toMonthStr(year, month))
      setEntries(res.entries || [])
      setRules(res.recurringRules || [])
      setNeedMigrate(!!res.migrationRequired)
    } catch { /* silent */ }
    setCalLoading(false)
  }, [year, month])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  // ── Save default pattern ─────────────────────────────────────────

  async function saveDefaults() {
    setSavingDefaults(true); setErrDefaults(''); setSavedDefaults(false)
    try {
      await adminApi.updateMyBhojanshala({
        navkarshiAvailable:  defaults.navkarshiAvailable,
        navkarshiStartTime:  defaults.navkarshiStartTime,
        navkarshiEndTime:    defaults.navkarshiEndTime,
        navkarshiPrice:      defaults.navkarshiPrice,
        ayambilShalaEnabled: defaults.ayambilShalaEnabled,
        ayambilStartTime:    defaults.ayambilStartTime,
        ayambilEndTime:      defaults.ayambilEndTime,
        ayambilPrice:        defaults.ayambilPrice,
        lunchAvailable:      defaults.lunchAvailable,
        lunchStartTime:     defaults.lunchStartTime,
        lunchEndTime:       defaults.lunchEndTime,
        lunchPrice:         defaults.lunchPrice,
        choviharAvailable:  defaults.choviharAvailable,
        choviharStartTime:  defaults.choviharStartTime,
        choviharEndTime:    defaults.choviharEndTime,
        choviharPrice:      defaults.choviharPrice,
      })
      onSaved?.()
      setSavedDefaults(true)
      setTimeout(() => setSavedDefaults(false), 4000)
    } catch (e) {
      setErrDefaults(e.message)
    }
    setSavingDefaults(false)
  }

  // ── Select weekly off day ────────────────────────────────────────

  async function selectWeeklyOff(dow) {
    setSavingWeekly(true)
    try {
      if (weeklyOffDay !== null) {
        await adminApi.deleteRecurringRule(weeklyOffDay)
      }
      if (dow !== null) {
        await adminApi.upsertRecurringRule({
          dayOfWeek:        dow,
          isClosed:         true,
          closedReason:     'WEEKLY_HOLIDAY',
          navkarshiEnabled: true,
          ayambilEnabled:   true,
          lunchEnabled:     true,
          choviharEnabled:  true,
        })
      }
      await fetchCalendar()
    } catch { /* silent */ }
    setSavingWeekly(false)
  }

  // ── Exception CRUD ───────────────────────────────────────────────

  async function saveException(form) {
    await adminApi.upsertAvailability({
      date:             form.date,
      isClosed:         form.isClosed,
      closedReason:     form.closedReason || null,
      specialNotice:    form.specialNotice || null,
      navkarshiEnabled: form.navkarshiEnabled,
      ayambilEnabled:   form.ayambilEnabled,
      lunchEnabled:     form.lunchEnabled,
      choviharEnabled:  form.choviharEnabled,
    })
    await fetchCalendar()
  }

  async function deleteException(dateStr) {
    await adminApi.deleteAvailability(dateStr)
    await fetchCalendar()
  }

  // ── Calendar grid data ───────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const startOffset  = new Date(year, month, 1).getDay() // 0=Sun
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function cellStatus(dateStr) {
    const eff = getEffective(dateStr, entries, rules, defaults)
    if (eff.isClosed) return 'closed'
    const enabled = [eff.navkarshiEnabled, eff.ayambilEnabled, eff.lunchEnabled, eff.choviharEnabled].filter(Boolean).length
    if (enabled === 0) return 'closed'
    const expected = [defaults.navkarshiAvailable, defaults.ayambilShalaEnabled, defaults.lunchAvailable, defaults.choviharAvailable].filter(Boolean).length
    return enabled >= expected ? 'open' : 'partial'
  }

  // Upcoming exceptions in next 30 days
  const upcomingExceptions = entries
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="gj-content">
      {needMigrate && (
        <div style={{
          marginBottom: 16, padding: '14px 18px',
          background: '#FFF9E6', border: '1px solid #F59E0B',
          borderRadius: 14, fontSize: 13, color: '#92400E',
        }}>
          ⚠️ <strong>ઉપલબ્ધતા ડેટાબેઝ બનાવ્યો નથી.</strong> Super Admin ને migration ચલાવવા જણાવો. ત્યાં સુધી ઉપરનો "સામાન્ય સમય" વિભાગ ચાલશે.
        </div>
      )}

      {/* ══════════ 1. DEFAULT WEEKLY PATTERN ══════════ */}
      <Card>
        <SectionTitle gu="સામાન્ય દિવસોમાં શું ઉપલબ્ધ છે?" en="What is usually available?" />

        <MealRow
          icon="🌅" guName="નવકારશી" enName="Navkarshi"
          available={defaults.navkarshiAvailable} onChange={v => setD('navkarshiAvailable', v)}
          startTime={defaults.navkarshiStartTime} onStart={v => setD('navkarshiStartTime', v)}
          endTime={defaults.navkarshiEndTime}     onEnd={v => setD('navkarshiEndTime', v)}
          price={defaults.navkarshiPrice}         onPrice={v => setD('navkarshiPrice', v)}
        />
        <MealRow
          icon="🥣" guName="આયંબિલ" enName="Ayambil"
          available={defaults.ayambilShalaEnabled} onChange={v => setD('ayambilShalaEnabled', v)}
          startTime={defaults.ayambilStartTime} onStart={v => setD('ayambilStartTime', v)}
          endTime={defaults.ayambilEndTime}     onEnd={v => setD('ayambilEndTime', v)}
          price={defaults.ayambilPrice}         onPrice={v => setD('ayambilPrice', v)}
        />
        <MealRow
          icon="🍛" guName="બપોરે ભોજન" enName="Lunch"
          available={defaults.lunchAvailable} onChange={v => setD('lunchAvailable', v)}
          startTime={defaults.lunchStartTime} onStart={v => setD('lunchStartTime', v)}
          endTime={defaults.lunchEndTime}     onEnd={v => setD('lunchEndTime', v)}
          price={defaults.lunchPrice}         onPrice={v => setD('lunchPrice', v)}
        />
        <MealRow
          icon="🌙" guName="ચોવિહાર" enName="Chovihar"
          available={defaults.choviharAvailable} onChange={v => setD('choviharAvailable', v)}
          startTime={defaults.choviharStartTime} onStart={v => setD('choviharStartTime', v)}
          endTime={defaults.choviharEndTime}     onEnd={v => setD('choviharEndTime', v)}
          price={defaults.choviharPrice}         onPrice={v => setD('choviharPrice', v)}
        />

        {errDefaults && (
          <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{errDefaults}</div>
        )}

        <button onClick={saveDefaults} disabled={savingDefaults} style={{
          width: '100%', padding: '17px', borderRadius: 14, border: 'none',
          background: savedDefaults ? '#16a34a' : savingDefaults ? '#d1cdc7' : '#e87722',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          marginTop: 6, transition: 'background 0.25s',
        }}>
          {savedDefaults ? '✅ સફળતાપૂર્વક સચવાઈ ગયું' : savingDefaults ? 'સાચવી રહ્યા...' : '💾 સામાન્ય સમય સાચવો'}
        </button>
      </Card>

      {/* ══════════ 2. WEEKLY CLOSED DAY ══════════ */}
      <Card>
        <SectionTitle gu="દર અઠવાડિએ બંધ રહેવાનો દિવસ" en="One day every week — always closed" />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => weeklyOffDay !== null && selectWeeklyOff(null)}
            disabled={savingWeekly}
            style={{
              padding: '13px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 15,
              background: weeklyOffDay === null ? '#e87722' : '#f5f5f4',
              color: weeklyOffDay === null ? '#fff' : '#44403c',
              transition: 'all 0.15s', opacity: savingWeekly ? 0.6 : 1,
            }}>
            કોઈ નહીં
          </button>
          {[0, 1, 2, 3, 4, 5, 6].map(dow => (
            <button key={dow}
              onClick={() => selectWeeklyOff(dow)}
              disabled={savingWeekly}
              style={{
                padding: '13px 18px', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15,
                background: weeklyOffDay === dow ? '#dc2626' : '#f5f5f4',
                color: weeklyOffDay === dow ? '#fff' : '#44403c',
                transition: 'all 0.15s', opacity: savingWeekly ? 0.6 : 1,
              }}>
              {DOW_FULL[dow]}
            </button>
          ))}
        </div>

        {weeklyOffDay !== null && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fca5a5',
            borderRadius: 12, padding: '13px 18px', fontSize: 15, color: '#b91c1c', lineHeight: 1.5,
          }}>
            🔴 દર <strong>{DOW_FULL[weeklyOffDay]}ે</strong> આખો દિવસ બંધ રહેશે.
          </div>
        )}
      </Card>

      {/* ══════════ 3. SPECIAL EXCEPTIONS ══════════ */}
      <Card>
        <SectionTitle gu="વિશેષ ફેરફારો" en="Special days — tap to add or edit" />

        {upcomingExceptions.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#a8a29e', fontSize: 15,
            padding: '16px 0 20px', fontStyle: 'italic',
          }}>
            કોઈ ખાસ ફેરફાર નથી
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {upcomingExceptions.map(e => {
              const dt       = new Date(e.date + 'T00:00:00')
              const dayLabel = `${dt.getDate()} ${MONTH_FULL[dt.getMonth()]}`
              const dowLabel = DOW_FULL[dt.getDay()]
              const meals    = [
                e.navkarshiEnabled && 'નવકારશી',
                e.ayambilEnabled    && 'આયંબિલ',
                e.lunchEnabled     && 'ભોજન',
                e.choviharEnabled  && 'ચોવિહાર',
              ].filter(Boolean).join(' · ')
              return (
                <div key={e.date} onClick={() => setExceptModal({ ...e })} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '15px 18px', borderRadius: 14, background: '#faf9f8',
                  border: '1px solid #e7e5e4', marginBottom: 10, cursor: 'pointer',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>
                      {dayLabel} ({dowLabel})
                    </div>
                    <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>
                      {e.isClosed ? '🔴 આખો દિવસ બંધ' : `🟠 ${meals || 'ખુલ્લું'}`}
                    </div>
                  </div>
                  <span style={{ color: '#a8a29e', fontSize: 22 }}>›</span>
                </div>
              )
            })}
          </div>
        )}

        <button onClick={() => setExceptModal({})} style={{
          width: '100%', padding: '17px', borderRadius: 14,
          border: '2px dashed #e87722', background: '#fffbf5',
          color: '#e87722', fontWeight: 700, fontSize: 16, cursor: 'pointer',
        }}>
          + ખાસ દિવસ ઉમેરો
        </button>
      </Card>

      {/* ══════════ 4. SIMPLE CALENDAR ══════════ */}
      <Card>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button onClick={prevMonth} style={{
            background: '#f5f5f4', border: 'none', borderRadius: 12,
            padding: '9px 16px', cursor: 'pointer', fontSize: 20, color: '#44403c',
          }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1917' }}>
            {calLoading ? '...' : `${MONTH_FULL[month]} ${year}`}
          </div>
          <button onClick={nextMonth} style={{
            background: '#f5f5f4', border: 'none', borderRadius: 12,
            padding: '9px 16px', cursor: 'pointer', fontSize: 20, color: '#44403c',
          }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {DOW_SHORT.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#a8a29e', fontWeight: 700, padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const ds         = toDayStr(year, month, day)
            const status     = cellStatus(ds)
            const isToday    = ds === todayStr
            const isPast     = ds < todayStr
            const hasOvr     = entries.find(e => e.date === ds)
            const statusEmoji = status === 'open' ? '🟢' : status === 'partial' ? '🟠' : '🔴'

            return (
              <div key={ds}
                onClick={() => !isPast && setExceptModal(hasOvr ? { ...hasOvr } : { date: ds })}
                style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: 12,
                  cursor: isPast ? 'default' : 'pointer',
                  background: isToday ? '#fff7ed' : 'transparent',
                  border: isToday ? '2px solid #e87722' : '2px solid transparent',
                  opacity: isPast ? 0.38 : 1,
                  transition: 'background 0.15s',
                }}>
                <div style={{ fontSize: 11, marginBottom: 1 }}>{statusEmoji}</div>
                <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: '#1c1917' }}>{day}</div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 18, fontSize: 13, color: '#78716c', flexWrap: 'wrap' }}>
          <span>🟢 ખુલ્લું</span>
          <span>🟠 આંશિક ઉપલબ્ધ</span>
          <span>🔴 બંધ</span>
        </div>
      </Card>

      {/* ══════════ 5. SUMMARY CARD ══════════ */}
      <Card style={{ background: '#fffbf5', border: '2px solid #fed7aa', marginBottom: 80 }}>
        <SectionTitle gu="📋 આ અઠવાડિયું" en="This week at a glance" />

        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { icon: '🌅', label: 'navkarshi',  on: defaults.navkarshiAvailable },
            { icon: '🥣', label: 'આયંબિલ', on: defaults.ayambilShalaEnabled },
            { icon: '🍛', label: 'lunch',      on: defaults.lunchAvailable },
            { icon: '🌙', label: 'chovihar',   on: defaults.choviharAvailable },
          ].map(({ icon, label, on }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, color: '#44403c' }}>{icon} {label}</span>
              <span style={{
                padding: '5px 16px', borderRadius: 20, fontSize: 14, fontWeight: 700,
                background: on ? '#dcfce7' : '#fee2e2',
                color: on ? '#166534' : '#991b1b',
              }}>
                {on ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #fed7aa', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, color: '#44403c' }}>🗓 Weekly off</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: weeklyOffDay !== null ? '#991b1b' : '#166534' }}>
              {weeklyOffDay !== null ? DOW_FULL[weeklyOffDay] : 'None'}
            </span>
          </div>

          {upcomingExceptions.length > 0 && (
            <div style={{ borderTop: '1px solid #fed7aa', paddingTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#44403c', marginBottom: 10 }}>
                Upcoming special days
              </div>
              {upcomingExceptions.slice(0, 4).map(e => {
                const dt = new Date(e.date + 'T00:00:00')
                return (
                  <div key={e.date} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: '#44403c' }}>
                      {dt.getDate()} {MONTH_FULL[dt.getMonth()]} ({DOW_FULL[dt.getDay()].slice(0, 3)})
                    </span>
                    <span style={{ fontWeight: 700, color: e.isClosed ? '#991b1b' : '#92400E' }}>
                      {e.isClosed ? '🔴 Closed' : '🟠 Partial'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Exception modal */}
      {exceptModal !== null && (
        <ExceptionModal
          initial={exceptModal}
          onSave={saveException}
          onDelete={deleteException}
          onClose={() => setExceptModal(null)}
        />
      )}
    </div>
  )
}


