import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { LayoutDashboard, BookOpen, GraduationCap, CheckCircle2, XCircle, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/useAuth.js'

const navItems = [
  { to: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/dashboard/student/grades', label: 'Grades', icon: GraduationCap },
]

export default function QuizTake() {
  const { quizId } = useParams()
  const { auth } = useAuth()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/quizzes/${quizId}/`).then(setQuiz).catch((err) => setError(err.message))
  }, [quizId])

  function selectAnswer(questionId, choiceIndex) {
    setAnswers({ ...answers, [questionId]: choiceIndex })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const attempt = await api.post(`/quizzes/${quizId}/submit/`, { answers })
      setResult(attempt)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const allAnswered = quiz && quiz.questions.every((q) => answers[q.id] !== undefined)

  return (
    <DashboardLayout navItems={navItems} user={{ name: auth?.email || 'Student' }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div className="mx-auto max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {quiz && !result && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-ink">Quiz</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                <Clock size={14} /> {quiz.time_limit_minutes} minutes · Pass mark {quiz.pass_mark_percentage}%
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {quiz.questions.map((q, i) => (
                <div key={q.id} className="rounded-2xl border border-line bg-paper p-5">
                  <p className="font-medium text-ink">{i + 1}. {q.text}</p>
                  <div className="mt-3 space-y-2">
                    {q.choices.map((choice, idx) => (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                          answers[q.id] === idx ? 'border-coral bg-coral-tint text-coral-dim' : 'border-line text-ink hover:border-text-dim'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === idx}
                          onChange={() => selectAnswer(q.id, idx)}
                          className="accent-coral"
                        />
                        {choice.text ?? choice}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                disabled={!allAnswered || busy}
                className="w-full rounded-md bg-coral py-2.5 text-sm font-medium text-white hover:bg-coral-dim disabled:opacity-60"
              >
                {busy ? 'Submitting…' : 'Submit quiz'}
              </button>
            </form>
          </>
        )}

        {result && (
          <div className="rounded-2xl border border-line bg-paper p-8 text-center">
            {result.passed ? (
              <CheckCircle2 size={40} className="mx-auto text-mint" />
            ) : (
              <XCircle size={40} className="mx-auto text-coral" />
            )}
            <h2 className="mt-3 text-xl font-bold text-ink">{result.passed ? 'Passed!' : 'Not quite — try again'}</h2>
            <p className="mt-2 text-sm text-text-muted">
              Score: {result.score} / {result.total_marks} ({result.percentage}%)
            </p>
            <Link
              to="/dashboard/student/courses"
              className="mt-5 inline-block rounded-md bg-coral px-5 py-2 text-sm font-medium text-white hover:bg-coral-dim"
            >
              Back to courses
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
