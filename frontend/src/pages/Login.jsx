import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import AuthBrand from '../components/AuthBrand.jsx'
import Logo from '../components/Logo.jsx'
import EmailInput from '../components/EmailInput.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Email is case-insensitive and may carry stray spaces; the password is sent exactly as typed.
      const session = await login(email.trim().toLowerCase(), password, accountType)
      navigate(`/dashboard/${session.role}`)
    } catch (err) {
      setError(err.status === 429
        ? 'Too many attempts. Please wait a minute and try again.'
        : err.message || 'Unable to sign in. Check your email and password and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted p-4 text-text-primary sm:p-6" data-role="student">
      <Helmet>
        <title>Sign In — Optimum LMS</title>
      </Helmet>

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[30px] border border-border bg-surface shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:grid md:grid-cols-12">
        {/* Left Side: Brand Showcase */}
        <div className="auth-hero hidden flex-col justify-between border-r border-border p-8 md:col-span-5 md:flex">
          <div>
            <AuthBrand />

            <div className="mt-14">
              <span className="auth-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
                <Sparkles size={12} /> Next-Gen Learning
              </span>
              <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight tracking-tight text-white">
                Learn faster. Build smarter. Move with purpose.
              </h2>
              <div className="mt-6 space-y-3.5 text-sm text-white">
                {[
                  'Structured learning paths from foundation to advanced execution',
                  'Live coding labs with instant feedback and measurable outcomes',
                  'Role-aware analytics built for students, instructors, and admins',
                ].map((item, idx) => (
                  <div key={idx} className="auth-feature flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
                      <Check size={12} />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 md:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 md:hidden">
              <Logo tone="light" height={34} />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
              <p className="mt-1 text-xs text-text-secondary">Log in to pick up right where you left off.</p>
            </div>

            {location.state?.registered && (
              <div className="mb-5 rounded-xl border border-primary/20 bg-blue-50 px-4 py-3 text-sm text-text-primary" role="status">
                Account created. You can sign in now; check your email for a link to verify your address.
              </div>
            )}

            {error && (
              <div role="alert" className="auth-danger mb-5 rounded-xl px-4 py-2.5 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">
                Sign in as
                <select
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm font-medium text-text-primary lms-focus-ring"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} />

              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                extra={<Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-hover">Forgot password?</Link>}
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-text-secondary">
              <Link to="/" className="text-text-secondary hover:text-text-primary">
                ← Back to overview
              </Link>
              <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
                New learner? Register
              </Link>
            </div>
            <Link to="/verify-email" className="mt-4 block text-center text-xs font-semibold text-text-secondary hover:text-primary">
              Need a new verification email?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
