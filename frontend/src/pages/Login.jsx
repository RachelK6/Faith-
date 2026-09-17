import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

const SITE_URL = 'https://www.yourdomain.com' // TODO: replace with the real production domain before launch

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await login(email, password)
      if (session.role !== selectedRole) {
        await logout()
        throw new Error(`This account is registered as ${roleLabel(session.role).toLowerCase()}. Choose that role to continue.`)
      }
      navigate(`/dashboard/${session.role}`)
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-panel">
      <Helmet>
        <title>Log in — Optimum ERP LMS</title>
        <link rel="canonical" href={`${SITE_URL}/login`} />
      </Helmet>

      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10 md:px-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-paper shadow-xl md:grid-cols-[0.85fr_1.15fr]">
          <div className="hidden bg-ink p-10 text-white md:block">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-sm">O</span>
              Optimum LMS
            </div>
            <div className="mt-24">
              <p className="text-3xl font-bold leading-tight">Pick up exactly where you left off.</p>
              <div className="mt-8 space-y-4 text-sm text-white/70">
                {['Lessons that build in order', 'Instant feedback on every lab', 'Progress shared with your instructor'].map((item) => (
                  <p key={item} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-white"><Check size={12} /></span>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center bg-paper px-6 py-10 sm:px-12">
            <div className="w-full max-w-sm">
              <div className="mb-8 flex items-center gap-2 text-lg font-bold tracking-tight text-ink md:hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-sm text-white">O</span>
                Optimum LMS
              </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-text-muted">Log in to continue where you left off.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-coral-tint px-4 py-3 text-sm text-coral-dim">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-ink">
                Log in as
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full appearance-none rounded-md border border-line bg-paper px-3 py-2.5 pr-10 text-sm text-ink focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-text-dim focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-line bg-paper py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-text-dim focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-coral py-2.5 font-medium text-white hover:bg-coral-dim disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                New here? <Link to="/register" className="font-medium text-coral hover:text-coral-dim">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function roleLabel(role) {
  return { student: 'Student', instructor: 'Instructor', admin: 'Administrator' }[role] || 'user'
}
