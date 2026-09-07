import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // The recovery email link lands here with a token in the URL that supabase-js
  // exchanges for a short-lived session. 'checking' until we know either way.
  const [linkState, setLinkState] = useState<'checking' | 'ready' | 'invalid'>(
    'checking',
  )

  useEffect(() => {
    let settled = false
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        settled = true
        setLinkState('ready')
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (settled) return
      setLinkState(data.session ? 'ready' : 'invalid')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (linkState === 'checking') {
    return (
      <AuthLayout variant="centered">
        <p className="py-10 text-center text-sm text-muted">Checking your link…</p>
      </AuthLayout>
    )
  }

  if (linkState === 'invalid') {
    return (
      <AuthLayout variant="centered">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            This link is invalid or expired
          </h1>
          <p className="text-base leading-6 text-muted">
            Password reset links can only be used once and expire after a short
            time. Request a new one to continue.
          </p>
          <Link
            to="/forgot-password"
            className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout variant="centered">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Password updated
          </h1>
          <p className="text-base leading-6 text-muted">
            Your password has been reset. You can now sign in with it.
          </p>
          <Link
            to="/sign-in"
            className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="centered">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-9">
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Reset Password
          </h1>
          <p className="text-base leading-6 text-muted">
            Enter a new password for your account below.
          </p>
        </div>

        {error && (
          <p className="w-full rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="New Password"
            name="password"
            password
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthField
            label="Confirm Password"
            name="confirmPassword"
            password
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <AuthSubmit disabled={submitting}>
          {submitting ? 'Updating...' : 'Reset Password'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
