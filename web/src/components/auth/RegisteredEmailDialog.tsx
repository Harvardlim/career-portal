import { Link } from 'react-router-dom'
import { useT } from '@/lib/i18n'

type Role = 'candidate' | 'employer'

/** Shown when someone tries to register an email that already has an account. */
export function RegisteredEmailDialog({
  email,
  existingRole,
  targetRole,
  onClose,
}: {
  email: string
  existingRole: Role
  targetRole: Role
  onClose: () => void
}) {
  const t = useT()
  const sameRole = existingRole === targetRole
  const label = (r: Role) => (r === 'candidate' ? t('ui.role_expert') : t('ui.role_business'))
  const article = (r: Role) => (r === 'candidate' ? 'an' : 'a')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-[440px] rounded-xl bg-surface p-6 shadow-2xl">
        <h2 className="text-lg font-medium text-ink">{t('ui.this_email_is_already_registered')}</h2>
        <p className="mt-2 text-sm text-muted-600">
          <b>{email}</b>{' '}{t('ui.is_already_registered_as', { article: article(existingRole), existingRole: label(existingRole) })}</p>
        <p className="mt-2 text-sm text-muted-600">
          {sameRole ? (
            <>{t('ui.please_sign_in_to_that_account')}</>
          ) : (
            <>{t('ui.one_email_can_only_hold_one', { article: article(targetRole), targetRole: label(targetRole), existingRole: label(existingRole) })}</>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
          >{t('ui.cancel')}</button>
          <Link
            to="/sign-in"
            className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >{t('ui.go_to_sign_in')}</Link>
        </div>
      </div>
    </div>
  )
}

/** Shown on a registration page when the visitor is already signed in to an account. */
export function AlreadySignedInNotice({
  email,
  role,
  dashboardPath,
  onSignOut,
}: {
  email: string
  role: Role
  dashboardPath: string
  onSignOut: () => void
}) {
  const t = useT()
  const label = role === 'candidate' ? t('ui.an_expert') : t('ui.a_business')
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-16 text-center">
      <h1 className="text-2xl font-medium text-navy" style={{ fontFamily: 'Georgia, serif' }}>{t('ui.you_already_have_an_account')}</h1>
      <p className="text-sm text-muted-600">{t('ui.you_re_signed_in_as')}{' '}<b>{email}</b>{t('ui.which_is_account_one_email_can', { label })}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={dashboardPath} className="rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">{t('ui.go_to_my_dashboard')}</Link>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-[4px] border border-line px-5 py-2.5 text-sm font-semibold text-ink-600 hover:text-ink"
        >{t('ui.sign_out')}</button>
      </div>
    </div>
  )
}
