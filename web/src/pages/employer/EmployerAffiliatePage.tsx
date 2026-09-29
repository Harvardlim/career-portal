import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { AffiliateLedger } from '@/components/partly/AffiliateLedger'
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
  type AffiliateRow,
  type ReferralRow,
} from '@/lib/affiliate'
import { validateEmail } from '@/lib/partly'
import { tr, useT } from '@/lib/i18n'
import { optionLabel } from '@/lib/optionLabels'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})


const defaultInvitation = () => tr('inv.employer')

export function EmployerAffiliatePage() {
  const t = useT()
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
      toast.success(t('ui.you_re_enrolled_start_sharing_your'))
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
    : validateEmail(inviteEmail)
      ? t('aff.err_email')
      : isOwnEmail
      ? t('aff.err_own')
      : isDupEmail
        ? t('aff.err_dup_biz')
        : null

  async function sendInvite() {
    const to = inviteEmail.trim()
    if (!!validateEmail(to) || !inviteMsg.trim() || inviting || inviteError) return
    setInviting(true)
    try {
      const { delivered } = await sendHrInvite(to, inviteMsg.trim())
      toast.success(
        delivered
          ? t('ui.invitation_sent_to', { to })
          : t('ui.invitation_recorded_for_email_delivery_is', { to }),
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
      toast.success(t('ui.referral_link_copied'))
    } catch {
      toast.error(t('ui.could_not_copy_select_and_copy'))
    }
  }


  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-medium text-ink">{t('ui.affiliate')}</h1>

        {loading ? (
          <p className="rounded-lg bg-surface-alt px-4 py-12 text-center text-sm text-muted">{t('ui.loading_2')}</p>
        ) : !affiliate ? (
          <InfoCard title={t('ui.enrol_in_the_affiliate_program')}>
            <p className="text-sm text-muted-600">{t('ui.earn_a_commission_when_a_company')}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
              {[
                t('aff.perk1'),
                t('aff.perk2'),
                t('aff.perk3'),
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
              {joining ? t('ui.enrolling') : t('ui.enrol_affiliate_program')}
              <ArrowRightIcon className="size-4" />
            </button>
          </InfoCard>
        ) : (
          <>
            <InfoCard title={t('ui.your_referral_link')}>
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
                >{t('ui.copy')}</button>
              </div>
              <p className="mt-2 text-xs text-muted">{t('ui.affiliate_since', { v: dateFmt.format(new Date(affiliate.joined_at)) })}</p>
            </InfoCard>

            <InfoCard title={t('ui.invite_someone')}>
              <p className="text-sm text-muted-600">{t('ui.send_an_invitation_email_it_s')}</p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="email"
                  placeholder={t('ui.name_company_com')}
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
                    !!validateEmail(inviteEmail) ||
                    !inviteMsg.trim() ||
                    !!inviteError
                  }
                  className="flex w-fit items-center gap-2 rounded-[4px] bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviting ? t('ui.sending') : t('ui.send_invitation')}
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
            </InfoCard>

            <AffiliateLedger affiliateId={affiliate.id} userId={session!.user.id} />
            <InfoCard title={t('ui.people_you_referred')}>
              {referrals.length > 0 ? (
                <div className="flex flex-col divide-y divide-line">
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
                          {pendingSignup ? t('ui.invited') : t('ui.joined')}{' '}
                          {dateFmt.format(new Date(r.referred_at))}
                        </span>
                        <span className="text-muted-600">
                          {pendingSignup
                            ? t('ui.not_signed_up_yet')
                            : (r.purchase_ref ?? t('ui.no_purchase_yet'))}
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
                              ? t('ui.awaiting_sign_up')
                              : t('ui.pending_purchase')
                            : `$${(r.commission_usd ?? 0).toLocaleString()} ${optionLabel(r.commission_status)}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted">{t('ui.no_referrals_yet_share_your_link_2')}</p>
              )}
            </InfoCard>

            <InfoCard title={t('ui.affiliate_list')}>
              {invites.length > 0 ? (
                <div className="flex flex-col divide-y divide-line">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="font-medium text-ink">{inv.email}</span>
                      <span className="text-muted-600">{t('ui.invited_2', { v: dateFmt.format(new Date(inv.sent_at)) })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted">{t('ui.no_invitations_sent_yet_send_them')}</p>
              )}
            </InfoCard>
          </>
        )}
      </div>
    </EmployerDashboardLayout>
  )
}
