import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ClipboardList, GraduationCap, Check } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: GraduationCap },
]

export default function CourseCatalog() {
  const { auth } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/courses/'), api.get('/enrollments/')])
      .then(([courseList, myEnrollments]) => {
        setCourses(courseList)
        setEnrollments(myEnrollments)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course))

  async function handleEnroll(courseId) {
    setEnrollingId(courseId)
    setError('')
    try {
      const enrollment = await api.post('/enrollments/', { course: courseId })
      setEnrollments([...enrollments, enrollment])
    } catch (err) {
      setError(err.message)
    } finally {
      setEnrollingId(null)
    }
  }

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-muted">Catalog</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Courses</h2>
        </div>

        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted">Loading courses…</p>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-6 text-sm text-text-muted">
            No courses have been created yet. Ask an instructor to add one.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              const coverImage = course.thumbnail_url || (course.thumbnail ? `http://localhost:8000/${course.thumbnail}` : null)

              return (
                <div key={course.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper">
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                    {coverImage ? (
                      <img src={coverImage} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 to-coral-tint text-coral-dim">
                        <ClipboardList size={28} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-ink">{course.title}</h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">{course.description}</p>
                    <p className="mt-2 text-xs text-text-dim">
                      {course.module_count} module{course.module_count === 1 ? '' : 's'} · {course.instructor_name}
                    </p>

                    {isEnrolled ? (
                      <Link
                        to={`/dashboard/student/courses/${course.id}`}
                        className="mt-4 flex items-center justify-center gap-1.5 rounded-md bg-mint/15 py-2 text-sm font-medium text-mint hover:bg-mint/25"
                      >
                        <Check size={16} /> Enrolled — continue
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingId === course.id}
                        className="mt-4 rounded-md bg-coral py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                      >
                        {enrollingId === course.id ? 'Enrolling…' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
