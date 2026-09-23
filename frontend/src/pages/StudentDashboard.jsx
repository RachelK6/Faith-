import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Gauge,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'

function TrendBars({ values = [66, 72, 77, 88, 91, 96] }) {
  return (
    <div className="metric-bars" aria-label="Performance trend">
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
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: Award },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function ProgressRing({ percent, size = 92, stroke = 8 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#studentProgressGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="studentProgressGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-bold text-slate-900">{percent}%</span>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-[28px] border border-slate-200 bg-white" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-[24px] border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 rounded-[24px] border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { auth, logout } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/dashboard/student/')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const firstName = (auth?.email || 'Student').split('@')[0]

  const overallProgress = useMemo(() => {
    if (!data?.enrolled_courses?.length) return 0
    const total = data.enrolled_courses.reduce((sum, c) => sum + (c.progress_percent || 0), 0)
    return Math.round(total / data.enrolled_courses.length)
  }, [data])

  const continueCourse = useMemo(() => {
    return data?.enrolled_courses?.find((c) => !c.completed && c.current_module) || null
  }, [data])

  const completedCount = data?.enrolled_courses?.filter((c) => c.completed)?.length || 0

  const weeklyGoal = useMemo(() => {
    if (!data) return 0

    const averageGrade =
      data.recent_grades.length > 0
        ? data.recent_grades.reduce((sum, item) => sum + Number(item.grade || 0), 0) /
          data.recent_grades.length
        : 0

    const goalFromProgress = Math.round((overallProgress + averageGrade) / 2)
    const labPenalty = Math.min(15, (data.pending_labs || 0) * 3)

    return Math.min(100, Math.max(10, goalFromProgress - labPenalty))
  }, [data, overallProgress])

  const momentum = useMemo(() => {
    return Math.min(100, Math.max(0, weeklyGoal + 8))
  }, [weeklyGoal])

  const trendValues = useMemo(() => {
    if (!data) return [52, 60, 68, 76, 84, 91]

    const base = Math.max(35, weeklyGoal)
    return [
      Math.max(22, base - 25),
      Math.max(30, base - 18),
      Math.max(34, base - 10),
      Math.max(40, base - 4),
      Math.max(48, base + 4),
      Math.max(50, base),
    ]
  }, [data, weeklyGoal])

  const aiCoachMessage = useMemo(() => {
    if (!data) return 'Your learning rhythm looks healthy — keep your next session focused.'

    if (data.pending_labs > 0) {
      return `You have ${data.pending_labs} pending lab${data.pending_labs > 1 ? 's' : ''}. Prioritize one short review block and finish the active task before moving on.`
    }

    if (overallProgress >= 80) {
      return 'You are ahead of pace. Keep this momentum by finishing the next module and locking in a final review pass.'
    }

    if (overallProgress < 35) {
      return 'You are still in the setup phase. Start with the next course module and try a focused 25-minute session to build momentum.'
    }

    return 'Your learning rhythm looks healthy — keep your next session focused and maintain the pace you built this week.'
  }, [data, overallProgress])

  const averageGrade = useMemo(() => {
    if (!data?.recent_grades?.length) return 0
    const total = data.recent_grades.reduce((sum, item) => sum + Number(item.grade || 0), 0)
    return Math.round(total / data.recent_grades.length)
  }, [data])

  const focusLabel = useMemo(() => {
    if (overallProgress >= 80) return 'Strong pace'
    if (overallProgress >= 55) return 'Steady focus'
    if (data?.pending_labs > 0) return 'Needs attention'
    return 'Building rhythm'
  }, [data, overallProgress])

  const assignmentsLeft = useMemo(() => Math.max(0, data?.pending_labs || 0), [data])
  const weeklyDelta = useMemo(() => {
    if (!data) return 0
    const delta = Math.max(0, Math.round((weeklyGoal - Math.max(40, overallProgress)) / 2))
    return delta > 0 ? delta : 0
  }, [data, overallProgress, weeklyGoal])

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }} weeklyGoal={weeklyGoal}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {loading && <DashboardSkeleton />}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Couldn't load your dashboard: {error}
          </div>
        )}

        {data && (
          <>
            <div className="rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.16),_transparent_34%),white] p-6 shadow-sm">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-5">
                  <ProgressRing percent={overallProgress} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{getGreeting()}</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{firstName}</h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-600">
                      {overallProgress === 0
                        ? "You haven't started yet — choose a course to build momentum."
                        : `You are ${overallProgress}% through your current learning path.`}
                    </p>
                  </div>
                </div>

                {continueCourse ? (
                  <Link
                    to={`/dashboard/student/courses/${continueCourse.course_id}`}
                    className="group inline-flex items-center justify-between gap-4 rounded-[22px] bg-slate-950 px-5 py-4 text-left text-white shadow-lg shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/20"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                        <Sparkles size={14} /> Continue learning
                      </p>
                      <p className="mt-2 text-lg font-bold">{continueCourse.current_module}</p>
                      <p className="text-sm text-slate-300">{continueCourse.course_title}</p>
                    </div>
                    <ArrowRight size={20} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                    No active course yet
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link to="/dashboard/student/courses" className="quick-action primary">
                <span className="quick-icon"><BookOpen size={18} /></span>
                <span>
                  <strong>My courses</strong>
                  <small>Open syllabus</small>
                </span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/dashboard/student/grades" className="quick-action">
                <span className="quick-icon"><Award size={18} /></span>
                <span>
                  <strong>Grades</strong>
                  <small>Track results</small>
                </span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/dashboard/student/courses" className="quick-action" type="button">
                <span className="quick-icon"><CalendarRange size={18} /></span>
                <span>
                  <strong>Planner</strong>
                  <small>Review week</small>
                </span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/dashboard/student/grades" className="quick-action accent" type="button">
                <span className="quick-icon"><Zap size={18} /></span>
                <span>
                  <strong>AI coach</strong>
                  <small>Focus tips</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Enrolled</p>
                  <BookOpen size={18} className="text-violet-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{data.enrolled_courses.length}</p>
                <p className="mt-2 text-sm text-slate-500">Courses in progress</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pending labs</p>
                  <Clock3 size={18} className="text-cyan-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{data.pending_labs}</p>
                <p className="mt-2 text-sm text-slate-500">Needs attention</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Completed</p>
                  <Target size={18} className="text-emerald-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{completedCount}</p>
                <p className="mt-2 text-sm text-slate-500">Courses finished</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Your learning path</h3>
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
                    <TrendingUp size={12} /> {overallProgress}%
                  </span>
                </div>

                <div className="space-y-4">
                  {data.enrolled_courses.length === 0 && (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No courses enrolled yet.
                    </div>
                  )}

                  {data.enrolled_courses.map((course) => (
                    <div key={course.course_id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Course</p>
                          <h4 className="mt-2 text-lg font-bold text-slate-900">{course.course_title}</h4>
                        </div>
                        <span className="text-sm font-semibold text-slate-500">{course.progress_percent}%</span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-[width] duration-500 ease-out"
                          style={{ width: `${course.progress_percent}%` }}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-600">
                          {course.completed ? (
                            <span className="inline-flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 size={16} /> Course complete
                            </span>
                          ) : course.current_module ? (
                            <>
                              Current module: <span className="font-semibold text-slate-900">{course.current_module}</span>
                            </>
                          ) : (
                            'No module in progress'
                          )}
                        </p>
                        <Link
                          to={`/dashboard/student/courses/${course.course_id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-800"
                        >
                          Open <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm floating-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Performance pulse</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    <Gauge size={12} /> Live
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="insight-pill">{focusLabel}</span>
                  <span className="insight-pill alt">{assignmentsLeft} assignment{assignmentsLeft === 1 ? '' : 's'} left</span>
                  <span className="insight-pill soft">Avg score {averageGrade || 0}%</span>
                </div>

                <div className="mt-5 rounded-[22px] border border-violet-100 bg-[linear-gradient(135deg,_rgba(139,92,246,0.08),_rgba(59,130,246,0.06))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">AI coach</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      +{weeklyDelta}% this week
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {aiCoachMessage}
                  </p>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      <span>Momentum</span>
                      <span>{momentum}%</span>
                    </div>
                    <TrendBars values={trendValues} />
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recent grades</h4>

                  {data.recent_grades.length === 0 ? (
                    <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No graded work yet.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {data.recent_grades.map((g, i) => (
                        <div key={i} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">{g.activity}</p>
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {g.grade}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{g.feedback || 'Keep going — more feedback will appear here as assignments are graded.'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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