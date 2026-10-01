import { useState } from 'react'
import { Icon } from './ui/icons'
import { useTheme } from '../hooks/useDashboardFx'

export type Role = 'student' | 'instructor' | 'admin'

export type Notification = { icon: Parameters<typeof Icon>[0]['name']; title: string; body: string; when: string }

export function DashboardHeader({
  role,
  onRoleChange,
  showRoleSwitcher = false,
  onOpenCommandPalette,
  notifications,
  unreadCount,
  onMarkAllRead,
}: {
  role: Role
  onRoleChange?: (r: Role) => void
  /** The in-header role switcher is a design-preview convenience only — keep it off (default) in production and drive `role` from your real auth/route instead. */
  showRoleSwitcher?: boolean
  onOpenCommandPalette: () => void
  notifications: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
}) {
  const { toggle } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 22px',
        background: 'color-mix(in srgb, var(--card) 88%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 16 }}>
        {/* Copy brand/logo-mark.svg into your public/ folder (or import it as an asset) as logo-mark.svg */}
        <img src="/logo-mark.svg" width={34} height={34} alt="" style={{ filter: 'drop-shadow(0 6px 12px color-mix(in srgb, var(--acc) 40%, transparent))' }} />
        <span>Optimum LMS</span>
      </div>

      {showRoleSwitcher && onRoleChange && (
        <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 3 }}>
          {(['student', 'instructor', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              style={{
                border: 0,
                background: r === role ? 'var(--acc)' : 'none',
                color: r === role ? '#fff' : 'var(--mut)',
                font: '600 13px inherit',
                padding: '7px 16px',
                borderRadius: 9,
                cursor: 'pointer',
              }}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginLeft: showRoleSwitcher ? 12 : 'auto' }}>
        <IconButton label="Quick actions (Ctrl/Cmd K)" onClick={onOpenCommandPalette}>
          <Icon name="search" />
        </IconButton>
        <IconButton label="Toggle light or dark" onClick={toggle}>
          <Icon name="sun" />
        </IconButton>
        <div style={{ position: 'relative' }}>
          <IconButton label="Notifications" onClick={() => setOpen((o) => !o)}>
            <Icon name="bell" />
            {unreadCount > 0 && (
              <i
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--bad)',
                }}
              />
            )}
          </IconButton>
          {open && (
            <div
              style={{
                position: 'absolute',
                top: 46,
                right: 0,
                width: 'min(350px, calc(100vw - 24px))',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 22,
                padding: 14,
                boxShadow: '0 30px 60px -24px #000c',
                zIndex: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px 8px' }}>
                <b>Notifications</b>
                <button className="dg-gb dg-g2" onClick={onMarkAllRead}>
                  Mark all read
                </button>
              </div>
              {notifications.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 14, alignItems: 'flex-start' }}>
                  <span className="dg-ic" style={{ float: 'none', flex: 'none' }}>
                    <Icon name={n.icon} />
                  </span>
                  <div>
                    <b>{n.title}</b>
                    <small style={{ color: 'var(--mut)', display: 'block' }}>{n.body}</small>
                  </div>
                  <u style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mut)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{n.when}</u>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 38,
        height: 38,
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'var(--card)',
        color: 'var(--ink)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
