import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
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
  clearSuspendedReason,
  getSuspendedReason,
  setActiveRole,
  type Role,
} from '@/lib/useDisplayUser'
import { errMessage } from '@/lib/errors'

export function SignInPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const remembered = getRememberedEmail()
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  // Shown once when this page loads because a session got signed out mid-use
  // for being suspended (see useDisplayUser). Read once, then cleared, so a
  // later unrelated error on this same page doesn't keep re-showing it.
  const [suspendedNotice] = useState(() => {
    const reason = getSuspendedReason()
    clearSuspendedReason()
    return reason
  })
  const [error, setError] = useState<string | null>(null)
  // Set when the signed-in account has BOTH a candidate and an employer profile.
  const [pickRole, setPickRole] = useState(false)

  // The confirmation-email link lands here (?confirmed=1). GoTrue has already
  // verified the address and, as a side effect, opened a session in this
  // browser; drop it so the person actually signs in from the login page.
  useEffect(() => {
    if (params.get('confirmed') !== '1') return
    toast.success('Your email is confirmed — sign in to continue.')
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) return supabase.auth.signOut()
    })
    navigate('/sign-in', { replace: true })
  }, [params, navigate])

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
        supabase.from('candidates').select('id, suspended, suspended_reason').eq('user_id', userId).maybeSingle(),
        supabase.from('employers').select('id, suspended, suspended_reason').eq('user_id', userId).maybeSingle(),
      ])

      if (candidateRow?.suspended || employerRow?.suspended) {
        await supabase.auth.signOut()
        setError(
          candidateRow?.suspended_reason ??
            employerRow?.suspended_reason ??
            'Your account has been suspended. Contact partly.asia support if you think this is a mistake.',
        )
        return
      }

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

      setError('No expert or business profile found for this account.')
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
            This email has both an expert and a business profile. You can
            switch anytime from the menu.
          </p>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => goAs('candidate')}
              className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white hover:bg-brand-600"
            >
              Expert
            </button>
            <button
              type="button"
              onClick={() => goAs('employer')}
              className="rounded-[4px] border border-brand px-6 py-3 text-base font-semibold text-brand hover:bg-brand-50"
            >
              Business
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

        {suspendedNotice && !error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            You were signed out: {suspendedNotice}
          </p>
        )}
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
