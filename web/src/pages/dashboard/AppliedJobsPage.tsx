import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AppliedJobRow } from '@/components/dashboard/JobRows'
import { fetchAppliedJobs, useCandidate, type AppliedJobRecord } from '@/lib/dashboard'
import { useT } from '@/lib/i18n'

export function AppliedJobsPage() {
  const t = useT()
  const { candidate, loading: candidateLoading } = useCandidate()
  const [rows, setRows] = useState<AppliedJobRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) {
      if (!candidateLoading) setLoading(false)
      return
    }
    let alive = true
    fetchAppliedJobs(candidate.id)
      .then((data) => alive && setRows(data))
      .catch((err) => console.error('applied jobs', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [candidate, candidateLoading])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-lg font-medium text-ink">{t('ui.applied_jobs')}{' '}<span className="text-muted">({rows.length})</span>
        </h1>
        {rows.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
              <span>{t('ui.jobs_2')}</span>
              <span className="sm:w-[150px]">{t('ui.date_applied')}</span>
              <span>{t('ui.status')}</span>
              <span>{t('ui.action')}</span>
            </div>
            <div className="flex flex-col divide-y divide-line">
              {rows.map(
                (rec) =>
                  rec.job && (
                    <AppliedJobRow
                      key={rec.id}
                      job={rec.job}
                      appliedAt={rec.applied_at}
                      status={rec.status}
                    />
                  ),
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg bg-surface-alt px-4 py-10 text-center text-sm text-muted">
            {loading ? t('ui.loading_2') : t('ui.you_haven_t_applied_to_any')}
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
