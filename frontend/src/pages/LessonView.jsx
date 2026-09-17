import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText, Play, Send,
  CheckCircle2, Upload,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: GraduationCap },
]

// Turns a YouTube watch/share URL into its embeddable form. Anything else
// (Vimeo, a direct file, an unrecognized host) just gets a normal link —
// building a universal video-embed resolver is out of scope here, and a
// plain link always works as a fallback.
function toEmbedUrl(url) {
  if (!url) return null
  const watch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  return null
}

export default function LessonView() {
  const { lessonId } = useParams()
  const { auth } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')

  function reload() {
    api.get(`/lessons/${lessonId}/`).then(setLesson).catch((err) => setError(err.message))
  }

  useEffect(reload, [lessonId])

  const embedUrl = toEmbedUrl(lesson?.video_url)

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {lesson && (
          <>
            <div>
              <p className="text-sm text-text-muted">Lesson {lesson.order}</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{lesson.title}</h2>
              {lesson.learning_objectives && (
                <p className="mt-2 text-sm text-text-muted">{lesson.learning_objectives}</p>
              )}
            </div>

            {lesson.video_url && (
              <div className="overflow-hidden rounded-2xl border border-line bg-paper">
                {embedUrl ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      title={lesson.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={lesson.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-5 text-sm font-medium text-coral hover:text-coral-dim"
                  >
                    <Play size={18} /> Watch the video (opens in a new tab)
                  </a>
                )}
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
  const [busy, setBusy] = useState(false)

  async function handleRun() {
    setBusy(true)
    setOutput(null)
    setStatus('')
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
      setStatus('Submitted! Your instructor will grade it, or it may already be scored above.')
      onSubmitted?.()
    } catch (err) {
      setStatus(err.message)
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
          <CheckCircle2 size={14} /> Run tests
        </button>
        <button onClick={handleSubmit} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-coral px-3 py-1.5 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60">
          <Send size={14} /> Submit
        </button>
      </div>

      {output && (
        <div className="rounded-md bg-panel p-3 font-mono text-xs text-ink">
          {output.error ? <span className="text-coral-dim">{output.error}</span> : <pre className="whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>}
        </div>
      )}

      {testResults && (
        <div className="rounded-md bg-panel p-3 text-sm">
          {testResults.error ? (
            <span className="text-coral-dim">{testResults.error}</span>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs text-ink">{JSON.stringify(testResults, null, 2)}</pre>
          )}
        </div>
      )}

      {status && <p className="text-sm text-mint">{status}</p>}
    </div>
  )
}

function SubmissionForm({ activity, onSubmitted }) {
  const [content, setContent] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setStatus('')
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
      setContent('')
      setGithubUrl('')
      setFile(null)
      onSubmitted?.()
    } catch (err) {
      setStatus(err.message)
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
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-sm text-text-muted"
      />
      <button
        disabled={busy || (!content && !githubUrl && !file)}
        className="flex items-center gap-1.5 rounded-md bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
      >
        <Upload size={16} /> {busy ? 'Submitting…' : 'Submit'}
      </button>
      {status && <p className="text-sm text-mint">{status}</p>}
    </form>
  )
}
