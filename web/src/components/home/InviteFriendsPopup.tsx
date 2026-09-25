import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ShareIcon, XCircleIcon } from '@/components/icons'
import { GoldCircle } from '@/components/marketing/blocks'
import { SITE_URL } from '@/lib/site'

/** Shown once per browser session, so a visitor bouncing between pages isn't nagged every time. */
const SEEN_KEY = 'invite-popup-seen'

const MESSAGE = `I found partly.asia — verified fractional experts matched to real business needs across Southeast Asia. Have a look: ${SITE_URL}`

/**
 * The "invite your friends" pop-out a visitor sees on arriving at the home
 * page. Everything is shared by the visitor themself through their own
 * channel — partly.asia never contacts anyone on their behalf.
 */
export function InviteFriendsPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* storage unavailable: still show it once for this page load */
    }
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

  async function inviteNow() {
    // Native share sheet where it exists (phones); otherwise copy the message.
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title: 'partly.asia', text: MESSAGE, url: SITE_URL })
        close()
        return
      } catch {
        /* user dismissed the sheet, or it failed: fall through to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(MESSAGE)
      toast.success('Invite message copied — paste it to your friends.')
      close()
    } catch {
      toast.error('Could not copy the invite. Please share the link by hand: ' + SITE_URL)
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
          aria-label="Close"
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
        >
          Know someone who&apos;d love partly.asia?
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          Invite your friends to visit — businesses find verified experts, and experts find real projects. Once you
          have an account, your referral link also earns you a commission every time an invite pays off.
        </p>

        <button
          type="button"
          onClick={inviteNow}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <ShareIcon className="size-5" /> Invite Now
        </button>

        <p className="mt-5 text-xs text-muted">
          <Link to="/affiliate" onClick={close} className="underline hover:text-ink">
            How referral commissions work
          </Link>
          {' · '}
          <button type="button" onClick={close} className="underline hover:text-ink">
            Maybe later
          </button>
        </p>
      </div>
    </div>
  )
}
