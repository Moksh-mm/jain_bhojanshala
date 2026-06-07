import { useEffect, useState, useRef } from 'react'
import { superAdmin } from '../../lib/api'

function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target == null) return
    if (target === 0) { setCount(0); return }
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

function getActionMeta(action = '') {
  const a = action.toUpperCase()
  if (a.includes('DELETE'))   return { color: '#D05858', bg: 'rgba(208,88,88,0.12)',  icon: '🗑' }
  if (a.includes('CREATE'))   return { color: '#5B8C5A', bg: 'rgba(91,140,90,0.12)',  icon: '✨' }
  if (a.includes('UPDATE'))   return { color: '#5A8FD8', bg: 'rgba(90,143,216,0.12)', icon: '✏️' }
  if (a.includes('ADMIN'))    return { color: '#8C6BC9', bg: 'rgba(140,107,201,0.12)',icon: '👤' }
  return                               { color: '#E9A84A', bg: 'rgba(233,168,74,0.12)', icon: '📋' }
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60)    return 'હમણાં'
  if (diff < 3600)  return `${Math.floor(diff / 60)} મિ. પહેલા`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ક. પહેલા`
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function StatCard({ icon, label, value, accent, onClick }) {
  const count = useCountUp(value)
  const clickable = Boolean(onClick)
  return (
    <div
      className={`sa-stat-card${clickable ? '' : ' no-action'}`}
      onClick={onClick}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="sa-stat-icon-wrap" style={{ background: accent + '1A' }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
      <div className="sa-stat-num">{value == null ? '—' : count}</div>
      <div className="sa-stat-label">{label}</div>
      {clickable && <span className="sa-stat-link">વિગત જુઓ →</span>}
      <div className="sa-stat-accent" style={{ background: accent }} />
    </div>
  )
}

function ActionCard({ icon, label, accent, onClick }) {
  return (
    <button className="sa-action-card" onClick={onClick}>
      <div className="sa-action-icon" style={{ background: (accent || '#E9A84A') + '1A' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div className="sa-action-label">{label}</div>
      <span className="sa-action-arrow">→</span>
    </button>
  )
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="sa-summary-item">
      <span className="sa-summary-icon">{icon}</span>
      <span className="sa-summary-label">{label}</span>
      <span className="sa-summary-dots" />
      <span className="sa-summary-value">{value ?? '—'}</span>
    </div>
  )
}

function TimelineItem({ log }) {
  const meta = getActionMeta(log.action)
  const label = (log.action || '').replace(/_/g, ' ').toLowerCase()
  return (
    <div className="sa-timeline-item">
      <div className="sa-timeline-icon" style={{ background: meta.bg }}>
        <span style={{ fontSize: 15 }}>{meta.icon}</span>
      </div>
      <div className="sa-timeline-body">
        <div className="sa-timeline-action" style={{ textTransform: 'capitalize' }}>{label}</div>
        <div className="sa-timeline-meta">
          {log.user?.name && <span className="sa-timeline-who">{log.user.name}</span>}
          {log.bhojanshala && <> · {log.bhojanshala.nameEnglish}</>}
          {log.description && <> — {log.description}</>}
        </div>
      </div>
      <div className="sa-timeline-time">{timeAgo(log.createdAt)}</div>
    </div>
  )
}

export default function SuperDashboard({ navigate }) {
  const [stats,   setStats]   = useState(null)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await superAdmin.getDashboard()
      setStats(res.stats)
      setLogs(res.recentActivity || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="a-inline-loading" style={{ padding: 80 }}>
      <div className="a-spinner" />
    </div>
  )

  return (
    <div className="sa-dashboard">
      {/* Stat Cards */}
      <div className="sa-stats-grid">
        <StatCard icon="🍛" label="કુલ ભોજનશાળા"    value={stats?.totalBhojanshalas}   accent="#E9A84A" onClick={() => navigate('bhojanshalas')} />
        <StatCard icon="✅" label="સક્રિય ભોજનશાળા" value={stats?.activeBhojanshalas}  accent="#5B8C5A" onClick={() => navigate('bhojanshalas')} />
        <StatCard icon="⚠️" label="નિષ્ક્રિય"        value={stats?.disabledBhojanshalas} accent="#D4B06A" />
        <StatCard icon="📍" label="શહેરો"             value={stats?.uniqueCities}         accent="#5A8FD8" />
        <StatCard icon="👤" label="કુલ એડમિન"         value={stats?.totalAdmins}          accent="#8C6BC9" onClick={() => navigate('admins')} />
        <StatCard icon="🔄" label="આજે અપડેટ"        value={stats?.updatedToday}         accent="#D05858" />
      </div>

      {/* Middle row: Quick Actions + Platform Summary */}
      <div className="sa-two-col">
        <div className="a-card">
          <div className="a-card-head">
            <span className="a-card-title">ઝડપી ક્રિયાઓ</span>
          </div>
          <div className="a-card-body">
            <div className="sa-actions-grid">
              <ActionCard
                icon="🍛" label="નવી ભોજનશાળા ઉમેરો"
                accent="#E9A84A"
                onClick={() => navigate('bhojanshalas', { action: 'create' })}
              />
              <ActionCard
                icon="👤" label="નવો એડમિન ઉમેરો"
                accent="#8C6BC9"
                onClick={() => navigate('admins', { action: 'create' })}
              />
              <ActionCard
                icon="📋" label="ભોજનશાળા યાદી"
                accent="#5A8FD8"
                onClick={() => navigate('bhojanshalas')}
              />
              <ActionCard
                icon="📜" label="પ્રવૃત્તિ જુઓ"
                accent="#5B8C5A"
                onClick={() => navigate('logs')}
              />
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <span className="a-card-title">પ્લેટફોર્મ સારાંશ</span>
          </div>
          <div className="a-card-body">
            <div className="sa-summary-list">
              <SummaryItem icon="🍛" label="કુલ ભોજનશાળા"   value={stats?.totalBhojanshalas} />
              <SummaryItem icon="👤" label="રજિસ્ટર્ડ એડમિન" value={stats?.totalAdmins} />
              <SummaryItem icon="✅" label="સક્રિય"           value={stats?.activeBhojanshalas} />
              <SummaryItem icon="⚠️" label="નિષ્ક્રિય"        value={stats?.disabledBhojanshalas} />
              <SummaryItem icon="📍" label="શહેરો"             value={stats?.uniqueCities} />
              <SummaryItem icon="🔄" label="આજે અપડેટ"       value={stats?.updatedToday} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">તાજેતરની પ્રવૃત્તિ</span>
          <button className="a-btn a-btn-secondary a-btn-sm" onClick={() => navigate('logs')}>
            બધી પ્રવૃત્તિ જુઓ →
          </button>
        </div>
        <div className="a-card-body" style={{ padding: '4px 22px' }}>
          {logs.length === 0 ? (
            <div className="a-empty" style={{ padding: '40px 24px' }}>
              <div className="a-empty-icon">📋</div>
              <p>હજુ સુધી કોઈ પ્રવૃત્તિ નથી</p>
            </div>
          ) : (
            <div className="sa-timeline">
              {logs.map(log => <TimelineItem key={log.id} log={log} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
