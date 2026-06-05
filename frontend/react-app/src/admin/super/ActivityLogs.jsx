import { useEffect, useState } from 'react'
import { superAdmin } from '../../lib/api'

export default function ActivityLogs() {
  const [logs,    setLogs]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(0)
  const PAGE_SIZE = 25

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true)
    try {
      const res = await superAdmin.getActivity({ page, limit: PAGE_SIZE, search })
      setLogs(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (ts) => new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

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
            className="a-input"
            placeholder="Search by admin, action or bhojanshala…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>
      </div>

      <div className="a-card">
        {loading ? (
          <div className="a-inline-loading"><div className="a-spinner" /></div>
        ) : logs.length === 0 ? (
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
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>
                      {fmt(log.createdAt)}
                    </td>
                    <td>
                      <div className="a-cell-main">{log.user?.name || '—'}</div>
                      <div className="a-cell-sub">
                        <span className={`a-badge ${log.user?.role === 'SUPER_ADMIN' ? 'a-badge-purple' : 'a-badge-blue'}`}>
                          {log.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.action}</td>
                    <td style={{ color: '#475569' }}>{log.bhojanshala?.nameEnglish || '—'}</td>
                    <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 240 }}>
                      {log.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="a-row" style={{ justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{total} total logs</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="a-btn a-btn-secondary a-btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: '#64748b', padding: '6px 0' }}>Page {page + 1}</span>
          <button className="a-btn a-btn-secondary a-btn-sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
