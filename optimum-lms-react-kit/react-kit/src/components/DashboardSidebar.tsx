import { useState } from 'react'
import { Icon } from './ui/icons'
import { Avatar } from './ui/Basics'

export type NavItem = { icon: Parameters<typeof Icon>[0]['name']; label: string; href: string }

export function DashboardSidebar({
  items,
  activeHref,
  userName,
  userSubtitle,
}: {
  items: NavItem[]
  activeHref: string
  userName: string
  userSubtitle: string
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav
      style={{
        background: 'linear-gradient(180deg, var(--side), color-mix(in srgb, var(--side) 70%, var(--h1)))',
        color: '#fff',
        padding: '20px 14px',
        position: 'sticky',
        top: 52,
        height: 'calc(100vh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: collapsed ? 78 : 230,
        transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
        overflow: 'hidden',
      }}
    >
      {items.map((item) => {
        const active = item.href === activeHref
        return (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              gap: 11,
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: 11,
              textDecoration: 'none',
              fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: active ? '#fff' : '#ffffffa8',
              background: active ? 'linear-gradient(90deg, var(--acc), color-mix(in srgb, var(--acc) 60%, #fff))' : 'transparent',
              boxShadow: active ? '0 8px 20px -8px var(--acc)' : 'none',
            }}
          >
            <Icon name={item.icon} />
            {!collapsed && <span>{item.label}</span>}
          </a>
        )
      })}

      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label="Collapse sidebar"
        style={{
          marginTop: 'auto',
          display: 'flex',
          gap: 11,
          alignItems: 'center',
          background: 'none',
          border: 0,
          color: '#ffffff8c',
          padding: '10px 12px',
          borderRadius: 11,
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform .5s' }}>
          <Icon name="chevronLeft" />
        </span>
        {!collapsed && <span>Collapse</span>}
      </button>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: 12,
          borderRadius: 14,
          background: '#ffffff12',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Avatar name={userName} />
        {!collapsed && (
          <div>
            <b>{userName}</b>
            <div style={{ fontSize: 11.5, color: '#ffffff8c' }}>{userSubtitle}</div>
          </div>
        )}
      </div>
    </nav>
  )
}
