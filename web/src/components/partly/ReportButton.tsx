import { useState } from 'react'
import { toast } from 'sonner'
import { FirstAidIcon } from '@/components/icons'
import { fileReport, type ReportTargetKind } from '@/lib/partly'

const REASONS: Record<ReportTargetKind, string[]> = {
  job: ['Misleading or fake posting', 'Suspected scam', 'Inappropriate content', 'Other'],
  employer: ['Suspected scam or fraud', 'Never responds after payment', 'Impersonating a real company', 'Other'],
  candidate: ['Fake or misleading profile', 'Inappropriate content', 'Suspected scam', 'Other'],
}

/** Small "Report" link + modal, usable on any job, business or expert page. */
export function ReportButton({
  targetKind,
  targetId,
  label = 'Report',
  className = '',
}: {
  targetKind: ReportTargetKind
  targetId: string
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[targetKind][0])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      await fileReport({ targetKind, targetId, reason, details: details.trim() || undefined })
      toast.success('Thanks — our team will review this.')
      setOpen(false)
      setDetails('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send report')
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
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">Report this {targetKind === 'employer' ? 'business' : targetKind === 'candidate' ? 'expert' : 'posting'}</h2>
            <p className="mt-1 text-sm text-muted-600">Our team reviews every report. This doesn't notify the other party.</p>
            <div className="mt-4 flex flex-col gap-2">
              {REASONS[targetKind].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-ink">
                  <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Add any details that would help us look into it (optional)"
              className="mt-3 w-full resize-none rounded-md border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
