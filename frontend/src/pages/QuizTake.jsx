import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { LayoutDashboard, BookOpen, GraduationCap, CircleCheckBig, CircleX } from 'lucide-react'
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

      <div className="mx-auto max-w-3xl space-y-6">
        {error && (
          <div className="rounded-lg border border-line bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>
        )}

        {quiz && !result && (
          <>
            <div className="dg-card rounded-3xl p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Assessment</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{quiz.title || 'Quiz'}</h2>
                </div>
                <span className="dg-pill">{quiz.time_limit_minutes} min · Pass {quiz.pass_mark_percentage}%</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {quiz.questions.map((q, i) => (
                <div key={q.id} className="dg-card rounded-3xl p-5">
                  <p className="font-semibold text-slate-900">{i + 1}. {q.text}</p>
                  <div className="mt-4 space-y-2">
                    {q.choices.map((choice, idx) => (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                          answers[q.id] === idx ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === idx}
                          onChange={() => selectAnswer(q.id, idx)}
                          className="accent-blue-600"
                        />
                        {choice.text ?? choice}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                disabled={!allAnswered || busy}
                className="dg-btn w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {busy ? 'Submitting…' : 'Submit quiz'}
              </button>
            </form>
          </>
        )}

        {result && (
          <div className="dg-card rounded-3xl p-8 text-center">
            {result.passed ? (
              <CircleCheckBig size={40} className="mx-auto text-emerald-500" />
            ) : (
              <CircleX size={40} className="mx-auto text-rose-500" />
            )}
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{result.passed ? 'Passed!' : 'Not quite — try again'}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Score: {result.score} / {result.total_marks} ({result.percentage}%)
            </p>
            <Link
              to="/dashboard/student/courses"
              className="dg-btn mt-5 bg-blue-600 text-white hover:bg-blue-500"
            >
              Back to courses
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
