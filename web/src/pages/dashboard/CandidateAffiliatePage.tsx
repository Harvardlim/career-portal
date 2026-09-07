import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'
import { errMessage } from '@/lib/errors'
import { sendHrInvite } from '@/lib/employers'
import { useCandidate } from '@/lib/dashboard'
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
  "Hi,\n\nI'd like to invite you to join Partly Asia.\n\nThanks"

export function CandidateAffiliatePage() {
  const { candidate, session, loading: candidateLoading } = useCandidate()
  const userId = session?.user.id ?? null

  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState(defaultInvitation)
  const [inviting, setInviting] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const aff = await fetchMyAffiliate(userId)
      setAffiliate(aff)
      setReferrals(aff ? await fetchMyReferrals(aff.id) : [])
    } catch (err) {
      console.error('candidate affiliate', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId && !candidateLoading) {
      setLoading(false)
      return
    }
    void load()
  }, [userId, candidateLoading, load])

  async function enrol() {
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
  const isOwn = !!candidate?.email && candidate.email.toLowerCase() === inviteLc
  const isDup = referrals.some(
    (r) => (r.invited_email ?? '').toLowerCase() === inviteLc,
  )
  const inviteError = !inviteLc
    ? null
    : isOwn
      ? "You can't invite your own email address."
      : isDup
        ? 'That email is already in your list.'
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
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-medium text-ink">Affiliate</h1>

        {loading ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">
            Loading…
          </p>
        ) : !affiliate ? (
          <InfoCard title="Enrol in the Affiliate Program">
            <p className="text-sm text-muted-600">
              Earn a commission when someone you refer makes a qualifying
              purchase. You get a personal referral link, and every invitation
              you send counts as a referral.
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
              {[
                'USD 30 / 70 for a referred candidate’s monthly / yearly membership',
                'USD 150 / 99 / 30 for a referred company’s $999 / $499 / $199 package',
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
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="name@example.com"
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
                    const pending = !r.referred_user_id
                    return (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <span className="font-medium text-ink">
                          {pending ? (
                            r.invited_email
                          ) : (
                            <span className="capitalize">{r.referred_role}</span>
                          )}
                        </span>
                        <span className="text-muted-600">
                          {pending ? 'Invited' : 'Joined'}{' '}
                          {dateFmt.format(new Date(r.referred_at))}
                        </span>
                        <span className="text-muted-600">
                          {pending
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
                            ? pending
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
                  No referrals yet — share your link or send an invitation.
                </p>
              )}
            </InfoCard>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
