// Example wiring only — copy the pattern into your real App.tsx / router.
// This file intentionally does not touch your existing routing or auth;
// it shows how the pieces in this kit fit together for one role.

import { useState } from 'react'
import { ToastProvider } from './hooks/useToast'
import { ScrollProgress } from './components/ScrollProgress'
import { DashboardHeader, type Notification, type Role } from './components/DashboardHeader'
import { DashboardSidebar, type NavItem } from './components/DashboardSidebar'
import { CommandPalette, useCommandPaletteHotkey, type Command } from './components/CommandPalette'
import { StudentDashboard } from './pages/StudentDashboard'
import { InstructorDashboard } from './pages/InstructorDashboard'
import { AdminDashboard } from './pages/AdminDashboard'

const NAV: Record<Role, NavItem[]> = {
  student: [
    { icon: 'home', label: 'Dashboard', href: '/dashboard' },
    { icon: 'book', label: 'My courses', href: '/courses' },
    { icon: 'flask', label: 'Daily labs', href: '/labs' },
    { icon: 'check', label: 'Submissions', href: '/submissions' },
    { icon: 'star', label: 'Grades', href: '/grades' },
  ],
  instructor: [
    { icon: 'home', label: 'Overview', href: '/dashboard' },
    { icon: 'layers', label: 'Courses', href: '/courses' },
    { icon: 'check', label: 'Submissions', href: '/submissions' },
    { icon: 'users', label: 'Students', href: '/students' },
    { icon: 'chart', label: 'Analytics', href: '/analytics' },
  ],
  admin: [
    { icon: 'home', label: 'Overview', href: '/dashboard' },
    { icon: 'users', label: 'Users', href: '/users' },
    { icon: 'book', label: 'Courses', href: '/courses' },
    { icon: 'chart', label: 'Analytics', href: '/analytics' },
    { icon: 'gear', label: 'Settings', href: '/settings' },
  ],
}

const NOTIFICATIONS: Record<Role, Notification[]> = {
  student: [
    { icon: 'flask', title: 'Day 2 Lab graded', body: 'You scored 88%', when: '2m' },
    { icon: 'book', title: 'New lesson unlocked', body: 'DOM Manipulation', when: '1h' },
  ],
  instructor: [{ icon: 'check', title: '3 new submissions', body: 'Day 3 Lab: Interactivity', when: '5m' }],
  admin: [{ icon: 'users', title: '3 new sign-ups', body: 'Full-Stack Web Dev', when: '8m' }],
}

/**
 * In your real app, `role` and the current user's name come from your auth
 * context / route guard — never from a client-side switcher. The tabbed
 * switcher in the earlier HTML preview was a design-preview convenience only.
 */
export function DashboardShellExample({ role, userName }: { role: Role; userName: string }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [unread, setUnread] = useState(NOTIFICATIONS[role].length)

  useCommandPaletteHotkey(() => setPaletteOpen(true))

  const commands: Command[] = [
    { label: 'Go to dashboard', shortcut: '1', run: () => (window.location.href = '/dashboard') },
    { label: 'Go to courses', shortcut: '2', run: () => (window.location.href = '/courses') },
  ]

  return (
    <ToastProvider>
      <div data-role={role}>
        <ScrollProgress />
        <DashboardHeader
          role={role}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          notifications={NOTIFICATIONS[role]}
          unreadCount={unread}
          onMarkAllRead={() => setUnread(0)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', minHeight: 'calc(100% - 52px)' }}>
          <DashboardSidebar items={NAV[role]} activeHref="/dashboard" userName={userName} userSubtitle={role[0].toUpperCase() + role.slice(1)} />
          {role === 'student' && <StudentDashboard studentName={userName} />}
          {role === 'instructor' && <InstructorDashboard instructorName={userName} />}
          {role === 'admin' && <AdminDashboard />}
        </div>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      </div>
    </ToastProvider>
  )
}
