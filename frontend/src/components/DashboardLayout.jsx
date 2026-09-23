import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

export default function DashboardLayout({
  children,
  navItems = [],
  brandLabel = 'Optimum ERP LMS',
  user = { name: 'Amina Otieno' },
  weeklyGoal = 0,
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

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const goalPercent = Math.min(100, Math.max(0, Number(weeklyGoal) || 0))

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-200 md:flex md:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
            O
          </span>
          <div className="leading-none">
            <div className="text-base font-bold tracking-tight text-white">{brandLabel}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Learning hub</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Progress</p>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-200">
              <span>Weekly goal</span>
              <span className="font-semibold text-violet-300">{goalPercent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${goalPercent}%` }} />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Welcome back</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{user.name.split(' ')[0]}</h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:text-violet-700"
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={18} strokeWidth={2} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-xl">
                  No new notifications.
                </div>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition hover:border-violet-300"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-7">{children}</main>
      </div>
    </div>
  )
}
