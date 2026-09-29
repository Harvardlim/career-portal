import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { errMessage } from '@/lib/errors'
import { useT } from '@/lib/i18n'

export function ForgotPasswordPage() {
  const t = useT()
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
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.check_your_email')}</h1>
          <p className="text-base text-ink-600">{t('ui.if_an_account_exists_for_we', { email })}</p>
          <Link to="/sign-in" className="font-medium text-brand">{t('ui.back_to_sign_in')}</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.forget_password')}</h1>
          <div className="flex flex-col gap-2 text-base">
            <p className="text-ink-600">{t('ui.go_back_to')}<Link to="/sign-in" className="font-medium text-brand">{t('ui.sign_in_2')}</Link>
            </p>
            <p className="text-ink-600">{t('ui.don_t_have_account')}<Link to="/create-account" className="font-medium text-brand">{t('ui.create_account_2')}</Link>
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <AuthField
          label={t('ui.email_address')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthSubmit disabled={submitting}>
          {submitting ? t('ui.sending_2') : t('ui.reset_password')}
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
