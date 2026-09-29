import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { MailIcon, ShareIcon, XCircleIcon } from '@/components/icons'
import { GoldCircle } from '@/components/marketing/blocks'
import { SITE_URL } from '@/lib/site'
import { useT } from '@/lib/i18n'

/**
 * The "invite your friends" pop-out a visitor sees on arriving at the home
 * page. Everything is shared by the visitor themself through their own
 * channel ,  partly.asia never contacts anyone on their behalf.
 */
export function InviteFriendsPopup() {
  const t = useT()
  const message = t('invite.msg', { url: SITE_URL })
  const [open, setOpen] = useState(false)

  // Shown on every visit to the home page (by request), not once per session.
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const close = () => setOpen(false)

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      toast.success(t('ui.invite_message_copied_paste_it_anywhere'))
    } catch {
      toast.error(t('share.copy_failed') + ' ' + SITE_URL)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-popup-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[460px] rounded-2xl bg-surface p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label={t('ui.close')}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-alt hover:text-ink"
        >
          <XCircleIcon className="size-5" />
        </button>

        <div className="mx-auto mb-4 w-fit">
          <GoldCircle size={64}>
            <ShareIcon className="size-7" />
          </GoldCircle>
        </div>
        <h2
          id="invite-popup-title"
          className="text-2xl font-medium text-navy"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >{t('ui.know_someone_who_d_love_partly')}</h2>
        <p className="mt-3 text-sm leading-6 text-ink-600">{t('ui.invite_your_friends_to_visit_businesses')}</p>

        <p className="mt-4 rounded-md bg-surface-alt p-3 text-left text-sm leading-6 text-ink-600">{message}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ShareIcon className="size-5" />{' '}{t('ui.whatsapp')}</a>
          <a
            href={`mailto:?subject=${encodeURIComponent(t('share.mail_subject_look'))}&body=${encodeURIComponent(message)}`}
            onClick={close}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <MailIcon className="size-5" />{' '}{t('ui.email')}</a>
        </div>
        <button type="button" onClick={copyMessage} className="mt-3 text-sm font-medium text-brand underline hover:text-brand-600">{t('ui.copy_message_instead')}</button>

        <p className="mt-5 text-xs text-muted">
          <Link to="/affiliate" onClick={close} className="underline hover:text-ink">{t('ui.how_referral_commissions_work')}</Link>
          {' · '}
          <button type="button" onClick={close} className="underline hover:text-ink">{t('ui.maybe_later')}</button>
        </p>
      </div>
    </div>
  )
}
