import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import {
  fetchHrInvites,
  sendHrInvite,
  useEmployer,
  type HrInviteRow,
} from '@/lib/employers'
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const defaultInvitation =
  "Hi,\n\nI'd like to invite you to join us on Partly Asia.\n\nThanks"

export function EmployerAffiliatePage() {
  const { employer, session, loading: employerLoading } = useEmployer()
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [invites, setInvites] = useState<HrInviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState(defaultInvitation)
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    const userId = session?.user.id
    if (!userId || !employer) return
    setLoading(true)
    try {
      const [aff, invs] = await Promise.all([
        fetchMyAffiliate(userId),
        fetchHrInvites(employer.id),
      ])
      setAffiliate(aff)
      setInvites(invs)
      setReferrals(aff ? await fetchMyReferrals(aff.id) : [])
    } catch (err) {
      console.error('employer affiliate', err)
    } finally {
      setLoading(false)
    }
  }, [session, employer])

  useEffect(() => {
    if (!employer && !employerLoading) {
      setLoading(false)
      return
    }
    void load()
  }, [employer, employerLoading, load])

  async function enrol() {
    const userId = session?.user.id
    if (!userId) return
    setJoining(true)
    try {
      const row = await joinAffiliate(userId)
      setAffiliate(row)
      setReferrals(await fetchMyReferrals(row.id))
      toast.success("You're enrolled — start sharing your referral link.")
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setJoining(false)
    }
  }

  const inviteLc = inviteEmail.trim().toLowerCase()
  const ownEmails = [session?.user.email, employer?.business_email]
    .filter((e): e is string => !!e)
    .map((e) => e.toLowerCase())
  const isOwnEmail = ownEmails.includes(inviteLc)
  const isDupEmail = invites.some((i) => i.email.toLowerCase() === inviteLc)
  const inviteError = !inviteLc
    ? null
    : isOwnEmail
      ? "You can't invite your own email address."
      : isDupEmail
        ? 'That email is already in your Affiliate List.'
        : null

  async function sendInvite() {
    const to = inviteEmail.trim()
    if (!EMAIL_RE.test(to) || !inviteMsg.trim() || inviting || inviteError) return
    setInviting(true)
    try {
      const { delivered } = await sendHrInvite(to, inviteMsg.trim())
      toast.success(
        delivered
          ? `Invitation sent to ${to}`
          : `Invitation recorded for ${to} (email delivery is currently unavailable)`,
      )
      setInviteEmail('')
      await load()
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setInviting(false)
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

  const commission = summariseCommission(referrals)

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-medium text-ink">Affiliate</h1>

        {loading ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            Loading…
          </p>
        ) : !affiliate ? (
          <InfoCard title="Enrol in the Affiliate Program">
            <p className="text-sm text-muted-600">
              Earn a commission when a company or candidate you refer makes a
              qualifying purchase. You get a personal referral link, and every HR
              invitation you send counts as a referral.
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
              {[
                'USD 150 when a referred company buys the $999 package',
                'USD 99 for the $499 package, USD 30 for the $199 package',
                'USD 30 / 70 for a referred candidate’s monthly / yearly membership',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-brand" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={enrol}
              disabled={joining}
              className="mt-5 flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {joining ? 'Enrolling…' : 'Enrol Affiliate Program'}
              <ArrowRightIcon className="size-4" />
            </button>
          </InfoCard>
        ) : (
          <>
            <InfoCard title="Your referral link">
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
              <p className="mt-2 text-xs text-muted">
                Affiliate since {dateFmt.format(new Date(affiliate.joined_at))}.
              </p>
            </InfoCard>

            <InfoCard title="Invite someone">
              <p className="text-sm text-muted-600">
                Send an invitation email. It's added to your Affiliate List, and
                when they sign up and make a qualifying purchase you earn the
                commission.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="rounded-[3px] border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
                />
                <textarea
                  rows={4}
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  className="w-full resize-none rounded-md border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand"
                />
                {inviteError && (
                  <p className="text-xs text-danger">{inviteError}</p>
                )}
                <button
                  type="button"
                  onClick={sendInvite}
                  disabled={
                    inviting ||
                    !EMAIL_RE.test(inviteEmail.trim()) ||
                    !inviteMsg.trim() ||
                    !!inviteError
                  }
                  className="flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviting ? 'Sending…' : 'Send invitation'}
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
            </InfoCard>

            <InfoCard title="Affiliate Commission">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Commission earned', value: commission.earned },
                  { label: 'Paid to you', value: commission.paid },
                  { label: 'Balance owed', value: commission.balance },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="text-sm text-muted-600">{s.label}</span>
                    <span className="text-2xl font-medium text-ink">
                      ${s.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {referrals.length > 0 ? (
                <div className="mt-4 flex flex-col divide-y divide-line border-t border-line">
                  {referrals.map((r) => {
                    const pendingSignup = !r.referred_user_id
                    return (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
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
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs ${
                            r.commission_status === 'paid'
                              ? 'bg-brand-50 text-brand'
                              : r.commission_status === 'earned'
                                ? 'bg-[#e7f6ec] text-[#0ba02c]'
                                : 'bg-surface-alt text-muted'
                          }`}
                        >
                          {r.commission_status === 'pending'
                            ? pendingSignup
                              ? 'Awaiting sign-up'
                              : 'Pending purchase'
                            : `$${(r.commission_usd ?? 0).toLocaleString()} ${r.commission_status}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-4 border-t border-line py-4 text-center text-sm text-muted">
                  No referrals yet — share your link, or send HR invitations from
                  the Referral package on the pricing page.
                </p>
              )}
            </InfoCard>

            <InfoCard title="Affiliate List">
              {invites.length > 0 ? (
                <div className="flex flex-col divide-y divide-line">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="font-medium text-ink">{inv.email}</span>
                      <span className="text-muted-600">
                        Invited {dateFmt.format(new Date(inv.sent_at))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted">
                  No invitations sent yet. Send them from the Referral package on
                  the pricing page.
                </p>
              )}
            </InfoCard>
          </>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
