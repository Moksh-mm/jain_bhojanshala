import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const SUPER_NAV = [
  { key: 'dashboard',    label: 'ડેશબોર્ડ',    icon: '🏠' },
  { key: 'bhojanshalas', label: 'ભોજનશાળા',    icon: '🍛' },
  { key: 'admins',       label: 'એડમિન',        icon: '👤' },
  { key: 'logs',         label: 'પ્રવૃત્તિ',     icon: '📜' },
]

function getGreeting(firstName) {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)  return `સુપ્રભાત, ${firstName} 🌅`
  if (h >= 12 && h < 17) return `જય જિનેન્દ્ર, ${firstName} 🙏`
  if (h >= 17 && h < 21) return `શુભ સાંજ, ${firstName} 🌆`
  return `જય જિનેન્દ્ર, ${firstName} 🙏`
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function NavLinks({ items, section, navigate, onClose }) {
  return (
    <nav className="a-sidebar-nav">
      {items.map(item => (
        <button
          key={item.key}
          className={`a-nav-item ${section === item.key ? 'active' : ''}`}
          onClick={() => { navigate(item.key); onClose?.() }}
        >
          <span className="a-nav-icon">{item.icon}</span>
          <span className="a-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default function AdminLayout({ children, section, navigate, goHome }) {
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const now = useClock()

  const initial   = (user?.name?.[0] || 'A').toUpperCase()
  const firstName = user?.name?.split(' ')[0] || 'Admin'
  const greeting  = getGreeting(firstName)

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  const handleSignOut = async () => {
    await signOut()
    goHome()
  }

  const SidebarContent = ({ onClose }) => (
    <>
      <div className="a-sidebar-top">
        <div className="a-brand">
          <div className="a-brand-mark">🛕</div>
          <div className="a-brand-text">
            <div className="a-brand-name">જૈન માહિતી પોર્ટલ</div>
            <div className="a-brand-role">Super Admin Portal</div>
          </div>
        </div>
        <NavLinks items={SUPER_NAV} section={section} navigate={navigate} onClose={onClose} />
      </div>

      <div className="a-sidebar-bottom">
        <div className="a-profile-row">
          <div className="a-avatar">{initial}</div>
          <div className="a-profile-info">
            <div className="a-profile-name">{user?.name || 'Admin'}</div>
            <div className="a-profile-sub">Super Admin</div>
          </div>
        </div>
        <div className="a-sidebar-actions">
          <button className="a-ghost-btn" onClick={goHome}>← વેબસાઇટ</button>
          <button className="a-ghost-btn danger" onClick={handleSignOut}>બહાર નીકળો</button>
        </div>
      </div>
    </>
  )

  return (
    <div className="a-shell">
      <aside className="a-sidebar">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="a-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="a-sidebar a-sidebar-mobile" onClick={e => e.stopPropagation()}>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="a-main">
        <header className="a-topbar">
          <button className="a-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 5h14M2 9h14M2 13h14"/>
            </svg>
          </button>

          <div className="a-topbar-greeting">
            <div className="a-topbar-greeting-main">{greeting}</div>
            <div className="a-topbar-greeting-sub">આપનું સ્વાગત છે — Super Admin Portal</div>
          </div>

          <div className="a-topbar-right">
            <div className="a-topbar-datetime">
              <div className="a-topbar-date">{dateStr}</div>
              <div className="a-topbar-time">{timeStr}</div>
            </div>
            <button className="a-topbar-bell" title="Notifications">
              <BellIcon />
            </button>
            <div className="a-topbar-avatar">{initial}</div>
          </div>
        </header>

        <div className="a-content">
          {children}
        </div>
      </div>
    </div>
  )
}
