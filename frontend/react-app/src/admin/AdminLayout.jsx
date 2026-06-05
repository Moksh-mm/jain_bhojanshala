import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const SUPER_NAV = [
  { key: 'dashboard',    label: 'Dashboard',     icon: '⊞' },
  { key: 'bhojanshalas', label: 'Bhojanshalas',  icon: '🏛' },
  { key: 'admins',       label: 'Admin Users',   icon: '👥' },
  { key: 'logs',         label: 'Activity Logs', icon: '📋' },
]

const ADMIN_NAV = [
  { key: 'dashboard', label: 'My Dashboard', icon: '⊞' },
  { key: 'meals',     label: 'Meal Editor',  icon: '🍽' },
]

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
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default function AdminLayout({ children, section, navigate, goHome }) {
  const { user, signOut, isSuperAdmin } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nav       = isSuperAdmin ? SUPER_NAV : ADMIN_NAV
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Bhojanshala Admin'
  const initial   = (user?.name?.[0] || 'A').toUpperCase()
  const pageTitle = nav.find(n => n.key === section)?.label || 'Dashboard'

  const handleSignOut = async () => {
    await signOut()
    goHome()
  }

  const SidebarContent = ({ onClose }) => (
    <>
      <div className="a-sidebar-top">
        <div className="a-brand">
          <div className="a-brand-mark">JB</div>
          <div>
            <div className="a-brand-name">Jain Bhojanshala</div>
            <div className="a-brand-role">{roleLabel}</div>
          </div>
        </div>
        <NavLinks items={nav} section={section} navigate={navigate} onClose={onClose} />
      </div>

      <div className="a-sidebar-bottom">
        <div className="a-profile-row">
          <div className="a-avatar">{initial}</div>
          <div>
            <div className="a-profile-name">{user?.name || 'Admin'}</div>
            <div className="a-profile-sub">{roleLabel}</div>
          </div>
        </div>
        <div className="a-sidebar-actions">
          <button className="a-ghost-btn" onClick={goHome}>← Website</button>
          <button className="a-ghost-btn danger" onClick={handleSignOut}>Sign Out</button>
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
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 5h14M2 9h14M2 13h14"/>
            </svg>
          </button>
          <h1 className="a-page-title">{pageTitle}</h1>
          <div className="a-topbar-right">
            <div className="a-avatar sm">{initial}</div>
          </div>
        </header>

        <div className="a-content">
          {children}
        </div>
      </div>
    </div>
  )
}
