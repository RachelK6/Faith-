import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Activity, BookOpen, LayoutDashboard, Users } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/instructor', label: 'Courses & submissions', icon: BookOpen },
]

export default function AdminDashboard() {
  const { auth } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/admin/').then(setData).catch((err) => setError(err.message))
  }, [])

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Administrator' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-muted">Platform overview</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Administrator dashboard</h2>
        </div>
        {error && <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">Could not load platform data: {error}</div>}
        {data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Students" value={data.total_students} icon={Users} />
            <Stat label="Instructors" value={data.total_instructors} icon={Users} />
            <Stat label="Courses" value={data.total_courses} icon={BookOpen} />
            <Stat label="Active enrollments" value={data.active_enrollments} icon={Activity} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <Icon size={20} className="text-coral" />
      <p className="mt-4 text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  )
}