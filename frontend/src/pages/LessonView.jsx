import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText, Play, Send,
  CircleCheckBig, Upload, ChevronLeft, ChevronRight,
} from 'lucide-react'
import LessonVideo from '../components/LessonVideo.jsx'
import { ACCEPT, MAX_UPLOAD_MB, checkUpload } from '../lib/uploadRules.js'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: GraduationCap },
]

export default function LessonView() {
  const { lessonId } = useParams()
  const { auth } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [module, setModule] = useState(null)
  const [moduleLessons, setModuleLessons] = useState([])
  const [error, setError] = useState('')

  async function fetchLessonContext(id) {
    const currentLesson = await api.get(`/lessons/${id}/`)
    const currentModule = await api.get(`/modules/${currentLesson.module}/`)
    const [courseDetail, lessons] = await Promise.all([
        api.get(`/courses/${currentModule.course}/`),
        api.get(`/lessons/?module=${currentModule.id}`),
    ])
    return { currentLesson, currentModule, courseDetail, lessons }
  }

  function applyLessonContext(context) {
    setLesson(context.currentLesson)
    setModule(context.currentModule)
    setCourse(context.courseDetail)
    setModuleLessons(context.lessons)
  }

  async function reload() {
    setError('')
    try {
      applyLessonContext(await fetchLessonContext(lessonId))
    } catch (err) {
      setError(err.message || 'Unable to load this lesson.')
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchLessonContext(lessonId)
      .then((context) => {
        if (cancelled) return
        applyLessonContext(context)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Unable to load this lesson.')
      })
    return () => { cancelled = true }
  }, [lessonId])

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {lesson && (
          <>
            {course && module && (
              <div className="rounded-xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/dashboard/student/courses/${course.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900">
                    <ChevronLeft size={16} aria-hidden="true" /> {course.title}
                  </Link>
                  <span className="text-xs font-medium text-text-muted">Module {module.order}: {module.title}</span>
                </div>
                {moduleLessons.length > 0 && (
                  <nav className="mt-3 border-t border-line pt-3" aria-label="Lessons in this module">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Module lessons</p>
                    <ol className="flex gap-2 overflow-x-auto pb-1">
                      {moduleLessons.map((item, index) => {
                        const current = String(item.id) === String(lesson.id)
                        return (
                          <li key={item.id} className="shrink-0">
                            {current ? (
                              <span aria-current="step" className="inline-flex max-w-56 items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white">
                                <span>{index + 1}</span><span className="truncate">{item.title}</span>
                              </span>
                            ) : (
                              <Link to={`/dashboard/student/lessons/${item.id}`} className="inline-flex max-w-56 items-center gap-2 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink hover:border-blue-400 hover:bg-blue-50">
                                <span className="text-text-muted">{index + 1}</span><span className="truncate">{item.title}</span>
                              </Link>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  </nav>
                )}
              </div>
            )}

            <div>
              <p className="text-sm text-text-muted">Lesson {lesson.order}{moduleLessons.length ? ` of ${moduleLessons.length}` : ''}</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{lesson.title}</h2>
              {lesson.learning_objectives && (
                <p className="mt-2 text-sm text-text-muted">{lesson.learning_objectives}</p>
              )}
            </div>

            {lesson.video_url && (
              <div className="rounded-2xl border border-line bg-paper p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <LessonVideo lessonId={lesson.id} url={lesson.video_url} track />
              </div>
            )}

            {lesson.video_file_url && (
              <div className="rounded-2xl border border-line bg-paper p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <LessonVideo key={lesson.video_file_url} lessonId={lesson.id} url={lesson.video_file_url} uploadedVideo track />
              </div>
            )}

            {lesson.tutorial_content && (
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h3 className="font-semibold text-ink">Tutorial</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{lesson.tutorial_content}</p>
              </div>
            )}

            {lesson.attachments?.length > 0 && (
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h3 className="font-semibold text-ink">Resources</h3>
                <div className="mt-3 space-y-2">
                  {lesson.attachments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => api.download(a.download_url.replace(/^\/api/, ''), `${a.title}.pdf`).catch((err) => window.alert(err.message))}
                      className="flex w-full items-center gap-2 rounded-md border border-line px-3 py-2 text-left text-sm text-ink hover:border-text-dim"
                    >
                      <FileText size={16} className="text-coral" /> {a.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lesson.activities?.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink">Activities</h3>
                {lesson.activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} onSubmitted={reload} />
                ))}
              </div>
            )}

            {moduleLessons.length > 1 && (
              <nav className="flex items-center justify-between gap-3 border-t border-line pt-5" aria-label="Lesson navigation">
                {(() => {
                  const index = moduleLessons.findIndex((item) => String(item.id) === String(lesson.id))
                  const previous = index > 0 ? moduleLessons[index - 1] : null
                  const next = index >= 0 && index < moduleLessons.length - 1 ? moduleLessons[index + 1] : null
                  return (
                    <>
                      {previous ? (
                        <Link to={`/dashboard/student/lessons/${previous.id}`} className="inline-flex max-w-[48%] items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-panel">
                          <ChevronLeft size={16} aria-hidden="true" /><span className="truncate">{previous.title}</span>
                        </Link>
                      ) : <span />}
                      {next ? (
                        <Link to={`/dashboard/student/lessons/${next.id}`} className="inline-flex max-w-[48%] items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                          <span className="truncate">{next.title}</span><ChevronRight size={16} aria-hidden="true" />
                        </Link>
                      ) : (
                        <Link to={`/dashboard/student/courses/${course.id}`} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                          Back to course <ChevronRight size={16} aria-hidden="true" />
                        </Link>
                      )}
                    </>
                  )
                })()}
              </nav>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function ActivityCard({ activity, onSubmitted }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-medium capitalize text-text-muted">
            {activity.activity_type}
          </span>
          <h4 className="mt-1.5 font-medium text-ink">{activity.title}</h4>
        </div>
        <span className="text-xs text-text-dim">
          {activity.max_attempts} attempt{activity.max_attempts === 1 ? '' : 's'} · {activity.max_score} pts
        </span>
      </div>
      {activity.instructions && <p className="mt-2 text-sm text-text-muted">{activity.instructions}</p>}

      <div className="mt-4">
        {activity.activity_type === 'exercise' && <ExerciseRunner activity={activity} onSubmitted={onSubmitted} />}
        {(activity.activity_type === 'lab' || activity.activity_type === 'assignment') && (
          <SubmissionForm activity={activity} onSubmitted={onSubmitted} />
        )}
        {activity.activity_type === 'quiz' && activity.quiz_id && (
          <Link
            to={`/dashboard/student/quiz/${activity.quiz_id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dim"
          >
            Take quiz
          </Link>
        )}
      </div>
    </div>
  )
}

function ExerciseRunner({ activity, onSubmitted }) {
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(activity.starter_code || '')
  const [output, setOutput] = useState(null)
  const [testResults, setTestResults] = useState(null)
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleRun() {
    setBusy(true)
    setOutput(null)
    setStatus('')
    setIsError(false)
    try {
      const result = await api.post('/execute/run/', { language, code })
      setOutput(result)
    } catch (err) {
      setOutput({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleRunTests() {
    setBusy(true)
    setTestResults(null)
    setStatus('')
    try {
      const result = await api.post('/execute/test/', { language, code, activity_id: activity.id })
      setTestResults(result)
    } catch (err) {
      setTestResults({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit() {
    setBusy(true)
    setStatus('')
    try {
      await api.post('/submissions/', { activity: activity.id, content: code })
      setIsError(false)
      setStatus('Submitted! Your instructor will grade it.')
      onSubmitted?.()
    } catch (err) {
      setIsError(true)
      setStatus(err.status === 429 ? 'You are submitting too quickly. Please wait a moment.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-xs text-ink"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-md border border-line bg-ink px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/40"
        placeholder="Write your code here…"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={handleRun} disabled={busy} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:border-text-dim disabled:opacity-60">
          <Play size={14} /> Run
        </button>
        <button onClick={handleRunTests} disabled={busy} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:border-text-dim disabled:opacity-60">
          <CircleCheckBig size={14} /> Run tests
        </button>
        <button onClick={handleSubmit} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-coral px-3 py-1.5 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60">
          <Send size={14} /> Submit
        </button>
      </div>

      {output && (
        <div className="rounded-md bg-panel p-3 font-mono text-xs text-ink">
          {output.error ? (
            <span className="text-red-600">{output.error}</span>
          ) : (
            <>
              {output.timed_out && <p className="mb-1 font-semibold text-red-600">Stopped: your code ran too long (time limit).</p>}
              {output.stdout && <pre className="whitespace-pre-wrap">{output.stdout}</pre>}
              {output.stderr && <pre className="whitespace-pre-wrap text-red-600">{output.stderr}</pre>}
              {!output.stdout && !output.stderr && !output.timed_out && <span className="text-text-muted">(no output)</span>}
            </>
          )}
        </div>
      )}

      {testResults && (
        <div className="rounded-md bg-panel p-3 text-sm">
          {testResults.error ? (
            <span className="text-red-600">{testResults.error}</span>
          ) : (
            <div role="status">
              <p className="font-semibold text-ink">{testResults.passed} of {testResults.total} tests passed</p>
              <ul className="mt-2 space-y-1.5">
                {testResults.results.map((r) => (
                  <li key={r.index} className={r.passed ? 'text-emerald-700' : 'text-red-600'}>
                    Test {r.index}: {r.passed ? 'passed' : r.timed_out ? 'timed out' : 'failed'}
                    {r.expected_output !== undefined && !r.passed && (
                      <span className="block font-mono text-xs text-text-muted">expected “{r.expected_output}” · got “{r.actual_output}”</span>
                    )}
                    {r.error && <span className="block whitespace-pre-wrap font-mono text-xs">{r.error}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status && <p role={isError ? 'alert' : 'status'} className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-700'}`}>{status}</p>}
    </div>
  )
}

function SubmissionForm({ activity, onSubmitted }) {
  const [content, setContent] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [busy, setBusy] = useState(false)

  function pickFile(e) {
    const picked = e.target.files?.[0] || null
    const problem = checkUpload(picked)
    if (problem) {
      setFile(null)
      e.target.value = ''
      setIsError(true)
      setStatus(problem)
      return
    }
    setStatus('')
    setFile(picked)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setStatus('')
    setIsError(false)
    try {
      if (file) {
        const formData = new FormData()
        formData.append('activity', activity.id)
        formData.append('content', content)
        formData.append('github_url', githubUrl)
        formData.append('file', file)
        await api.upload('/submissions/', formData)
      } else {
        await api.post('/submissions/', { activity: activity.id, content, github_url: githubUrl })
      }
      setStatus('Submitted successfully.')
      setIsError(false)
      setContent('')
      setGithubUrl('')
      setFile(null)
      onSubmitted?.()
    } catch (err) {
      setIsError(true)
      setStatus(err.status === 429 ? 'You are submitting too quickly. Please wait a moment.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Write your answer or paste code…"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
      />
      <input
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
        placeholder="GitHub repo URL — optional"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-text-dim"
      />
      <input
        type="file"
        accept={ACCEPT}
        onChange={pickFile}
        className="w-full text-sm text-text-muted"
      />
      <p className="text-xs text-text-dim">Files: PDF, ZIP, DOCX, images or source files, up to {MAX_UPLOAD_MB} MB.</p>
      <button
        disabled={busy || (!content && !githubUrl && !file)}
        className="flex items-center gap-1.5 rounded-md bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
      >
        <Upload size={16} /> {busy ? 'Submitting…' : 'Submit'}
      </button>
      {status && <p role={isError ? 'alert' : 'status'} className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-700'}`}>{status}</p>}
    </form>
  )
}
