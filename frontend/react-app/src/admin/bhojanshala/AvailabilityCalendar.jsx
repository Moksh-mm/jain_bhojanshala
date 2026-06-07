import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../../lib/api'

// ─── constants ────────────────────────────────────────────────────

const MONTH_FULL = [
  'જાન્યુઆરી','ફેબ્રુઆરી','માર્ચ','એપ્રિલ','મે','જૂન',
  'જુલાઈ','ઑગસ્ટ','સપ્ટેમ્બર','ઑક્ટોબર','નવેમ્બર','ડિસેમ્બર',
]

// Monday-first display order
const DOW_ABBR = ['સો','મ','બ','ગ','શુ','શ','ર'] // Mon…Sun
const DOW_LABELS = { 0:'રવિ', 1:'સો', 2:'મ', 3:'બ', 4:'ગ', 5:'શુ', 6:'શ' }
const DOW_FULL   = {
  0:'રવિવાર', 1:'સોમવાર', 2:'મંગળવાર',
  3:'બુધવાર', 4:'ગુરૂવાર', 5:'શુક્રવાર', 6:'શનિવાર',
}
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon…Sun

const REASONS = {
  WEEKLY_HOLIDAY: 'સાપ્તાહિક રજા',
  FESTIVAL:       'ઉત્સવ / પર્વ',
  MAINTENANCE:    'સ્વચ્છતા / સમારકામ',
  TEMPORARY:      'અસ્થાયી',
  OTHER:          'અન્ય',
}

// ─── helpers ──────────────────────────────────────────────────────

function toMonthStr(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function toDayStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getEffective(dateStr, entries, rules) {
  const entry = entries.find(e => e.date === dateStr)
  if (entry) return { ...entry, source: 'override' }

  const dow = new Date(dateStr + 'T00:00:00').getDay() // 0=Sun, 1=Mon…
  const rule = rules.find(r => r.dayOfWeek === dow)
  if (rule) return {
    isClosed:         rule.isClosed,
    closedReason:     rule.closedReason,
    navkarshiEnabled: rule.navkarshiEnabled,
    lunchEnabled:     rule.lunchEnabled,
    choviharEnabled:  rule.choviharEnabled,
    source: 'recurring',
  }

  return {
    isClosed:         false,
    navkarshiEnabled: true,
    lunchEnabled:     true,
    choviharEnabled:  true,
    source: 'default',
  }
}

// ─── GujToggle (local copy) ───────────────────────────────────────

function GujToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: checked ? '#e87722' : '#d1cdc7',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}

// ─── MealBlock ────────────────────────────────────────────────────

function MealBlock({ icon, title, enabled, onToggle, start, onStart, end, onEnd, price, onPrice }) {
  return (
    <div className="gj-cal-meal-block">
      <div className={`gj-cal-toggle-row ${enabled ? 'open' : ''}`}
        style={{ padding: '10px 12px', background: '#faf7f2', borderBottom: enabled ? '1px solid #ede8e0' : 'none' }}>
        <span className="gj-cal-toggle-label">{icon} {title}</span>
        <GujToggle checked={enabled} onChange={onToggle} />
      </div>
      {enabled && (
        <div className="gj-cal-meal-body">
          <div className="gj-grid-2">
            <div className="gj-field">
              <label className="gj-label" style={{ fontSize: 11 }}>શરૂ</label>
              <input className="gj-input" type="time" value={start || ''}
                onChange={e => onStart(e.target.value)} />
            </div>
            <div className="gj-field">
              <label className="gj-label" style={{ fontSize: 11 }}>સમાપ્ત</label>
              <input className="gj-input" type="time" value={end || ''}
                onChange={e => onEnd(e.target.value)} />
            </div>
          </div>
          <div className="gj-field" style={{ marginTop: 8 }}>
            <label className="gj-label" style={{ fontSize: 11 }}>ભાવ (₹, 0 = મફત)</label>
            <div className="gj-price-wrap">
              <span className="gj-price-sym">₹</span>
              <input className="gj-price-input" type="number" min="0" value={price ?? ''}
                onChange={e => onPrice(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DayModal ─────────────────────────────────────────────────────

function DayModal({ dateStr, initial, onSave, onReset, onClose }) {
  const [data, setData] = useState({
    isClosed:         initial.isClosed         ?? false,
    closedReason:     initial.closedReason      || '',
    closedNote:       initial.closedNote        || '',
    specialNotice:    initial.specialNotice     || '',
    navkarshiEnabled: initial.navkarshiEnabled  ?? true,
    navkarshiStart:   initial.navkarshiStart    || '',
    navkarshiEnd:     initial.navkarshiEnd      || '',
    navkarshiPrice:   initial.navkarshiPrice    ?? '',
    lunchEnabled:     initial.lunchEnabled      ?? true,
    lunchStart:       initial.lunchStart        || '',
    lunchEnd:         initial.lunchEnd          || '',
    lunchPrice:       initial.lunchPrice        ?? '',
    choviharEnabled:  initial.choviharEnabled   ?? true,
    choviharStart:    initial.choviharStart     || '',
    choviharEnd:      initial.choviharEnd       || '',
    choviharPrice:    initial.choviharPrice     ?? '',
  })
  const [saving,    setSaving]    = useState(false)
  const [resetting, setResetting] = useState(false)
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  const isOverride = initial.source === 'override'
  const jsDate   = new Date(dateStr + 'T00:00:00')
  const dowName  = ['ર','સો','મ','બ','ગ','શુ','શ'][jsDate.getDay()]
  const dayNum   = jsDate.getDate()
  const monthName = MONTH_FULL[jsDate.getMonth()]

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(dateStr, {
        ...data,
        navkarshiPrice: data.navkarshiPrice !== '' ? Number(data.navkarshiPrice) : null,
        lunchPrice:     data.lunchPrice     !== '' ? Number(data.lunchPrice)     : null,
        choviharPrice:  data.choviharPrice  !== '' ? Number(data.choviharPrice)  : null,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try { await onReset(dateStr) }
    finally { setResetting(false) }
  }

  return (
    <div className="gj-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gj-modal-sheet">
        <div className="gj-sheet-handle" />
        <div className="gj-sheet-title">
          <div>
            <div className="gj-sheet-date">{dowName}, {dayNum} {monthName}</div>
            <div className={`gj-sheet-src ${initial.source}`}>
              {initial.source === 'override'  ? '✎ ચોક્કસ ફેરફાર' :
               initial.source === 'recurring' ? '↻ સાપ્તાહિક નિયમ' : '● ડિફૉલ્ટ'}
            </div>
          </div>
          <button className="gj-sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="gj-sheet-body">
          <div className="gj-cal-toggle-row">
            <span className="gj-cal-toggle-label">🔒 આખો દિવસ બંધ</span>
            <GujToggle checked={data.isClosed} onChange={v => set('isClosed', v)} />
          </div>

          {data.isClosed && (
            <>
              <div className="gj-field" style={{ marginTop: 12 }}>
                <label className="gj-label">કારણ</label>
                <select className="gj-input gj-select" value={data.closedReason}
                  onChange={e => set('closedReason', e.target.value)}>
                  <option value="">-- કારણ પસંદ કરો --</option>
                  {Object.entries(REASONS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="gj-field" style={{ marginTop: 10 }}>
                <label className="gj-label">નોંધ (વૈકલ્પિક)</label>
                <input className="gj-input" value={data.closedNote}
                  placeholder="ઉ.દ. ભાઈ-ત્રીજ ઉત્સવ"
                  onChange={e => set('closedNote', e.target.value)} />
              </div>
            </>
          )}

          {!data.isClosed && (
            <>
              <div style={{ marginTop: 12 }}>
                <MealBlock icon="🌅" title="નવકારશી"
                  enabled={data.navkarshiEnabled} onToggle={v => set('navkarshiEnabled', v)}
                  start={data.navkarshiStart}    onStart={v => set('navkarshiStart', v)}
                  end={data.navkarshiEnd}        onEnd={v   => set('navkarshiEnd', v)}
                  price={data.navkarshiPrice}    onPrice={v => set('navkarshiPrice', v)} />

                <MealBlock icon="☀️" title="ભોજન (બપોર)"
                  enabled={data.lunchEnabled} onToggle={v => set('lunchEnabled', v)}
                  start={data.lunchStart}     onStart={v => set('lunchStart', v)}
                  end={data.lunchEnd}         onEnd={v   => set('lunchEnd', v)}
                  price={data.lunchPrice}     onPrice={v => set('lunchPrice', v)} />

                <MealBlock icon="🌙" title="ચોવિહાર"
                  enabled={data.choviharEnabled} onToggle={v => set('choviharEnabled', v)}
                  start={data.choviharStart}     onStart={v => set('choviharStart', v)}
                  end={data.choviharEnd}         onEnd={v   => set('choviharEnd', v)}
                  price={data.choviharPrice}     onPrice={v => set('choviharPrice', v)} />
              </div>
            </>
          )}

          <div className="gj-field" style={{ marginTop: 16 }}>
            <label className="gj-label">📢 વિશેષ સૂચના (આ દિવસ)</label>
            <textarea className="gj-textarea" rows={2} value={data.specialNotice}
              placeholder="ઉ.દ. આજે ખિચડી - ₹10"
              onChange={e => set('specialNotice', e.target.value)} />
          </div>
        </div>

        <div className="gj-sheet-footer">
          {isOverride && (
            <button className="gj-cal-reset-btn" onClick={handleReset} disabled={resetting}>
              {resetting ? '...' : '↺ રિસેટ'}
            </button>
          )}
          <button className="gj-cal-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'સાચવી...' : '💾 સાચવો'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RecurringRulesPanel ──────────────────────────────────────────

function RecurringRulesPanel({ rules, onUpsert, onDelete }) {
  const [editingDow, setEditingDow] = useState(null)
  const [form,       setForm]       = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)

  function openEdit(dow) {
    const rule = rules.find(r => r.dayOfWeek === dow)
    setForm(rule ? {
      dayOfWeek:        rule.dayOfWeek,
      isClosed:         rule.isClosed,
      closedReason:     rule.closedReason || '',
      navkarshiEnabled: rule.navkarshiEnabled,
      lunchEnabled:     rule.lunchEnabled,
      choviharEnabled:  rule.choviharEnabled,
    } : {
      dayOfWeek:        dow,
      isClosed:         false,
      closedReason:     '',
      navkarshiEnabled: true,
      lunchEnabled:     true,
      choviharEnabled:  true,
    })
    setEditingDow(dow)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onUpsert({ ...form, closedReason: form.closedReason || null })
      setEditingDow(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(dow) {
    setDeleting(dow)
    try { await onDelete(dow) }
    finally { setDeleting(null) }
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="gj-cal-rules-wrap">
      <div className="gj-cal-rules-title">↻ સાપ્તાહિક નિયમો</div>
      <div className="gj-cal-rules-hint">
        દર અઠવાડિયે લાગુ પડતા નિયમો. ચોક્કસ તારીખ ઓવરરાઇડ કરી શકે.
      </div>

      <div className="gj-cal-rules-grid">
        {DOW_ORDER.map(dow => {
          const rule = rules.find(r => r.dayOfWeek === dow)
          return (
            <div key={dow} className={`gj-cal-rule-card ${rule ? (rule.isClosed ? 'closed' : 'partial') : ''}`}>
              <div className="gj-cal-rule-dow">{DOW_LABELS[dow]}</div>
              <div className="gj-cal-rule-status">
                {rule ? (
                  rule.isClosed ? (
                    <span style={{ fontSize: 10, color: '#d05858' }}>🔒 બંધ</span>
                  ) : (
                    <div className="gj-cal-dots sm">
                      <span className={`gj-dot ${rule.navkarshiEnabled ? 'on' : 'off'}`}>ન</span>
                      <span className={`gj-dot ${rule.lunchEnabled     ? 'on' : 'off'}`}>બ</span>
                      <span className={`gj-dot ${rule.choviharEnabled  ? 'on' : 'off'}`}>ચ</span>
                    </div>
                  )
                ) : (
                  <span className="gj-cal-rule-default">ડિ.</span>
                )}
              </div>
              <div className="gj-cal-rule-actions">
                <button className="gj-cal-rule-btn edit" onClick={() => openEdit(dow)}>✎</button>
                {rule && (
                  <button className="gj-cal-rule-btn del" onClick={() => handleDelete(dow)}
                    disabled={deleting === dow}>✕</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingDow !== null && form && (
        <div className="gj-modal-overlay" onClick={e => e.target === e.currentTarget && setEditingDow(null)}>
          <div className="gj-modal-sheet" style={{ maxHeight: '75vh' }}>
            <div className="gj-sheet-handle" />
            <div className="gj-sheet-title">
              <div className="gj-sheet-date">{DOW_FULL[editingDow]} — સાપ્તાહિક</div>
              <button className="gj-sheet-close" onClick={() => setEditingDow(null)}>✕</button>
            </div>
            <div className="gj-sheet-body">
              <div className="gj-cal-toggle-row">
                <span className="gj-cal-toggle-label">🔒 દર {DOW_LABELS[editingDow]} બંધ</span>
                <GujToggle checked={form.isClosed} onChange={v => setF('isClosed', v)} />
              </div>
              {form.isClosed && (
                <div className="gj-field" style={{ marginTop: 12 }}>
                  <label className="gj-label">કારણ</label>
                  <select className="gj-input gj-select" value={form.closedReason}
                    onChange={e => setF('closedReason', e.target.value)}>
                    <option value="">-- કારણ --</option>
                    {Object.entries(REASONS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
              {!form.isClosed && (
                <>
                  <div className="gj-cal-toggle-row" style={{ marginTop: 14 }}>
                    <span className="gj-cal-toggle-label">🌅 નવકારશી</span>
                    <GujToggle checked={form.navkarshiEnabled} onChange={v => setF('navkarshiEnabled', v)} />
                  </div>
                  <div className="gj-cal-toggle-row">
                    <span className="gj-cal-toggle-label">☀️ ભોજન</span>
                    <GujToggle checked={form.lunchEnabled} onChange={v => setF('lunchEnabled', v)} />
                  </div>
                  <div className="gj-cal-toggle-row">
                    <span className="gj-cal-toggle-label">🌙 ચોવિહાર</span>
                    <GujToggle checked={form.choviharEnabled} onChange={v => setF('choviharEnabled', v)} />
                  </div>
                </>
              )}
            </div>
            <div className="gj-sheet-footer">
              <button className="gj-cal-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'સાચવી...' : '💾 સાચવો'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AvailabilityCalendar ─────────────────────────────────────────

export default function AvailabilityCalendar({ bhojId }) {
  const today = new Date()
  const [year,        setYear]        = useState(today.getFullYear())
  const [month,       setMonth]       = useState(today.getMonth())
  const [entries,     setEntries]     = useState([])
  const [rules,       setRules]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [modal,       setModal]       = useState(null)
  const [err,         setErr]         = useState('')
  const [needMigrate, setNeedMigrate] = useState(false)

  const fetchMonth = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const res = await adminApi.getAvailability(toMonthStr(year, month))
      setEntries(res.entries || [])
      setRules(res.recurringRules || [])
      setNeedMigrate(!!res.migrationRequired)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchMonth() }, [fetchMonth])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth  = getDaysInMonth(year, month)
  const startOffset  = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDayStr(today.getFullYear(), today.getMonth(), today.getDate())

  function openDay(day) {
    const dateStr = toDayStr(year, month, day)
    const eff = getEffective(dateStr, entries, rules)
    setModal({ dateStr, data: eff })
  }

  async function handleSave(dateStr, data) {
    await adminApi.upsertAvailability({ date: dateStr, ...data })
    await fetchMonth()
    setModal(null)
  }

  async function handleReset(dateStr) {
    await adminApi.deleteAvailability(dateStr)
    await fetchMonth()
    setModal(null)
  }

  async function handleUpsertRule(rule) {
    await adminApi.upsertRecurringRule(rule)
    await fetchMonth()
  }

  async function handleDeleteRule(dayOfWeek) {
    await adminApi.deleteRecurringRule(dayOfWeek)
    await fetchMonth()
  }

  return (
    <div className="gj-cal-wrap">
      {/* Header */}
      <div className="gj-cal-header">
        <button className="gj-cal-nav" onClick={prevMonth}>‹</button>
        <div className="gj-cal-title">
          {loading ? '...' : `${MONTH_FULL[month]} ${year}`}
        </div>
        <button className="gj-cal-nav" onClick={nextMonth}>›</button>
      </div>

      {needMigrate && (
        <div style={{
          margin: '12px 16px', padding: '12px 16px',
          background: '#FFF9E6', border: '1px solid #F59E0B',
          borderRadius: 10, fontSize: 13, color: '#92400E', lineHeight: 1.5,
        }}>
          ⚠️ <strong>ડેટાબેઝ ટેબલ બનાવ્યા નથી.</strong><br />
          Supabase SQL Editor માં <code>migration.sql</code> ચલાવો, પછી બેકએન્ડ પુનઃ શરૂ કરો.
        </div>
      )}

      {err && (
        <div style={{ padding: '10px 16px', color: '#d05858', fontSize: 13 }}>⚠ {err}</div>
      )}

      {/* Calendar grid */}
      <div className="gj-cal-grid">
        {DOW_ABBR.map(d => (
          <div key={d} className="gj-cal-dow">{d}</div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`b-${i}`} className="gj-cal-cell blank" />
          const dateStr = toDayStr(year, month, day)
          const eff     = getEffective(dateStr, entries, rules)
          const isToday = dateStr === todayStr
          const isPast  = dateStr < todayStr

          return (
            <div
              key={dateStr}
              className={[
                'gj-cal-cell day',
                eff.isClosed ? 'closed' : '',
                isToday ? 'today' : '',
                isPast  ? 'past'  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => openDay(day)}
            >
              <div className={`gj-cal-day-num${isToday ? ' today-num' : ''}`}>{day}</div>

              {eff.source !== 'default' && (
                <div className={`gj-cal-src-badge ${eff.source}`} />
              )}

              {eff.isClosed ? (
                <div className="gj-cal-closed-label">બંધ</div>
              ) : (
                <div className="gj-cal-dots">
                  <span className={`gj-dot ${eff.navkarshiEnabled ? 'on' : 'off'}`}>ન</span>
                  <span className={`gj-dot ${eff.lunchEnabled     ? 'on' : 'off'}`}>બ</span>
                  <span className={`gj-dot ${eff.choviharEnabled  ? 'on' : 'off'}`}>ચ</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="gj-cal-legend">
        <span className="gj-legend-item"><span className="gj-dot on">ન</span> ઉ.</span>
        <span className="gj-legend-item"><span className="gj-dot off">ન</span> બ.</span>
        <span className="gj-legend-item"><span className="gj-cal-src-badge override" style={{ display:'inline-block' }} /> ફેરફાર</span>
        <span className="gj-legend-item"><span className="gj-cal-src-badge recurring" style={{ display:'inline-block' }} /> સા.નિ.</span>
        <span className="gj-legend-item" style={{ background:'#fff1f1', padding:'2px 6px', borderRadius:4, fontSize:11 }}>બ = બંધ</span>
      </div>

      {/* Recurring rules */}
      <RecurringRulesPanel rules={rules} onUpsert={handleUpsertRule} onDelete={handleDeleteRule} />

      {/* Day edit modal */}
      {modal && (
        <DayModal
          dateStr={modal.dateStr}
          initial={modal.data}
          onSave={handleSave}
          onReset={handleReset}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
