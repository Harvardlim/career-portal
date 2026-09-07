import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { ArrowRightIcon, CheckIcon, UserIcon, UsersIcon } from '@/components/icons'
import { useSession } from '@/lib/useSession'
import { errMessage } from '@/lib/errors'
import {
  fetchMyAffiliate,
  fetchMyReferrals,
  joinAffiliate,
  referralLink,
  summariseCommission,
  type AffiliateRow,
  type ReferralRow,
} from '@/lib/affiliate'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const individualTiers = [
  { plan: 'Monthly Member', price: '99', commission: '30' },
  { plan: 'Yearly Member', price: '199', commission: '70' },
]

const companyTiers = [
  { plan: '999 Credit Package', price: '999', commission: '150' },
  { plan: '499 Credit Package', price: '499', commission: '99' },
  { plan: '199 Credit Package', price: '199', commission: '30' },
]

export function AffiliatePage() {
  const { session, loading: sessionLoading } = useSession()
  const userId = session?.user.id ?? null
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [loadingAffiliate, setLoadingAffiliate] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!userId) {
      setAffiliate(null)
      setReferrals([])
      return
    }
    let alive = true
    setLoadingAffiliate(true)
    fetchMyAffiliate(userId)
      .then(async (row) => {
        if (!alive) return
        setAffiliate(row)
        if (row) setReferrals(await fetchMyReferrals(row.id))
      })
      .catch((err) => console.error('affiliate', err))
      .finally(() => alive && setLoadingAffiliate(false))
    return () => {
      alive = false
    }
  }, [userId])

  async function handleJoin() {
    if (!userId) return
    setJoining(true)
    try {
      const row = await joinAffiliate(userId)
      setAffiliate(row)
      setReferrals(await fetchMyReferrals(row.id))
      toast.success("You're now an affiliate — share your referral link below.")
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setJoining(false)
    }
  }

  const commission = summariseCommission(referrals)

  async function copyLink() {
    if (!affiliate) return
    try {
      await navigator.clipboard.writeText(referralLink(affiliate.referral_code))
      toast.success('Referral link copied')
    } catch {
      toast.error('Could not copy — select and copy the link manually.')
    }
  }

  const busy = sessionLoading || loadingAffiliate

  return (
    <>
      <Breadcrumb
        title="Affiliate Program"
        trail={[{ label: 'Home', to: '/' }, { label: 'Affiliate Program' }]}
      />

      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-16 px-6 py-16">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-medium text-ink lg:text-4xl">
            Earn commission by referring Partly Asia
          </h1>
          <p className="mx-auto max-w-xl text-muted-600">
            Registering and applying to jobs is always free. When someone you refer
            upgrades to a paid plan, you earn a commission.
          </p>
        </div>

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand">
              <UserIcon className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-medium text-ink">Individual Affiliate</h2>
              <p className="text-sm text-muted-600">
                Refer a candidate who upgrades to a paid Membership.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {individualTiers.map((t) => (
              <div
                key={t.plan}
                className="flex flex-col gap-3 rounded-xl border border-line p-6"
              >
                <p className="text-sm text-muted-600">
                  When they join the{' '}
                  <span className="font-medium text-ink">{t.plan}</span> (USD {t.price})
                </p>
                <p className="text-3xl font-medium text-brand">
                  USD {t.commission}
                  <span className="text-sm text-muted"> commission</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand">
              <UsersIcon className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-medium text-ink">Company Affiliate</h2>
              <p className="text-sm text-muted-600">
                Refer a company that buys a job-posting credit package.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {companyTiers.map((t) => (
              <div
                key={t.plan}
                className="flex flex-col gap-3 rounded-xl border border-line p-6"
              >
                <p className="text-sm text-muted-600">
                  When they buy the{' '}
                  <span className="font-medium text-ink">USD {t.price} credit package</span>
                </p>
                <p className="text-3xl font-medium text-brand">
                  USD {t.commission}
                  <span className="text-sm text-muted"> commission</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-6 rounded-xl bg-surface-alt p-10 text-center">
          <ul className="flex flex-col gap-2 text-left text-sm text-ink-600">
            {[
              'Get a personal referral link when you join',
              'Track referrals and commissions from your dashboard',
              'Get paid out once a referral completes their purchase',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          {busy ? (
            <span className="rounded-[3px] bg-brand/60 px-6 py-3 text-base font-semibold text-white">
              Loading…
            </span>
          ) : affiliate ? (
            <div className="flex w-full max-w-md flex-col gap-3">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-brand">
                <CheckIcon className="size-4" />
                You&apos;re an affiliate. Share your link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink(affiliate.referral_code)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded-[3px] border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-[3px] bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-muted">
                Affiliate since {dateFmt.format(new Date(affiliate.joined_at))}.
                Commission is earned on purchases by people who register through
                your link after this date.
              </p>
            </div>
          ) : session ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center gap-3 rounded-[3px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining ? 'Joining…' : 'Become an Affiliate'}
              <ArrowRightIcon className="size-5" />
            </button>
          ) : (
            <Link
              to="/sign-in"
              className="flex items-center gap-3 rounded-[3px] bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Sign in to become an Affiliate
              <ArrowRightIcon className="size-5" />
            </Link>
          )}
        </section>

        {affiliate && !busy && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Your referrals</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Commission earned', value: commission.earned },
                { label: 'Paid out', value: commission.paid },
                { label: 'Balance owed', value: commission.balance },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-1 rounded-xl border border-line p-5"
                >
                  <span className="text-sm text-muted-600">{s.label}</span>
                  <span className="text-2xl font-medium text-ink">
                    USD {s.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            {referrals.length > 0 ? (
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
                {referrals.map((r) => {
                  const pendingSignup = !r.referred_user_id
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                    >
                      <span className="font-medium text-ink">
                        {pendingSignup ? (
                          r.invited_email
                        ) : (
                          <span className="capitalize">{r.referred_role}</span>
                        )}
                      </span>
                      <span className="text-muted-600">
                        {pendingSignup ? 'Invited' : 'Joined'}{' '}
                        {dateFmt.format(new Date(r.referred_at))}
                      </span>
                      <span className="text-muted-600">
                        {pendingSignup
                          ? 'Not signed up yet'
                          : (r.purchase_ref ?? 'No purchase yet')}
                      </span>
                      {r.commission_status === 'paid' ? (
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand">
                          USD {(r.commission_usd ?? 0).toLocaleString()} paid
                        </span>
                      ) : r.commission_status === 'earned' ? (
                        <span className="rounded-full bg-[#e7f6ec] px-2.5 py-0.5 text-xs font-medium text-[#0ba02c]">
                          USD {(r.commission_usd ?? 0).toLocaleString()} earned
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-muted">
                          {pendingSignup ? 'Awaiting sign-up' : 'Pending purchase'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-line p-6 text-center text-sm text-muted">
                No referrals yet. Share your link above — you earn once someone
                who signs up through it makes a qualifying purchase.
              </p>
            )}
          </section>
        )}
      </div>
    </>
  )
}
