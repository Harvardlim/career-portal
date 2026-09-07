import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthCheckbox, AuthField, AuthSubmit } from '@/components/auth/fields'
import {
  getRememberedEmail,
  setRememberedEmail,
  setRememberMe,
  supabase,
} from '@/lib/supabase'
import {
  clearDisplayUserCache,
  setActiveRole,
  type Role,
} from '@/lib/useDisplayUser'
import { errMessage } from '@/lib/errors'

export function SignInPage() {
  const navigate = useNavigate()
  const remembered = getRememberedEmail()
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Set when the signed-in account has BOTH a candidate and an employer profile.
  const [pickRole, setPickRole] = useState(false)

  function goAs(role: Role) {
    setActiveRole(role)
    clearDisplayUserCache()
    navigate(role === 'employer' ? '/employer/dashboard' : '/dashboard')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      setRememberMe(remember)
      setRememberedEmail(remember ? email : null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      const userId = data.user.id

      const [{ data: candidateRow }, { data: employerRow }] = await Promise.all([
        supabase.from('candidates').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('employers').select('id').eq('user_id', userId).maybeSingle(),
      ])

      if (candidateRow && employerRow) {
        setPickRole(true)
        return
      }
      if (candidateRow) {
        goAs('candidate')
        return
      }
      if (employerRow) {
        goAs('employer')
        return
      }

      setError('No candidate or employer profile found for this account.')
    } catch (err) {
      setError(errMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (pickRole) {
    return (
      <AuthLayout variant="centered">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">
            Continue as…
          </h1>
          <p className="text-base text-ink-600">
            This email has both a candidate and an employer profile. You can
            switch anytime from the menu.
          </p>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => goAs('candidate')}
              className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white hover:bg-brand-600"
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => goAs('employer')}
              className="rounded-[4px] border border-brand px-6 py-3 text-base font-semibold text-brand hover:bg-brand-50"
            >
              Employer
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium leading-10 text-ink">Sign in</h1>
          <p className="text-base text-ink-600">
            Don&rsquo;t have account{' '}
            <Link to="/create-account" className="font-medium text-brand">
              Create Account
            </Link>
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col gap-5">
          <AuthField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthField
            label="Password"
            name="password"
            password
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <AuthCheckbox
              name="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            >
              Remember Me
            </AuthCheckbox>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand"
            >
              Forget password
            </Link>
          </div>
        </div>

        <AuthSubmit disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
