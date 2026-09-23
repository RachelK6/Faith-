import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  FileCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

function TrendBars({ values = [58, 66, 73, 82, 88, 94] }) {
  return (
    <div className="metric-bars" aria-label="Cohort performance trend">
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
  { to: '/dashboard/instructor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/instructor/content', label: 'Course Content', icon: BookOpen },
  { to: '/dashboard/instructor/submissions', label: 'Submissions', icon: FileCheck },
  { to: '/dashboard/instructor/students', label: 'Students', icon: Users },
]

export default function InstructorDashboard() {
  const { auth, logout } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [gradingId, setGradingId] = useState(null)

  function loadDashboard() {
    api
      .get('/dashboard/instructor/')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleGrade(submissionId) {
    const grade = window.prompt('Grade (0–10):')
    if (grade === null) return
    const feedback = window.prompt('Feedback (optional):') || ''

    setGradingId(submissionId)
    try {
      await api.patch(`/submissions/${submissionId}/grade/`, {
        grade: Number(grade),
        feedback,
      })
      loadDashboard()
    } catch (err) {
      alert(`Couldn't grade this submission: ${err.message}`)
    } finally {
      setGradingId(null)
    }
  }

  const cohortHealth = useMemo(() => {
    if (!data) return 0
    const total = Math.max(data.pending_submission_count + data.students_falling_behind.length, 1)
    return Math.max(35, Math.min(98, 100 - Math.round((data.students_falling_behind.length / total) * 35) - Math.round((data.pending_submission_count / Math.max(total, 1)) * 15)))
  }, [data])

  const riskTrend = useMemo(() => {
    if (!data) return 0
    return Math.max(10, Math.min(92, 100 - data.pending_submission_count * 4 - data.students_falling_behind.length * 6))
  }, [data])

  const trendValues = useMemo(() => {
    if (!data) return [49, 63, 71, 79, 85, 86]
    const base = Math.max(42, Math.min(98, cohortHealth))
    return [
      Math.max(30, base - 24),
      Math.max(36, base - 16),
      Math.max(42, base - 10),
      Math.max(48, base - 5),
      Math.max(54, base + 3),
      Math.max(58, base),
    ]
  }, [cohortHealth, data])

  const aiInsightMessage = useMemo(() => {
    if (!data) return 'The cohort is stable and ready for the next learning cycle.'
    if (data.students_falling_behind.length > 0) {
      return `${data.students_falling_behind.length} learner${data.students_falling_behind.length > 1 ? 's are' : ' is'} now behind pace. Send a check-in and keep the review queue tight.`
    }
    if (data.pending_submission_count > 0) {
      return `${data.pending_submission_count} submission${data.pending_submission_count > 1 ? 's are' : ' is'} awaiting review. The cohort is healthy, but the queue needs a quick pass.`
    }
    return 'The cohort is stable and ready for the next learning cycle. Keep assignments focused and keep momentum steady.'
  }, [data])

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Instructor' }} weeklyGoal={cohortHealth}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {loading && <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading your dashboard…</div>}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Couldn't load your dashboard: {error}
          </div>
        )}

        {data && (
          <>
            <div className="rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.16),_transparent_35%),white] p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Instructor overview</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Your cohort is moving.</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  {data.pending_submission_count} items need attention
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <a href="/dashboard/instructor/content" className="quick-action primary">
                <span className="quick-icon"><BookOpen size={18} /></span>
                <span>
                  <strong>Courses</strong>
                  <small>Manage content</small>
                </span>
                <ArrowRight size={16} />
              </a>

              <a href="/dashboard/instructor/submissions" className="quick-action">
                <span className="quick-icon"><FileCheck size={18} /></span>
                <span>
                  <strong>Review</strong>
                  <small>Grade work</small>
                </span>
                <ArrowRight size={16} />
              </a>

              <a href="/dashboard/instructor/students" className="quick-action">
                <span className="quick-icon"><Users size={18} /></span>
                <span>
                  <strong>Students</strong>
                  <small>Track progress</small>
                </span>
                <ArrowRight size={16} />
              </a>

              <a href="/dashboard/instructor" className="quick-action accent">
                <span className="quick-icon"><Sparkles size={18} /></span>
                <span>
                  <strong>AI recap</strong>
                  <small>Insights</small>
                </span>
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pending</p>
                  <FileCheck size={18} className="text-violet-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{data.pending_submission_count}</p>
                <p className="mt-2 text-sm text-slate-500">Submissions to review</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Flagged</p>
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{data.students_falling_behind.length}</p>
                <p className="mt-2 text-sm text-slate-500">Students falling behind</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Courses</p>
                  <BookOpen size={18} className="text-emerald-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{data.my_courses.length}</p>
                <p className="mt-2 text-sm text-slate-500">Active course list</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Submissions to review</h3>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
                    {data.pending_submissions.length} waiting
                  </span>
                </div>

                {data.pending_submissions.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    Nothing pending right now — you’re caught up.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.pending_submissions.map((s) => (
                      <div key={s.submission_id} className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{s.student}</p>
                          <p className="mt-1 text-sm text-slate-600">{s.activity}</p>
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{s.course}</p>
                        </div>
                        <button
                          onClick={() => handleGrade(s.submission_id)}
                          disabled={gradingId === s.submission_id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {gradingId === s.submission_id ? 'Saving…' : 'Grade'}
                          {!gradingId && <ArrowRight size={15} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Need attention</h3>
                  <Zap size={18} className="text-amber-500" />
                </div>

                <div className="mt-5 rounded-[22px] border border-violet-100 bg-[linear-gradient(135deg,_rgba(139,92,246,0.08),_rgba(59,130,246,0.06))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">AI insight</p>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                      {riskTrend}% cohort health
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {aiInsightMessage}
                  </p>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      <span>Momentum</span>
                      <span>{cohortHealth}%</span>
                    </div>
                    <TrendBars values={trendValues} />
                  </div>
                </div>

                {data.students_falling_behind.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No students are currently flagged.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {data.students_falling_behind.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-[20px] border border-amber-100 bg-amber-50 p-3">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{s.student}</p>
                          <p className="text-xs text-slate-500">{s.course}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">My courses</h3>
              {data.my_courses.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">You haven’t created a course yet.</p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.my_courses.map((c) => (
                    <div key={c.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">Course</div>
                      <h4 className="mt-3 text-lg font-bold text-slate-900">{c.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </DashboardLayout>
  )
}
