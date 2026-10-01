import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../lib/api.js'
import { checkPassword } from '../lib/passwordRules.js'
import Logo from '../components/Logo.jsx'
import EmailInput from '../components/EmailInput.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import PasswordChecklist from '../components/PasswordChecklist.jsx'

/**
 * Two modes on one page:
 *   /forgot-password                      -> ask for an email, we send a link
 *   /reset-password?uid=…&token=…         -> choose a new password
 * Links are valid for 1 hour and work once; an expired/used link shows a
 * one-click way to request a fresh one.
 */
export default function PasswordReset() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')
  const hasToken = Boolean(uid && token)
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [linkProblem, setLinkProblem] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const { valid } = checkPassword(newPassword)
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (hasToken) {
      if (!valid) return setError('Your new password does not meet all the requirements below.')
      if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    }
    setLoading(true)
    try {
      if (hasToken) {
        await api.confirmPasswordReset({ uid, token, new_password: newPassword, confirm_password: confirmPassword })
      } else {
        await api.requestPasswordReset(email.trim().toLowerCase())
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.status === 429 ? 'Too many requests. Please wait a while and try again.' : err.message || 'Unable to process this request.')
      setLinkProblem(hasToken && /invalid|expired/i.test(err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10 text-text-primary" data-role="student">
      <Helmet>
        <title>{hasToken ? 'Choose a new password — Optimum LMS' : 'Reset password — Optimum LMS'}</title>
      </Helmet>
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-8"><Logo tone="light" height={34} /></div>
        <h1 className="text-2xl font-bold">{hasToken ? 'Choose a new password' : 'Reset your password'}</h1>

        {submitted ? (
          <div className="mt-4 space-y-5">
            <p className="text-sm text-text-secondary" role="status">
              {hasToken
                ? 'Your password has been updated and you have been signed out everywhere. Sign in with your new password.'
                : 'If an account exists for that address, we have sent a reset link. It is valid for 1 hour and can be used once. Check your spam folder too.'}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              Back to sign in <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-text-secondary">
              {hasToken ? 'Enter and confirm a new password for your account.' : 'Enter your account email. If it matches an account, we’ll send a reset link.'}
            </p>
            {error && (
              <div className="auth-danger mt-4 rounded-xl px-4 py-3 text-sm" role="alert">
                {error}
                {linkProblem && (
                  <div className="mt-2">
                    This link may have expired (they last 1 hour) or already been used.{' '}
                    <Link to="/forgot-password" className="font-semibold underline underline-offset-2">Request a new link</Link>
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={hasToken}>
              {hasToken ? (
                <>
                  <div>
                    <PasswordInput id="new-password" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" describedBy="pw-rules" />
                    <PasswordChecklist id="pw-rules" password={newPassword} />
                  </div>
                  <div>
                    <PasswordInput id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                    {mismatch && <p className="mt-1.5 text-xs font-medium text-red-600" role="status">Passwords do not match yet.</p>}
                  </div>
                </>
              ) : (
                <EmailInput id="reset-email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              )}
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
                {loading ? 'Please wait…' : hasToken ? 'Update password' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <Link to="/login" className="mt-6 block text-sm font-semibold text-primary hover:text-primary-hover">Back to sign in</Link>
      </section>
    </main>
  )
}
