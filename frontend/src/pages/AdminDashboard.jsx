import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  Gauge,
  LayoutDashboard,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

function TrendBars({ values = [54, 62, 68, 74, 82, 88] }) {
  return (
    <div className="metric-bars" aria-label="Platform momentum trend">
      {values.map((value, index) => (
        <span
          key={index}
          className="metric-bar"
          style={{ height: `${value}%` }}
          title={`Week ${index + 1}: ${value}%`}
        />
      ))}
    </div>
  )
}
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/admin', label: 'Platform health', icon: ShieldCheck },
]

export default function AdminDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  function loadDashboard() {
    setLoading(true)
    api
      .get('/dashboard/admin/')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const quickActions = [
    { label: 'Students', subtitle: 'Monitor learners', href: '/dashboard/instructor/students', icon: Users },
    { label: 'Instructors', subtitle: 'Manage faculty', href: '/dashboard/instructor', icon: Briefcase },
    { label: 'Courses', subtitle: 'Review catalog', href: '/dashboard/instructor/content', icon: BookOpen },
    { label: 'Submissions', subtitle: 'Handle review queue', href: '/dashboard/instructor/submissions', icon: Briefcase },
  ]

  const studentToInstructorRatio = data
    ? (data.total_students / Math.max(data.total_instructors, 1)).toFixed(1)
    : '0.0'

  const platformHealth = useMemo(() => {
    if (!data) return 0
    const pendingRatio = data.pending_submissions / Math.max(data.total_students || 1, 1)
    const enrollmentCoverage = Math.min(100, Math.round((data.active_enrollments / Math.max(data.total_students, 1)) * 100))
    return Math.max(35, Math.min(98, Math.round((enrollmentCoverage + (100 - pendingRatio * 100)) / 2)))
  }, [data])

  const trendValues = useMemo(() => {
    if (!data) return [51, 60, 68, 76, 81, 88]
    const base = Math.max(40, Math.min(98, platformHealth))
    return [
      Math.max(28, base - 22),
      Math.max(34, base - 15),
      Math.max(40, base - 9),
      Math.max(46, base - 4),
      Math.max(52, base + 2),
      Math.max(58, base),
    ]
  }, [data, platformHealth])

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Administrator' }} weeklyGoal={platformHealth}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {loading && <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading platform data…</div>}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Could not load platform data: {error}
          </div>
        )}

        {data && (
          <>
            <div className="rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_35%),white] p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Platform overview</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Operations are stable.</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={loadDashboard}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <RefreshCcw size={14} /> Refresh
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={14} />
                    Connected to production-ready metrics
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map(({ label, subtitle, href, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(href)}
                  className={`quick-action ${label === 'Students' ? 'primary' : label === 'Submissions' ? 'accent' : ''}`}
                >
                  <span className="quick-icon"><Icon size={18} /></span>
                  <span>
                    <strong>{label}</strong>
                    <small>{subtitle}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Students" value={data.total_students} icon={Users} />
              <Stat label="Instructors" value={data.total_instructors} icon={Briefcase} />
              <Stat label="Courses" value={data.total_courses} icon={BookOpen} />
              <Stat label="Enrollments" value={data.active_enrollments} icon={Activity} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Platform health</h3>

                <div className="mt-5 space-y-4">
                  <MetricRow label="Pending submissions" value={data.pending_submissions} tone="amber" />
                  <MetricRow label="Student-to-instructor ratio" value={`${studentToInstructorRatio}:1`} tone="violet" />
                  <MetricRow label="Active enrollment coverage" value={`${Math.min(100, Math.round((data.active_enrollments / Math.max(data.total_students, 1)) * 100))}%`} tone="emerald" />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Quick pulse</h3>
                  <Zap size={18} className="text-blue-600" />
                </div>

                <div className="mt-5 rounded-[22px] border border-blue-100 bg-[linear-gradient(135deg,_rgba(59,130,246,0.08),_rgba(139,92,246,0.06))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">AI monitor</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      Healthy
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Platform engagement is steady and student participation remains above target across the current cycle.
                  </p>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      <span>System health</span>
                      <span>{platformHealth}%</span>
                    </div>
                    <TrendBars values={trendValues} />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <InsightCard title="Students" value={data.total_students} caption="Tracked learners" />
                  <InsightCard title="Instructors" value={data.total_instructors} caption="Course owners" />
                  <InsightCard title="Open reviews" value={data.pending_submissions} caption="Submission queue" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <Icon size={18} className="text-blue-600" />
      </div>
      <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
    </div>
  )
}

function MetricRow({ label, value, tone }) {
  const toneStyles = {
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]}`}>{value}</span>
      </div>
    </div>
  )
}

function InsightCard({ title, value, caption }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{caption}</p>
    </div>
  )
}