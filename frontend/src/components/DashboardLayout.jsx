import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

export default function DashboardLayout({
  children,
  navItems = [],
  brandLabel = 'Optimum ERP LMS',
  user = { name: 'Amina Otieno' },
}) {
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="flex min-h-screen bg-panel">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-paper md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-line px-6 py-5">
          <span className="text-lg font-bold tracking-tight text-ink">{brandLabel}</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-coral-tint text-coral-dim'
                    : 'text-text-muted hover:bg-panel hover:text-ink'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
          <div>
            <p className="text-sm text-text-muted">Welcome back,</p>
            <h1 className="text-lg font-semibold text-ink">{user.name.split(' ')[0]}</h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative text-text-muted hover:text-ink"
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={20} strokeWidth={2} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-line bg-paper p-3 text-sm text-text-muted shadow-lg">
                  No new notifications.
                </div>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 hover:border-text-dim"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-xs font-semibold text-white">
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <span className="text-sm font-medium text-ink">{user.name}</span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-line bg-paper py-1 shadow-lg">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted hover:bg-panel hover:text-ink"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
