import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Lock, Mail, User } from 'lucide-react'
import { api } from '../lib/api.js'

const SITE_URL = 'https://www.yourdomain.com'

export default function Register() {
  const [form, setForm] = useState({ role: 'student', username: '', email: '', first_name: '', last_name: '', password: '', confirmPassword: '' })
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
    <div className="min-h-screen bg-panel">
      <Helmet>
        <title>Create account — Optimum ERP LMS</title>
        <link rel="canonical" href={`${SITE_URL}/register`} />
      </Helmet>

      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10 md:px-8">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-paper shadow-xl md:grid-cols-[0.85fr_1.15fr]">
          <div className="hidden bg-ink p-10 text-white md:block">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-sm">O</span>
              Optimum LMS
            </div>
            <div className="mt-24">
              <p className="text-3xl font-bold leading-tight">Build skills one verified step at a time.</p>
              <div className="mt-8 space-y-4 text-sm text-white/70">
                {['Start with the first module', 'Practice in real coding labs', 'See feedback as soon as you submit'].map((item) => (
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
              <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
              <p className="mt-2 text-sm text-text-muted">Choose the type of account you need.</p>

              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                {error && <div className="rounded-md bg-coral-tint px-4 py-3 text-sm text-coral-dim">{error}</div>}
                <div>
                  <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-ink">Create account as</label>
                  <div className="relative">
                    <select id="role" name="role" value={form.role} onChange={updateField} className="w-full appearance-none rounded-md border border-line bg-paper px-3 py-2.5 pr-10 text-sm text-ink focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral">
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim" />
                  </div>
                  {form.role !== 'student' && <p className="mt-1.5 text-xs text-text-muted">Staff accounts are created by an administrator.</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" name="first_name" value={form.first_name} onChange={updateField} icon={User} />
                  <Field label="Last name" name="last_name" value={form.last_name} onChange={updateField} icon={User} />
                </div>
                <Field label="Username" name="username" value={form.username} onChange={updateField} icon={User} required />
                <Field label="Email" name="email" type="email" value={form.email} onChange={updateField} icon={Mail} required />
                <Field label="Password" name="password" type="password" value={form.password} onChange={updateField} icon={Lock} required minLength={8} />
                <Field label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} icon={Lock} required minLength={8} />
                <button type="submit" disabled={loading || form.role !== 'student'} className="flex w-full items-center justify-center gap-2 rounded-md bg-coral py-2.5 font-medium text-white hover:bg-coral-dim disabled:opacity-60">
                  {loading ? 'Creating account…' : 'Create account'} {!loading && <ArrowRight size={16} />}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-text-muted">Already registered? <Link to="/login" className="font-medium text-coral hover:text-coral-dim">Log in</Link></p>
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
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} minLength={minLength} autoComplete={name.includes('password') || name === 'confirmPassword' ? 'new-password' : name === 'email' ? 'email' : 'name'} className="w-full rounded-md border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-text-dim focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral" />
      </div>
    </div>
  )
}