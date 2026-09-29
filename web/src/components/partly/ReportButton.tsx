import { useState } from 'react'
import { toast } from 'sonner'
import { FirstAidIcon } from '@/components/icons'
import { fileReport, type ReportTargetKind } from '@/lib/partly'
import { useT } from '@/lib/i18n'
import type { TranslationKey } from '@/locales'

const REASON_KEY: Record<string, TranslationKey> = {
  'Misleading or fake posting': 'rep.r.job_fake',
  'Suspected scam': 'rep.r.scam',
  'Inappropriate content': 'rep.r.inappropriate',
  Other: 'rep.r.other',
  'Suspected scam or fraud': 'rep.r.scam_fraud',
  'Never responds after payment': 'rep.r.no_response',
  'Impersonating a real company': 'rep.r.impersonate',
  'Fake or misleading profile': 'rep.r.fake_profile',
  'Fake or unfair review': 'rep.r.fake_review',
  'Not related to an actual engagement': 'rep.r.not_engagement',
}

// The English reason is what gets filed (staff read it); only the label shown is translated.
const TITLE_KEY: Record<ReportTargetKind, TranslationKey> = {
  job: 'rep.title.job',
  employer: 'rep.title.employer',
  candidate: 'rep.title.candidate',
  rating: 'rep.title.rating',
}

const REASONS: Record<ReportTargetKind, string[]> = {
  job: ['Misleading or fake posting', 'Suspected scam', 'Inappropriate content', 'Other'],
  employer: ['Suspected scam or fraud', 'Never responds after payment', 'Impersonating a real company', 'Other'],
  candidate: ['Fake or misleading profile', 'Inappropriate content', 'Suspected scam', 'Other'],
  rating: ['Fake or unfair review', 'Not related to an actual engagement', 'Inappropriate content', 'Other'],
}

/** Small "Report" link + modal, usable on any job, business or expert page. */
export function ReportButton({
  targetKind,
  targetId,
  label,
  className = '',
}: {
  targetKind: ReportTargetKind
  targetId: string
  label?: string
  className?: string
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[targetKind][0])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      await fileReport({ targetKind, targetId, reason, details: details.trim() || undefined })
      toast.success(t('ui.thanks_our_team_will_review_this'))
      setOpen(false)
      setDetails('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_send_report'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs text-muted hover:text-danger ${className}`}
      >
        <FirstAidIcon className="size-3.5" />
        {label ?? t('ui.report')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">{t(TITLE_KEY[targetKind])}</h2>
            <p className="mt-1 text-sm text-muted-600">{t('ui.our_team_reviews_every_report_this')}</p>
            <div className="mt-4 flex flex-col gap-2">
              {REASONS[targetKind].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-ink">
                  <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                  {REASON_KEY[r] ? t(REASON_KEY[r]) : r}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder={t('ui.add_any_details_that_would_help')}
              className="mt-3 w-full resize-none rounded-md border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink">{t('ui.cancel')}</button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {submitting ? t('ui.sending') : t('ui.submit_report')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
