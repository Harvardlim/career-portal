import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LinkIcon, ShareIcon } from '@/components/icons'
import { Card, SecondaryButton } from '@/components/partly/ui'
import { fetchMyAffiliate, referralLink } from '@/lib/affiliate'
import { useT } from '@/lib/i18n'
import { useSession } from '@/lib/useSession'

/**
 * "Invite a friend" for either dashboard. The platform never sends anything on
 * the user's behalf: it only prepares a link/message the user shares through
 * their own channel, after ticking the consent line.
 */
export function InviteFriendPanel({ audience }: { audience: 'business' | 'expert' }) {
  const t = useT()
  const { session } = useSession()
  const [code, setCode] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (!session) return
    fetchMyAffiliate(session.user.id)
      .then((a) => setCode(a?.referral_code ?? null))
      .catch(() => setCode(null))
  }, [session])

  const link = code ? referralLink(code) : null
  const affiliatePath = audience === 'business' ? '/employer/affiliate' : '/dashboard/affiliate'
  const message = `${audience === 'business' ? t('share.invite.business') : t('share.invite.expert')} ${link ?? ''}`.trim()

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Invite link copied.')
    } catch {
      toast.error('Could not copy — select and copy it manually.')
    }
  }

  function open(url: string) {
    window.open(url, '_blank', 'noopener')
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ShareIcon className="size-5 text-brand" />
        <h2 className="font-semibold text-ink">Invite a friend</h2>
      </div>
      <p className="text-sm text-ink-600">{audience === 'business' ? t('share.invite.business') : t('share.invite.expert')}</p>
      {!link ? (
        <p className="text-sm text-muted">
          <Link to={affiliatePath} className="font-medium text-brand underline">
            Get your referral link
          </Link>{' '}
          to invite people — you'll earn a commission when they succeed.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 flex-1 rounded-md border border-line bg-surface px-3 text-sm text-ink"
            />
            <SecondaryButton className="h-10 px-3" onClick={copy}>
              <LinkIcon className="size-4" /> Copy
            </SecondaryButton>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
            I'll share this myself. partly.asia never contacts anyone on my behalf, and only my referral link is included.
          </label>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton
              className="h-9 px-3 text-xs"
              disabled={!agreed}
              onClick={() => open(`https://wa.me/?text=${encodeURIComponent(message)}`)}
            >
              WhatsApp
            </SecondaryButton>
            <SecondaryButton
              className="h-9 px-3 text-xs"
              disabled={!agreed}
              onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`)}
            >
              LinkedIn
            </SecondaryButton>
            <SecondaryButton
              className="h-9 px-3 text-xs"
              disabled={!agreed}
              onClick={() => open(`mailto:?subject=${encodeURIComponent('Join me on partly.asia')}&body=${encodeURIComponent(message)}`)}
            >
              Email
            </SecondaryButton>
          </div>
        </>
      )}
    </Card>
  )
}
