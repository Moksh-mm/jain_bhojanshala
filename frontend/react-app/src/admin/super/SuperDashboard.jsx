import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase/client'

function StatCard({ icon, label, value, meta, accent }) {
  return (
    <div className="a-stat" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <div className="a-stat-icon">{icon}</div>
      <div className="a-stat-label">{label}</div>
      <div className="a-stat-value">{value ?? '—'}</div>
      {meta && <div className="a-stat-meta">{meta}</div>}
    </div>
  )
}

function LogItem({ log }) {
  const t = new Date(log.created_at)
  const timeStr = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const bhojName = log.details?.bhojanshala_name || log.bhojanshala_id || '—'

  return (
    <div className="a-log-item">
      <div className="a-log-dot" />
      <div className="a-log-body">
        <div className="a-log-action">{log.action}</div>
        <div className="a-log-meta">
          <strong>{log.profiles?.name || 'Admin'}</strong>
          {bhojName !== '—' && <> · {bhojName}</>}
        </div>
      </div>
      <div className="a-log-time">{dateStr} {timeStr}</div>
    </div>
  )
}

export default function SuperDashboard({ navigate }) {
  const [stats,  setStats]  = useState(null)
  const [logs,   setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      { count: totalBhoj },
      { count: totalAdmins },
      { count: enabledBhoj },
      { count: disabledBhoj },
      { data: cities },
      { data: recentLogs },
      { count: updatedToday },
    ] = await Promise.all([
      supabase.from('bhojanshalas').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('bhojanshalas').select('*', { count: 'exact', head: true }).eq('enabled', true),
      supabase.from('bhojanshalas').select('*', { count: 'exact', head: true }).eq('enabled', false),
      supabase.from('bhojanshalas').select('city_en').eq('enabled', true),
      supabase
        .from('activity_logs')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('bhojanshalas')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', today.toISOString()),
    ])

    const uniqueCities = new Set((cities || []).map(r => r.city_en)).size

    setStats({
      totalBhoj:    totalBhoj   ?? 0,
      totalAdmins:  totalAdmins ?? 0,
      enabledBhoj:  enabledBhoj ?? 0,
      disabledBhoj: disabledBhoj ?? 0,
      uniqueCities: uniqueCities,
      updatedToday: updatedToday ?? 0,
    })
    setLogs(recentLogs || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="a-inline-loading"><div className="a-spinner" /></div>
  )

  return (
    <div>
      {/* Stats */}
      <div className="a-stats-grid">
        <StatCard icon="🏛"  label="Total Bhojanshalas" value={stats.totalBhoj}    accent="#7c3aed" />
        <StatCard icon="👥"  label="Total Admins"        value={stats.totalAdmins}  accent="#3b82f6" />
        <StatCard icon="✅"  label="Active (Enabled)"    value={stats.enabledBhoj}  accent="#10b981" />
        <StatCard icon="⏸"  label="Disabled"            value={stats.disabledBhoj} accent="#f59e0b" />
        <StatCard icon="📍"  label="Cities Covered"      value={stats.uniqueCities} accent="#06b6d4" />
        <StatCard icon="🔄"  label="Updated Today"       value={stats.updatedToday} accent="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quick actions */}
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

        {/* Summary */}
        <div className="a-card">
          <div className="a-card-head">
            <span className="a-card-title">Platform Summary</span>
          </div>
          <div className="a-card-body">
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Total Bhojanshalas',  stats.totalBhoj],
                  ['Registered Admins',   stats.totalAdmins],
                  ['Currently Active',    stats.enabledBhoj],
                  ['Currently Disabled',  stats.disabledBhoj],
                  ['Cities Covered',      stats.uniqueCities],
                  ['Updated Today',       stats.updatedToday],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td style={{ padding: '7px 0', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="a-section-gap" />

      {/* Recent activity */}
      <div className="a-card">
        <div className="a-card-head">
          <span className="a-card-title">Recent Activity</span>
          <button className="a-btn a-btn-secondary a-btn-sm" onClick={() => navigate('logs')}>
            View All
          </button>
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
