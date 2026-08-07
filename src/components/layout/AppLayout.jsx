import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  SquaresFour, Sparkle, ClockCounterClockwise, Star,
  SignOut, List, X, FileCode
} from '@phosphor-icons/react'
import './AppLayout.css'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: SquaresFour, label: 'Dashboard' },
    { to: '/generate',  icon: Sparkle,     label: 'Generate' },
    { to: '/history',   icon: ClockCounterClockwise, label: 'History' },
    { to: '/favorites', icon: Star,        label: 'Favorites' }
  ]

  return (
    <div className="app-layout">
      
      {/* Mobile Toggle */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
      </button>

      {/* Floating App Shell */}
      <div className="app-shell">
        
        {/* Sidebar */}
        <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <FileCode size={32} weight="duotone" className="brand-icon" />
            <span className="font-serif italic text-3xl tracking-tight text-[var(--color-primary)]">Orator</span>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={20} weight={location.pathname === item.to ? "fill" : "duotone"} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            {user && (
              <div className="user-badge" title={user.email}>
                <div className="user-badge-dot"></div>
                {user.email.split('@')[0]}
              </div>
            )}
            
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '9999px', color: 'var(--color-error)' }} onClick={handleLogout}>
              <SignOut size={20} weight="bold" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content (Canvas) */}
        <main className="app-main">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
