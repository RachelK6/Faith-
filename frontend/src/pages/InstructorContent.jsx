import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { LayoutDashboard, BookOpen, FileCheck, Users, Upload, Plus, FileText } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/instructor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/instructor/content', label: 'Course Content', icon: BookOpen },
  { to: '/dashboard/instructor/submissions', label: 'Submissions', icon: FileCheck },
  { to: '/dashboard/instructor/students', label: 'Students', icon: Users },
]

export default function InstructorContent() {
  const { auth } = useAuth()

  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')

  const [modules, setModules] = useState([])
  const [moduleId, setModuleId] = useState('')
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const [lessons, setLessons] = useState([])
  const [lessonId, setLessonId] = useState('')
  const [newLesson, setNewLesson] = useState({ title: '', video_url: '', tutorial_content: '' })

  const [attachments, setAttachments] = useState([])
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfFile, setPdfFile] = useState(null)

  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // My courses (instructor-owned, from the dashboard endpoint which
  // already scopes courses to the logged-in instructor).
  useEffect(() => {
    api.get('/dashboard/instructor/')
      .then((d) => setCourses(d.my_courses || []))
      .catch((err) => setError(err.message))
  }, [])

  // Modules for the selected course
  useEffect(() => {
    setModuleId('')
    setModules([])
    setLessons([])
    setLessonId('')
    if (!courseId) return
    api.get(`/modules/?course=${courseId}`).then(setModules).catch((err) => setError(err.message))
  }, [courseId])

  // Lessons for the selected module
  useEffect(() => {
    setLessonId('')
    setLessons([])
    if (!moduleId) return
    api.get(`/lessons/?module=${moduleId}`).then(setLessons).catch((err) => setError(err.message))
  }, [moduleId])

  // Selected lesson's video URL (kept editable) and attachments
  const selectedLesson = lessons.find((l) => String(l.id) === String(lessonId))
  const [videoUrl, setVideoUrl] = useState('')
  useEffect(() => {
    setVideoUrl(selectedLesson?.video_url || '')
    setAttachments(selectedLesson?.attachments || [])
  }, [selectedLesson])

  function flash(message) {
    setStatus(message)
    setError('')
    setTimeout(() => setStatus(''), 3000)
  }

  async function handleAddModule(e) {
    e.preventDefault()
    if (!courseId || !newModuleTitle.trim()) return
    setBusy(true)
    try {
      const created = await api.post('/modules/', {
        course: courseId,
        title: newModuleTitle,
        order: modules.length + 1,
      })
      setModules([...modules, created])
      setNewModuleTitle('')
      flash('Module added.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddLesson(e) {
    e.preventDefault()
    if (!moduleId || !newLesson.title.trim()) return
    setBusy(true)
    try {
      const created = await api.post('/lessons/', {
        module: moduleId,
        title: newLesson.title,
        order: lessons.length + 1,
        video_url: newLesson.video_url,
        tutorial_content: newLesson.tutorial_content,
      })
      setLessons([...lessons, created])
      setNewLesson({ title: '', video_url: '', tutorial_content: '' })
      flash('Lesson added — video link saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveVideoUrl(e) {
    e.preventDefault()
    if (!lessonId) return
    setBusy(true)
    try {
      const updated = await api.patch(`/lessons/${lessonId}/`, { video_url: videoUrl })
      setLessons(lessons.map((l) => (l.id === updated.id ? updated : l)))
      flash('Video link saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUploadPdf(e) {
    e.preventDefault()
    if (!lessonId || !pdfFile) return
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('lesson', lessonId)
      formData.append('title', pdfTitle || pdfFile.name)
      formData.append('file', pdfFile)
      const created = await api.upload('/lesson-attachments/', formData)
      setAttachments([...attachments, created])
      setPdfTitle('')
      setPdfFile(null)
      e.target.reset()
      flash('PDF uploaded and stored.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Instructor' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-muted">Content management</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Course content</h2>
          <p className="mt-1 text-sm text-text-muted">
            Add modules and lessons, embed a video link, and attach PDF handouts. Everything here is saved to the database immediately.
          </p>
        </div>

        {status && (
          <div className="rounded-lg border border-mint/40 bg-mint/10 px-4 py-3 text-sm text-mint">{status}</div>
        )}
        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {/* Step 1: course */}
        <div className="rounded-2xl border border-line bg-paper p-6">
          <label className="mb-1.5 block text-sm font-medium text-ink">Course</label>
          {courses.length === 0 ? (
            <p className="text-sm text-text-muted">
              You don't have any courses yet — create one from the Django admin, or via the API, then it'll show up here.
            </p>
          ) : (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full max-w-sm rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
        </div>

        {courseId && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Step 2: modules */}
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">Modules</h3>

              <div className="mt-4 space-y-2">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModuleId(String(m.id))}
                    className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${
                      String(moduleId) === String(m.id)
                        ? 'border-coral bg-coral-tint text-coral-dim'
                        : 'border-line text-ink hover:border-text-dim'
                    }`}
                  >
                    {m.order}. {m.title}
                  </button>
                ))}
                {modules.length === 0 && <p className="text-sm text-text-muted">No modules yet.</p>}
              </div>

              <form onSubmit={handleAddModule} className="mt-4 flex gap-2 border-t border-line pt-4">
                <input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="New module title, e.g. 'JavaScript Fundamentals'"
                  className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                />
                <button
                  disabled={busy || !newModuleTitle.trim()}
                  className="flex items-center gap-1 rounded-md bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>

            {/* Step 3: lessons */}
            {moduleId && (
              <div className="rounded-2xl border border-line bg-paper p-6">
                <h3 className="font-semibold text-ink">Lessons</h3>

                <div className="mt-4 space-y-2">
                  {lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLessonId(String(l.id))}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${
                        String(lessonId) === String(l.id)
                          ? 'border-coral bg-coral-tint text-coral-dim'
                          : 'border-line text-ink hover:border-text-dim'
                      }`}
                    >
                      {l.order}. {l.title}
                    </button>
                  ))}
                  {lessons.length === 0 && <p className="text-sm text-text-muted">No lessons yet.</p>}
                </div>

                <form onSubmit={handleAddLesson} className="mt-4 space-y-2 border-t border-line pt-4">
                  <input
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="New lesson title"
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                  />
                  <input
                    value={newLesson.video_url}
                    onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                    placeholder="Video URL (YouTube, Vimeo, etc.) — optional"
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                  />
                  <textarea
                    value={newLesson.tutorial_content}
                    onChange={(e) => setNewLesson({ ...newLesson, tutorial_content: e.target.value })}
                    placeholder="Tutorial text — optional"
                    rows={2}
                    className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                  />
                  <button
                    disabled={busy || !newLesson.title.trim()}
                    className="flex items-center gap-1 rounded-md bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                  >
                    <Plus size={16} /> Add lesson
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step 4: selected lesson — video link + PDFs */}
        {lessonId && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">Video link</h3>
              <p className="mt-1 text-sm text-text-muted">Embed a video for “{selectedLesson?.title}”.</p>
              <form onSubmit={handleSaveVideoUrl} className="mt-4 flex gap-2">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                />
                <button
                  disabled={busy}
                  className="rounded-md bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                >
                  Save
                </button>
              </form>
              {selectedLesson?.video_url && (
                <p className="mt-3 text-xs text-text-muted">
                  Currently saved: <a className="text-coral hover:underline" href={selectedLesson.video_url} target="_blank" rel="noreferrer">{selectedLesson.video_url}</a>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">PDF attachments</h3>
              <div className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-ink hover:border-text-dim"
                  >
                    <FileText size={16} className="text-coral" /> {a.title}
                  </a>
                ))}
                {attachments.length === 0 && <p className="text-sm text-text-muted">No PDFs attached yet.</p>}
              </div>

              <form onSubmit={handleUploadPdf} className="mt-4 space-y-2 border-t border-line pt-4">
                <input
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="Display name, e.g. 'Week 3 slides'"
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
                />
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-text-muted"
                />
                <button
                  disabled={busy || !pdfFile}
                  className="flex items-center gap-1 rounded-md bg-coral px-3 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
                >
                  <Upload size={16} /> Upload PDF
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
