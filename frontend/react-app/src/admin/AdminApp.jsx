import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'
import SuperDashboard from './super/SuperDashboard'
import BhojanshalaManagement from './super/BhojanshalaManagement'
import AdminManagement from './super/AdminManagement'
import ActivityLogs from './super/ActivityLogs'
import MyDashboard from './bhojanshala/MyDashboard'
import MealEditor from './bhojanshala/MealEditor'
import './admin.css'

export default function AdminApp({ goHome }) {
  const { user, profile, loading, isSuperAdmin } = useAuth()
  const [section,    setSection]    = useState('dashboard')
  const [navPayload, setNavPayload] = useState(null)

  const navigate = (s, payload = null) => {
    setSection(s)
    setNavPayload(payload)
  }

  if (loading) {
    return (
      <div className="a-full-loading">
        <div className="a-spinner" />
      </div>
    )
  }

  if (!user || !profile) return <AdminLogin goHome={goHome} />

  if (profile.status === 'disabled') {
    return (
      <div className="a-full-loading" style={{ flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 36 }}>🚫</div>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Account Disabled</h2>
        <p style={{ color: '#64748b', margin: 0 }}>Your account has been disabled. Contact the Super Admin.</p>
        <button
          style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}
          onClick={goHome}
        >
          ← Back to website
        </button>
      </div>
    )
  }

  const renderContent = () => {
    if (isSuperAdmin) {
      switch (section) {
        case 'dashboard':    return <SuperDashboard navigate={navigate} />
        case 'bhojanshalas': return <BhojanshalaManagement navigate={navigate} payload={navPayload} />
        case 'admins':       return <AdminManagement navigate={navigate} />
        case 'logs':         return <ActivityLogs />
        default:             return <SuperDashboard navigate={navigate} />
      }
    } else {
      // Bhojanshala Admin — only their assigned bhojanshala
      switch (section) {
        case 'dashboard': return <MyDashboard navigate={navigate} />
        case 'meals':     return <MealEditor bhojId={profile.bhojanshala_id} navigate={navigate} />
        default:          return <MyDashboard navigate={navigate} />
      }
    }
  }

  return (
    <AdminLayout section={section} navigate={navigate} goHome={goHome}>
      {renderContent()}
    </AdminLayout>
  )
}
