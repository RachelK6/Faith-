import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Users,
  AlertTriangle,
  LogOut,
} from 'lucide-react'
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
      loadDashboard() // refresh so the graded item drops off the pending list
    } catch (err) {
      alert(`Couldn't grade this submission: ${err.message}`)
    } finally {
      setGradingId(null)
    }
  }

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Instructor' }}>
      <Helmet>
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
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">Pending submissions</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.pending_submission_count}</p>
              </div>
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">Students falling behind</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.students_falling_behind.length}</p>
              </div>
              <div className="rounded-xl border border-line bg-paper p-5">
                <p className="text-sm text-text-muted">My courses</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{data.my_courses.length}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Submissions to review — real grading, wired to the backend */}
              <div className="rounded-2xl border border-line bg-paper p-6 lg:col-span-2">
                <h3 className="font-semibold text-ink">Submissions to review</h3>

                {data.pending_submissions.length === 0 ? (
                  <p className="mt-3 text-sm text-text-muted">Nothing pending — you're caught up.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-line text-text-muted">
                          <th className="pb-2 font-medium">Student</th>
                          <th className="pb-2 font-medium">Activity</th>
                          <th className="pb-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pending_submissions.map((s) => (
                          <tr key={s.submission_id} className="border-b border-line last:border-0">
                            <td className="py-3 font-medium text-ink">{s.student}</td>
                            <td className="py-3 text-text-muted">
                              {s.activity}
                              <span className="block text-xs text-text-dim">{s.course}</span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleGrade(s.submission_id)}
                                disabled={gradingId === s.submission_id}
                                className="rounded-md bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                              >
                                {gradingId === s.submission_id ? 'Saving…' : 'Grade'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Students falling behind */}
              <div className="rounded-2xl border border-line bg-paper p-6">
                <h3 className="font-semibold text-ink">Falling behind</h3>
                {data.students_falling_behind.length === 0 ? (
                  <p className="mt-3 text-sm text-text-muted">No one flagged right now.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {data.students_falling_behind.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-coral" />
                        <div>
                          <p className="text-sm font-medium text-ink">{s.student}</p>
                          <p className="text-xs text-text-muted">{s.course}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My courses */}
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">My courses</h3>
              {data.my_courses.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">You haven't created a course yet.</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.my_courses.map((c) => (
                    <div key={c.id} className="rounded-xl border border-line p-5">
                      <h4 className="font-medium text-ink">{c.title}</h4>
                    </div>
                  ))}
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
