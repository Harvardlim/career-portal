import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, Countdown, EmptyState, Notice, Pill, PrimaryButton } from '@/components/partly/ui'
import { useCandidate } from '@/lib/dashboard'
import { countryName, fetchMyLeads, formatBoth, projectTypeLabel, usePricing, type LeadRow } from '@/lib/partly'

function statusPill(l: LeadRow) {
  if (l.status === 'paid')
    return <Pill tone="success">{l.contact_visible ? 'Contact unlocked' : 'Contact expired'}</Pill>
  if (l.status === 'awaiting_payment')
    return l.window_open ? <Pill tone="warning">Warm lead</Pill> : <Pill tone="neutral">Window closed</Pill>
  if (l.status === 'job_closed') return <Pill tone="neutral">Job closed</Pill>
  return <Pill tone="neutral">Went cold</Pill>
}

export function LeadsPage() {
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
          <h1 className="text-lg font-medium text-ink">
            Warm leads <span className="text-muted">({warm.length})</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            A business released its contact to you. Unlock it within 2 days — you're never charged for a lead you
            don't unlock.
          </p>
        </div>

        {rows.length === 0 && (
          <EmptyState>
            {loading ? 'Loading…' : 'No leads yet. Apply to open needs and you’ll be notified here when a business releases contact.'}
          </EmptyState>
        )}

        {warm.map((l) => (
          <Card key={l.id} className="border-amber-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{l.job?.title ?? 'Released lead'}</p>
                  {statusPill(l)}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {l.job?.category ?? '—'} · {countryName(l.job?.country)} · {projectTypeLabel(l.job?.project_type)}
                </p>
                {price && (
                  <p className="mt-1 text-sm font-medium text-ink">
                    Unlock fee: {formatBoth(price, price.lead_fee_local, price.lead_fee_usd)}
                  </p>
                )}
                {l.others_released > 0 && (
                  <p className="mt-2 text-xs text-amber-800">
                    Disclosure: this business also released contact to {l.others_released} other expert
                    {l.others_released === 1 ? '' : 's'} for this posting. You are one of {l.cohort_size} being considered.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <Countdown until={l.window_expires_at} />
                <Link to={`/dashboard/leads/${l.id}`}>
                  <PrimaryButton className="h-10">Pay to unlock contact</PrimaryButton>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {rest.length > 0 && (
          <>
            <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">History</h2>
            <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
              {rest.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/dashboard/leads/${l.id}`} className="font-medium text-ink hover:text-brand">
                        {l.job?.title ?? 'Released lead'}
                      </Link>
                      {statusPill(l)}
                    </div>
                    <p className="text-xs text-muted">
                      Released {new Date(l.released_at).toLocaleDateString()}
                      {l.ended_reason ? ` · ${l.ended_reason}` : ''}
                      {l.status === 'paid' && l.contact_expires_at
                        ? ` · contact ${l.contact_visible ? 'visible until' : 'expired'} ${new Date(l.contact_expires_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {rows.some((l) => l.status === 'cold' || l.status === 'job_closed') && (
          <Notice tone="brand">
            A lead going cold is a normal part of the process — no payment was ever taken, so there's nothing to refund.
          </Notice>
        )}
      </div>
    </DashboardLayout>
  )
}
