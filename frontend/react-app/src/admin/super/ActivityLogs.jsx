import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase/client'

export default function ActivityLogs() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [page,    setPage]    = useState(0)
  const PAGE_SIZE = 25

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles(name, role)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    setLogs(data || [])
    setLoading(false)
  }

  const filtered = filter
    ? logs.filter(l =>
        l.action?.toLowerCase().includes(filter.toLowerCase()) ||
        l.profiles?.name?.toLowerCase().includes(filter.toLowerCase()) ||
        l.details?.bhojanshala_name?.toLowerCase().includes(filter.toLowerCase())
      )
    : logs

  const fmt = (ts) => {
    const d = new Date(ts)
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="a-page-head">
        <h2 className="a-page-heading">Activity Logs</h2>
        <button className="a-btn a-btn-secondary a-btn-sm" onClick={load}>↺ Refresh</button>
      </div>

      <div className="a-search-row">
        <div className="a-search-wrap">
          <span className="a-search-icon">🔍</span>
          <input
            className="a-input" placeholder="Search by admin, action or bhojanshala…"
            value={filter} onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-icon">📋</div>
            <p>No logs found</p>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Bhojanshala</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>
                      {fmt(log.created_at)}
                    </td>
                    <td>
                      <div className="a-cell-main">{log.profiles?.name || '—'}</div>
                      <div className="a-cell-sub">
                        <span className={`a-badge ${log.profiles?.role === 'super_admin' ? 'a-badge-purple' : 'a-badge-blue'}`}>
                          {log.profiles?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.action}</td>
                    <td style={{ color: '#475569' }}>{log.details?.bhojanshala_name || log.bhojanshala_id || '—'}</td>
                    <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 240 }}>
                      {log.details && Object.keys(log.details).filter(k => k !== 'bhojanshala_name').length > 0
                        ? Object.entries(log.details)
                            .filter(([k]) => k !== 'bhojanshala_name')
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                            .join(', ')
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="a-row" style={{ justifyContent: 'center', marginTop: 16, gap: 8 }}>
        <button className="a-btn a-btn-secondary a-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          ← Prev
        </button>
        <span style={{ fontSize: 13, color: '#64748b' }}>Page {page + 1}</span>
        <button className="a-btn a-btn-secondary a-btn-sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
          Next →
        </button>
      </div>
    </div>
  )
}
