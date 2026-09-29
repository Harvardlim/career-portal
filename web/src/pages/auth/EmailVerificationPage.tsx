import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthField, AuthSubmit } from '@/components/auth/fields'
import { useT } from '@/lib/i18n'

export function EmailVerificationPage() {
  const t = useT()
  return (
    <AuthLayout variant="centered">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-9"
      >
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-3xl font-medium leading-10 text-ink">{t('ui.email_verification')}</h1>
          <p className="text-base leading-6 text-muted">{t('ui.we_ve_sent_an_verification_to')}<span className="text-ink">{t('ui.emailaddress_gmail_com')}</span>{' '}{t('ui.to_verify_your_email_address_and')}</p>
        </div>

        <AuthField label={t('ui.verification_code')} name="code" size="lg" />

        <AuthSubmit>{t('ui.verify_my_account')}</AuthSubmit>

        <p className="text-base text-ink-600">{t('ui.didn_t_recieve_any_code')}<button type="button" className="font-medium text-brand">{t('ui.resends')}</button>
        </p>
      </form>
    </AuthLayout>
  )
}
