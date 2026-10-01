import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { LayoutDashboard, BookOpen, FileCheck, Users } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/instructor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/instructor/content', label: 'Course Content', icon: BookOpen },
  { to: '/dashboard/instructor/submissions', label: 'Submissions', icon: FileCheck },
  { to: '/dashboard/instructor/students', label: 'Students', icon: Users },
]

export default function InstructorStudents() {
  const { auth } = useAuth()
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/instructor/').then((d) => setCourses(d.my_courses || [])).catch((err) => setError(err.message))

    if (auth?.role === 'admin') {
      api.get('/dashboard/admin/').then((d) => setAllStudents(d.registered_students || [])).catch((err) => setError(err.message))
    }
  }, [auth?.role])

  // A direct user selection (the <select> below), not a prop changing —
  // reset + fetch belongs in the handler, not in an effect reacting to
  // state this same component just set.
  function handleSelectCourse(id) {
    setCourseId(id)
    if (!id) {
      setEnrollments([])
      return
    }
    api.get(`/enrollments/?course=${id}`).then(setEnrollments).catch((err) => setError(err.message))
  }

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Instructor' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-muted">Roster</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Students</h2>
        </div>

        {error && <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>}

        {!auth || auth.role !== 'admin' ? (
          <div className="rounded-2xl border border-line bg-paper p-6">
            <label className="mb-1.5 block text-sm font-medium text-ink">Course</label>
            <select
              value={courseId}
              onChange={(e) => handleSelectCourse(e.target.value)}
              className="w-full max-w-sm rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">Select a course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-paper p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">All registered students</p>
                <p className="text-xs text-text-dim">Includes learners who are not yet enrolled in any course.</p>
              </div>
            </div>
            <div className="divide-y divide-line">
              {allStudents.map((student) => (
                <div key={student.id} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{student.full_name || student.username}</p>
                    <p className="text-xs text-text-dim">{student.email}</p>
                  </div>
                  <p className="text-xs text-text-dim">
                    {student.enrolled_courses?.length
                      ? student.enrolled_courses.map((course) => course.title).join(' · ')
                      : 'Not enrolled yet'}
                  </p>
                </div>
              ))}
              {allStudents.length === 0 && <p className="py-3 text-sm text-text-muted">No registered students yet.</p>}
            </div>
          </div>
        )}

        {courseId && (
          <div className="rounded-2xl border border-line bg-paper p-5">
            <div className="divide-y divide-line">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.student_name || e.student_email}</p>
                    <p className="text-xs text-text-dim">{e.student_email}</p>
                  </div>
                  <p className="text-xs text-text-dim">Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
                </div>
              ))}
              {enrollments.length === 0 && <p className="py-3 text-sm text-text-muted">No students enrolled in this course yet.</p>}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
