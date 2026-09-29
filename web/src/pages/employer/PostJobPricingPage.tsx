import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import {
  fetchEmployerMembership,
  sendHrInvite,
  useEmployer,
  type EmployerMembershipStatus,
} from '@/lib/employers'
import { errMessage } from '@/lib/errors'
import {
  readCheckoutOutcome,
  startCheckout,
  type CreditPackageKey,
} from '@/lib/stripe'
import { ArrowRightIcon, CheckIcon, MailIcon } from '@/components/icons'
import { validateEmail } from '@/lib/partly'
import { tr, useT } from '@/lib/i18n'


const defaultInvitation = () => tr('inv.hiring')

function ReferralPackageCard({
  onBuy,
  disabled,
  pending,
}: {
  onBuy: () => void
  disabled: boolean
  pending: boolean
}) {
  const t = useT()
  const [emails, setEmails] = useState(['', '', ''])
  const [consents, setConsents] = useState([false, false, false])
  const [sent, setSent] = useState([false, false, false])
  const [sending, setSending] = useState<number | null>(null)
  const [message, setMessage] = useState(defaultInvitation)

  const dupInForm = (i: number) => {
    const v = emails[i].trim().toLowerCase()
    return !!v && emails.some((e, j) => j !== i && e.trim().toLowerCase() === v)
  }
  const rowReady = (i: number) =>
    !validateEmail(emails[i]) && consents[i] && !dupInForm(i)
  const canBuy = [0, 1, 2].every((i) => sent[i]) && !disabled && !pending

  async function sendRow(i: number) {
    if (!rowReady(i) || sent[i] || !message.trim()) return
    setSending(i)
    try {
      const { delivered } = await sendHrInvite(emails[i].trim(), message.trim())
      setSent((prev) => prev.map((v, j) => (j === i ? true : v)))
      toast.success(
        delivered
          ? t('ui.invitation_sent_to_2', { v: emails[i].trim() })
          : t('ui.invitation_recorded_for_email_delivery_is_2', { v: emails[i].trim() }),
      )
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="relative flex flex-col rounded-xl border border-brand">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-brand px-3 py-1 text-xs font-medium text-white">{t('ui.referral_discount')}</span>
      <div className="flex flex-col gap-3 border-b border-line p-6">
        <p className="text-base font-medium text-ink">{t('ui.invite_your_hr_team')}</p>
        <p className="text-sm text-muted-600">{t('ui.invite_3_hr_emails_to_unlock')}</p>
        <p className="text-3xl font-medium text-brand">
          $499<span className="text-sm text-muted">{' '}{t('ui.3_credits')}</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm font-medium text-ink">{t('ui.send_an_invitation_to_each_of')}</p>

        <Field label={t('ui.invitation_message_pre_filled_you_can')}>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-md border border-line bg-surface p-4 text-sm text-ink outline-none focus:border-brand"
          />
        </Field>

        {emails.map((email, i) => {
          const isSent = sent[i]
          return (
            <div key={i} className="flex flex-col gap-2">
              <Field label={t('ui.hr_email', { v: i + 1 })}>
                <TextInput
                  type="email"
                  placeholder={t('ui.hr_company_com')}
                  icon={<MailIcon className="size-5" />}
                  value={email}
                  disabled={isSent}
                  onChange={(e) =>
                    setEmails((prev) =>
                      prev.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                />
              </Field>
              <label className="flex items-start gap-2.5 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={consents[i]}
                  disabled={isSent}
                  onChange={(e) =>
                    setConsents((prev) =>
                      prev.map((v, j) => (j === i ? e.target.checked : v)),
                    )
                  }
                  className="mt-0.5 size-5 shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
                />{t('ui.i_consent_to_sending_this_invitation')}<span className="font-medium text-ink">
                  {email.trim() || t('ui.hr_email_2', { v: i + 1 })}
                </span>
                .
              </label>
              {dupInForm(i) && (
                <p className="text-xs text-danger">{t('ui.this_email_is_already_used_in')}</p>
              )}
              <button
                type="button"
                disabled={
                  isSent || sending !== null || !rowReady(i) || !message.trim()
                }
                onClick={() => sendRow(i)}
                className="flex items-center justify-center gap-2 self-start rounded-[4px] border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSent ? (
                  <>
                    <CheckIcon className="size-4" />{t('ui.invitation_sent')}</>
                ) : sending === i ? (
                  t('ui.sending')
                ) : (
                  <>
                    <MailIcon className="size-4" />{t('ui.send_invitation')}</>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="p-6 pt-0">
        <button
          type="button"
          disabled={!canBuy}
          onClick={onBuy}
          className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-brand py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? t('ui.redirecting') : t('ui.buy_for_499')}
          <ArrowRightIcon className="size-4" />
        </button>
        {disabled ? (
          <p className="mt-2 text-center text-xs text-muted">{t('ui.your_account_already_has_credits_see')}</p>
        ) : (
          !canBuy &&
          !pending && (
            <p className="mt-2 text-center text-xs text-muted">{t('ui.send_the_invitation_to_all_3')}</p>
          )
        )}
      </div>
    </div>
  )
}

const TOP_UP: { price: string; credits: number; pkg: CreditPackageKey } = {
  price: '199',
  credits: 5,
  pkg: 'repeat_2',
}

export function PostJobPricingPage() {
  const t = useT()
  const { employer, loading: employerLoading } = useEmployer()
  const [membership, setMembership] = useState<EmployerMembershipStatus | null>(null)
  const [pending, setPending] = useState<CreditPackageKey | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (readCheckoutOutcome(location.search) === 'cancelled') {
      toast(t('co.cancelled'))
      navigate('/employer/pricing', { replace: true })
    }
  }, [location.search, navigate])

  useEffect(() => {
    if (!employer) return
    let alive = true
    fetchEmployerMembership(employer.id)
      .then((m) => alive && setMembership(m))
      .catch((err) => console.error('employer membership', err))
    return () => {
      alive = false
    }
  }, [employer])

  const isMember = membership?.is_active ?? false
  const knowMembership = membership !== null || (!employer && !employerLoading)

  async function buy(pkg: CreditPackageKey) {
    setPending(pkg)
    try {
      await startCheckout({ kind: 'credits', pkg })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_start_checkout'))
      setPending(null)
    }
  }

  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-10">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-medium text-ink">{t('ui.buy_credits_to_post_jobs')}</h1>
          <p className="mt-3 text-muted-600">{t('ui.1_job_post_uses_1_credit')}</p>
          {isMember && (
            <p className="mt-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand">{t('ui.you_ve_already_bought_a_package')}</p>
          )}
        </div>

        {!knowMembership ? (
          <p className="text-sm text-muted">{t('ui.loading_pricing')}</p>
        ) : isMember ? (
          /* After a first purchase (Standard $999 or Referral $499) the only
             option going forward is the $199 top-up. */
          <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-brand p-6">
            <div>
              <h2 className="text-lg font-medium text-ink">{t('ui.top_up_credit')}</h2>
              <p className="mt-1 text-sm text-muted-600">{t('ui.your_account_is_active_top_up')}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-alt px-5 py-4">
              <div className="flex flex-col">
                <span className="text-sm text-ink-600">{t('ui.top_up')}</span>
                <span className="text-lg font-medium text-ink">
                  ${TOP_UP.price}{' '}
                  <span className="text-sm text-muted">{t('ui.credits_2', { credits: TOP_UP.credits })}</span>
                </span>
              </div>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => buy(TOP_UP.pkg)}
                className="flex items-center gap-2 rounded-[4px] bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending === TOP_UP.pkg ? t('ui.redirecting') : t('ui.pay', { price: TOP_UP.price })}
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          /* First purchase only ,  choose Standard $999 or Referral $499. */
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-line">
              <div className="flex flex-col gap-3 border-b border-line p-6">
                <p className="text-base font-medium text-ink">{t('ui.standard')}</p>
                <p className="text-sm text-muted-600">{t('ui.buy_credits_outright_no_strings_attached')}</p>
                <p className="text-3xl font-medium text-brand">
                  $999<span className="text-sm text-muted">{' '}{t('ui.3_credits')}</span>
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 p-6">
                {[t('pjp.f1'), t('pjp.f2'), t('pjp.f3')].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                      <CheckIcon className="size-4 text-brand" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <div className="p-6 pt-0">
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => buy('standard')}
                  className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-brand-50 py-3 text-sm font-semibold text-brand hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending === 'standard' ? t('ui.redirecting') : t('ui.buy_for_999')}
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
            </div>

            <ReferralPackageCard
              onBuy={() => buy('referral')}
              disabled={false}
              pending={pending === 'referral'}
            />
          </div>
        )}

        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-alt p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium text-ink">{t('ui.refer_a_company_earn_a_commission')}</p>
            <p className="text-sm text-muted-600">{t('ui.get_usd_150_for_the_999')}</p>
          </div>
          <Link
            to="/affiliate"
            className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
          >{t('ui.learn_more')}<ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
