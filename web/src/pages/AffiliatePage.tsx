import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRightIcon } from '@/components/icons'
import { CtaButton, Eyebrow, GoldCircle, Headline, Section, Steps } from '@/components/marketing/blocks'
import { errMessage } from '@/lib/errors'
import { fetchMyAffiliate, joinAffiliate, referralLink, type AffiliateRow } from '@/lib/affiliate'
import { useT } from '@/lib/i18n'
import { COUNTRY_NAMES, formatLocal, formatUsd, usePricing } from '@/lib/partly'
import { useDisplayUser } from '@/lib/useDisplayUser'
import { useSession } from '@/lib/useSession'

/**
 * "Become an Affiliate" — a standing earnings program, distinct from the
 * one-off Hire-me badge and Invite-a-friend modules.
 */
export function AffiliatePage() {
  const t = useT()
  const { pricing } = usePricing()
  const { session } = useSession()
  const { user } = useDisplayUser()
  const userId = session?.user.id ?? null
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!userId) {
      setAffiliate(null)
      return
    }
    fetchMyAffiliate(userId).then(setAffiliate).catch((err) => console.error('affiliate', err))
  }, [userId])

  async function handleJoin() {
    if (!userId) return
    setJoining(true)
    try {
      setAffiliate(await joinAffiliate(userId))
      toast.success("You're now an affiliate — share your referral link below.")
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setJoining(false)
    }
  }

  async function copyLink() {
    if (!affiliate) return
    try {
      await navigator.clipboard.writeText(referralLink(affiliate.referral_code))
      toast.success('Referral link copied')
    } catch {
      toast.error('Could not copy — select and copy the link manually.')
    }
  }

  const dashboardAffiliate = user?.role === 'employer' ? '/employer/affiliate' : '/dashboard/affiliate'

  return (
    <>
      <Section tone="alt">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow>{t('footer.affiliate')}</Eyebrow>
          <Headline>{t('aff.headline')}</Headline>
          <p className="text-lg leading-7 text-ink-600">{t('aff.sub')}</p>
          <div className="flex flex-wrap items-center gap-3">
            {!session ? (
              <CtaButton to="/create-account">{t('aff.cta')}</CtaButton>
            ) : affiliate ? (
              <>
                <input
                  readOnly
                  value={referralLink(affiliate.referral_code)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-12 min-w-[280px] flex-1 rounded-md border border-line bg-surface px-3 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-12 rounded-md bg-gold px-5 text-sm font-semibold text-navy hover:bg-amber-400"
                >
                  Copy link
                </button>
                <Link to={dashboardAffiliate} className="flex items-center gap-1 text-sm font-medium text-brand">
                  Ledger & payouts <ArrowRightIcon className="size-4" />
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex h-12 items-center rounded-md bg-gold px-6 text-sm font-semibold text-navy hover:bg-amber-400 disabled:opacity-50"
              >
                {joining ? 'Joining…' : t('aff.cta')}
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Two commission types, side by side */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { title: t('aff.card1.title'), tag: t('aff.card1.tag'), body: t('aff.card1.body'), key: 'badge' as const },
            { title: t('aff.card2.title'), tag: t('aff.card2.tag'), body: t('aff.card2.body'), key: 'lead' as const },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-line bg-cream p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-navy">{c.title}</h2>
                <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white">{c.tag}</span>
              </div>
              <p className="mt-3 text-ink-600">{c.body}</p>
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-1 font-medium">{t('pay.table.country')}</th>
                    <th className="py-1 font-medium">{t('aff.table.full')}</th>
                    <th className="py-1 font-medium">{t('aff.table.you')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((p) => (
                    <tr key={p.code} className="border-t border-line/70">
                      <td className="py-2 text-navy">{COUNTRY_NAMES[p.code] ?? p.name}</td>
                      <td className="py-2 text-ink-600">
                        {formatLocal(p, c.key === 'badge' ? p.badge_fee_local : p.lead_fee_local)}
                        {c.key === 'badge' ? ' / yr' : ''}
                        <span className="ml-1 text-xs text-muted">
                          · {formatUsd(c.key === 'badge' ? p.badge_fee_usd : p.lead_fee_usd)}
                        </span>
                      </td>
                      <td className="py-2 font-semibold text-navy">
                        {formatLocal(p, c.key === 'badge' ? p.affiliate_badge_local : p.affiliate_lead_local)}
                        <span className="ml-1 text-xs font-normal text-muted">
                          (~USD {c.key === 'badge' ? p.affiliate_badge_usd : p.affiliate_lead_usd})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{t('aff.payout')}</p>
      </Section>

      <Section tone="alt">
        <h2 className="mb-8 text-2xl font-semibold text-navy">{t('aff.how.title')}</h2>
        <Steps steps={[{ title: t('aff.how1') }, { title: t('aff.how2') }, { title: t('aff.how3') }]} />
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-surface p-5 text-sm text-ink-600">
          <GoldCircle size={32}>
            <ArrowRightIcon className="size-4" />
          </GoldCircle>
          {t('aff.attribution')}
        </div>
      </Section>
    </>
  )
}
