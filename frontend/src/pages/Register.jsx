import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Lock, Mail, Sparkles, User } from 'lucide-react'
import { api } from '../lib/api.js'

const SITE_URL = 'https://www.yourdomain.com'

export default function Register() {
  const [form, setForm] = useState({
    role: 'student',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.role !== 'student') {
      setError(`${roleLabel(form.role)} accounts are created by an administrator. Please contact your administrator for access.`)
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.register({
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Helmet>
        <title>Create account — Optimum ERP LMS</title>
        <link rel="canonical" href={`${SITE_URL}/register`} />
      </Helmet>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10 md:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.35),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_35%,#1f2937_100%)] p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500 text-base font-bold text-white">O</span>
                <div>
                  <div className="text-lg font-bold tracking-tight">Optimum</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">LMS</div>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles size={12} />
                Start learning
              </div>
              <p className="mt-6 text-3xl font-black leading-tight tracking-[-0.05em]">
                Build skills one verified step at a time.
              </p>
              <div className="mt-8 space-y-4 text-sm text-slate-300">
                {['Start with the first module', 'Practice in real coding labs', 'See feedback as soon as you submit'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-slate-900">
                      <Check size={12} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">Why students join</div>
              <p className="mt-2 leading-6 text-slate-300">Structured learning paths, hands-on labs, and progress tracking designed for real momentum.</p>
            </div>
          </div>

          <div className="flex items-center bg-white px-6 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 md:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">O</span>
                Optimum LMS
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Create account</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Join the platform</h1>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Create account as
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={updateField}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {form.role !== 'student' && (
                    <p className="mt-1.5 text-xs text-slate-500">Staff accounts are created by an administrator.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" name="first_name" value={form.first_name} onChange={updateField} icon={User} />
                  <Field label="Last name" name="last_name" value={form.last_name} onChange={updateField} icon={User} />
                </div>

                <Field label="Username" name="username" value={form.username} onChange={updateField} icon={User} required />
                <Field label="Email" name="email" type="email" value={form.email} onChange={updateField} icon={Mail} required />
                <Field label="Password" name="password" type="password" value={form.password} onChange={updateField} icon={Lock} required minLength={8} />
                <Field label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} icon={Lock} required minLength={8} />

                <button
                  type="submit"
                  disabled={loading || form.role !== 'student'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating account…' : 'Create account'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function roleLabel(role) {
  return { student: 'Student', instructor: 'Instructor', admin: 'Administrator' }[role] || 'Staff'
}

function Field({ label, name, value, onChange, icon: Icon, type = 'text', required = false, minLength }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={name.includes('password') || name === 'confirmPassword' ? 'new-password' : name === 'email' ? 'email' : 'name'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
      </div>
    </div>
  )
}