import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { errMessage } from '@/lib/errors'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-medium leading-10 text-ink">Check your email</h1>
          <p className="text-base text-ink-600">
            If an account exists for {email}, we&apos;ve sent a link to reset your
            password.
          </p>
          <Link to="/sign-in" className="font-medium text-brand">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Forget Password
          </h1>
          <div className="flex flex-col gap-2 text-base">
            <p className="text-ink-600">
              Go back to{' '}
              <Link to="/sign-in" className="font-medium text-brand">
                Sign In
              </Link>
            </p>
            <p className="text-ink-600">
              Don&rsquo;t have account{' '}
              <Link to="/create-account" className="font-medium text-brand">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <AuthField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthSubmit disabled={submitting}>
          {submitting ? 'Sending...' : 'Reset Password'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
