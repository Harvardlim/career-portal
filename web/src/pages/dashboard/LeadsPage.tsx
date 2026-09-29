import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, Countdown, EmptyState, Notice, Pill, PrimaryButton } from '@/components/partly/ui'
import { useCandidate } from '@/lib/dashboard'
import { countryName, fetchMyLeads, formatBoth, projectTypeLabel, usePricing, type LeadRow } from '@/lib/partly'
import { formatDate } from '@/lib/format'
import { tr, useT } from '@/lib/i18n'

function statusPill(l: LeadRow) {
  if (l.status === 'paid')
    return <Pill tone="success">{l.contact_visible ? tr('ui.contact_unlocked') : tr('ui.contact_expired')}</Pill>
  if (l.status === 'awaiting_payment')
    return l.window_open ? <Pill tone="warning">{tr('ui.warm_lead')}</Pill> : <Pill tone="neutral">{tr('ui.window_closed')}</Pill>
  if (l.status === 'job_closed') return <Pill tone="neutral">{tr('ui.job_closed')}</Pill>
  return <Pill tone="neutral">{tr('ui.went_cold')}</Pill>
}

export function LeadsPage() {
  const t = useT()
  const { candidate, loading: candidateLoading } = useCandidate()
  const { pricing } = usePricing()
  const price = pricing.find((p) => p.code === candidate?.country_code)
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) {
      if (!candidateLoading) setLoading(false)
      return
    }
    let alive = true
    fetchMyLeads(candidate.id)
      .then((d) => alive && setRows(d))
      .catch((err) => console.error('leads', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [candidate, candidateLoading])

  const warm = rows.filter((l) => l.status === 'awaiting_payment' && l.window_open)
  const rest = rows.filter((l) => !(l.status === 'awaiting_payment' && l.window_open))

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-lg font-medium text-ink">{t('ui.warm_leads')}{' '}<span className="text-muted">({warm.length})</span>
          </h1>
          <p className="mt-1 text-sm text-muted">{t('ui.a_business_released_its_contact_to')}</p>
        </div>

        {rows.length === 0 && (
          <EmptyState>
            {loading ? t('ui.loading_2') : t('ui.no_leads_yet_apply_to_open')}
          </EmptyState>
        )}

        {warm.map((l) => (
          <Card key={l.id} className="border-amber-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{l.job?.title ?? t('ui.released_lead')}</p>
                  {statusPill(l)}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {l.job?.category ?? ', '} · {countryName(l.job?.country)} · {projectTypeLabel(l.job?.project_type)}
                </p>
                {price && (
                  <p className="mt-1 text-sm font-medium text-ink">{t('ui.unlock_fee', { lead_fee_usd: formatBoth(price, price.lead_fee_local, price.lead_fee_usd) })}</p>
                )}
                {l.others_released > 0 && (
                  <p className="mt-2 text-xs text-amber-800">{t('ui.disclosure_this_business_also_released_contact', { others_released: l.others_released })}{l.others_released === 1 ? '' : t('ui.plural_s')}{' '}{t('ui.for_this_posting_you_are_one', { cohort_size: l.cohort_size })}</p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <Countdown until={l.window_expires_at} />
                <Link to={`/dashboard/leads/${l.id}`}>
                  <PrimaryButton className="h-10">{t('ui.pay_to_unlock_contact')}</PrimaryButton>
                </Link>
                {l.job?.slug && (
                  <Link to={`/job/${l.job.slug}`} className="text-sm font-medium text-brand hover:underline">{t('ui.view_job_posting')}</Link>
                )}
              </div>
            </div>
          </Card>
        ))}

        {rest.length > 0 && (
          <>
            <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.history')}</h2>
            <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
              {rest.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/dashboard/leads/${l.id}`} className="font-medium text-ink hover:text-brand">
                        {l.job?.title ?? t('ui.released_lead')}
                      </Link>
                      {statusPill(l)}
                    </div>
                    {l.job?.slug && (
                      <Link to={`/job/${l.job.slug}`} className="text-xs font-medium text-brand hover:underline">{t('ui.view_job_posting')}</Link>
                    )}
                    <p className="text-xs text-muted">{t('ui.released', { released_at: formatDate(l.released_at) })}{l.ended_reason ? ` · ${l.ended_reason}` : ''}
                      {l.status === 'paid' && l.contact_expires_at
                        ? t(l.contact_visible ? 'leads.visible' : 'leads.expired', { date: formatDate(l.contact_expires_at) })
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {rows.some((l) => l.status === 'cold' || l.status === 'job_closed') && (
          <Notice tone="brand">{t('ui.a_lead_going_cold_is_a')}</Notice>
        )}
      </div>
    </DashboardLayout>
  )
}
