import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'
import { supabase } from '@/lib/supabase'
import { errMessage } from '@/lib/errors'
import { useT } from '@/lib/i18n'

export function ResetPasswordPage() {
  const t = useT()
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
      setError(t('ui.passwords_do_not_match'))
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
        <p className="py-10 text-center text-sm text-muted">{t('ui.checking_your_link')}</p>
      </AuthLayout>
    )
  }

  if (linkState === 'invalid') {
    return (
      <AuthLayout variant="centered">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.this_link_is_invalid_or_expired')}</h1>
          <p className="text-base leading-6 text-muted">{t('ui.password_reset_links_can_only_be')}</p>
          <Link
            to="/forgot-password"
            className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >{t('ui.request_a_new_link')}</Link>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout variant="centered">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.password_updated')}</h1>
          <p className="text-base leading-6 text-muted">{t('ui.your_password_has_been_reset_you')}</p>
          <Link
            to="/sign-in"
            className="rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >{t('ui.go_to_sign_in')}</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="centered">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-9">
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.reset_password')}</h1>
          <p className="text-base leading-6 text-muted">{t('ui.enter_a_new_password_for_your')}</p>
        </div>

        {error && (
          <p className="w-full rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex w-full flex-col gap-4">
          <AuthField
            label={t('ui.new_password')}
            name="password"
            password
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthField
            label={t('ui.confirm_password')}
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
          {submitting ? t('ui.updating') : t('ui.reset_password')}
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
