import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  CheckCircle2,
  LayoutDashboard,
  BookOpen,
  Award,
  LogOut,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: Award },
]

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

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }}>
      <Helmet>
        {/* Private, authenticated page — must never be indexed */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {loading && <p className="text-sm text-text-muted">Loading your dashboard…</p>}

        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">
            Couldn't load your dashboard: {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats — answers "where am I" */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">Courses enrolled</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.enrolled_courses.length}</p>
              </div>
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">Pending labs</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.pending_labs}</p>
              </div>
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">Recent grades</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.recent_grades.length}</p>
              </div>
            </div>

            {/* Enrolled courses — answers "what have I completed" and "what's next" */}
            <div className="space-y-4">
              {data.enrolled_courses.length === 0 && (
                <div className="rounded-2xl border border-line bg-paper p-6 text-sm text-text-muted">
                  You're not enrolled in any courses yet.
                </div>
              )}

              {data.enrolled_courses.map((course) => (
                <div key={course.course_id} className="rounded-2xl border border-line bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink">{course.course_title}</h3>
                    <span className="text-sm font-medium text-text-muted">
                      {course.progress_percent}% complete
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-raised">
                    <div
                      className="h-full rounded-full bg-coral"
                      style={{ width: `${course.progress_percent}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-text-muted">
                    {course.completed ? (
                      <span className="flex items-center gap-1.5 text-mint">
                        <CheckCircle2 size={16} /> Course complete
                      </span>
                    ) : course.current_module ? (
                      <>Current module: <span className="font-medium text-ink">{course.current_module}</span></>
                    ) : (
                      'No module in progress'
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent grades & feedback */}
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">Recent grades & feedback</h3>

              {data.recent_grades.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No graded work yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-text-muted">
                        <th className="pb-2 font-medium">Activity</th>
                        <th className="pb-2 font-medium">Grade</th>
                        <th className="pb-2 font-medium">Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_grades.map((g, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="py-3 font-medium text-ink">{g.activity}</td>
                          <td className="py-3 font-medium text-mint">{g.grade}</td>
                          <td className="py-3 text-text-muted">{g.feedback || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-coral"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </DashboardLayout>
  )
}
