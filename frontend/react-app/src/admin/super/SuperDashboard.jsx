import { useEffect, useState } from 'react'
import { superAdmin } from '../../lib/api'

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="a-stat" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <div className="a-stat-icon">{icon}</div>
      <div className="a-stat-label">{label}</div>
      <div className="a-stat-value">{value ?? '—'}</div>
    </div>
  )
}

function LogItem({ log }) {
  const t       = new Date(log.createdAt)
  const timeStr = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <div className="a-log-item">
      <div className="a-log-dot" />
      <div className="a-log-body">
        <div className="a-log-action">{log.action}</div>
        <div className="a-log-meta">
          <strong>{log.user?.name || 'Admin'}</strong>
          {log.bhojanshala && <> · {log.bhojanshala.nameEnglish}</>}
          {log.description && <> — <span style={{ color: '#94a3b8' }}>{log.description}</span></>}
        </div>
      </div>
      <div className="a-log-time">{dateStr} {timeStr}</div>
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

  if (loading) return <div className="a-inline-loading"><div className="a-spinner" /></div>

  return (
    <div>
      <div className="a-stats-grid">
        <StatCard icon="🏛" label="Total Bhojanshalas"  value={stats?.totalBhojanshalas}  accent="#7c3aed" />
        <StatCard icon="👥" label="Total Admins"         value={stats?.totalAdmins}         accent="#3b82f6" />
        <StatCard icon="✅" label="Active"               value={stats?.activeBhojanshalas}  accent="#10b981" />
        <StatCard icon="⏸" label="Disabled"             value={stats?.disabledBhojanshalas} accent="#f59e0b" />
        <StatCard icon="📍" label="Cities Covered"       value={stats?.uniqueCities}         accent="#06b6d4" />
        <StatCard icon="🔄" label="Updated Today"        value={stats?.updatedToday}         accent="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="a-card">
          <div className="a-card-head">
            <span className="a-card-title">Quick Actions</span>
          </div>
          <div className="a-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="a-btn a-btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('bhojanshalas', { action: 'create' })}>
              + Add New Bhojanshala
            </button>
            <button className="a-btn a-btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('admins', { action: 'create' })}>
              + Create Admin User
            </button>
            <button className="a-btn a-btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('bhojanshalas')}>
              📋 Manage Bhojanshalas
            </button>
            <button className="a-btn a-btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('logs')}>
              📊 View Activity Logs
            </button>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <span className="a-card-title">Platform Summary</span>
          </div>
          <div className="a-card-body">
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Total Bhojanshalas',   stats?.totalBhojanshalas],
                  ['Registered Admins',    stats?.totalAdmins],
                  ['Currently Active',     stats?.activeBhojanshalas],
                  ['Currently Disabled',   stats?.disabledBhojanshalas],
                  ['Cities Covered',       stats?.uniqueCities],
                  ['Updated Today',        stats?.updatedToday],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '7px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{val ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="a-section-gap" />

      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Recent Activity</span>
          <button className="a-btn a-btn-secondary a-btn-sm" onClick={() => navigate('logs')}>View All</button>
        </div>
        <div className="a-card-body" style={{ padding: '8px 18px' }}>
          {logs.length === 0 ? (
            <div className="a-empty" style={{ padding: 24 }}>
              <div className="a-empty-icon">📋</div>
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="a-log-list">
              {logs.map(log => <LogItem key={log.id} log={log} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
