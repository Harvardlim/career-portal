import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { SelectMenu } from '@/components/app/SelectMenu'
import { useSession } from '@/lib/useSession'
import { fileIssueReport, ISSUE_CATEGORIES, type IssueCategory } from '@/lib/partly'
import { useT } from '@/lib/i18n'

const MAX = 4000

/**
 * Floating "Report an issue" button, docked to the right edge for every
 * signed-in user. Submissions go to public.issue_reports and are triaged in
 * the backoffice.
 */
export function IssueReportButton() {
  const t = useT()
  const { session } = useSession()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<IssueCategory>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    textRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!session) return null

  async function submit() {
    setSubmitting(true)
    try {
      await fileIssueReport({ category, message })
      toast.success(t('ui.thanks_we_received_your_report_and'))
      setOpen(false)
      setMessage('')
      setCategory('bug')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_send_your_report'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('ui.report_an_issue')}
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-lg bg-brand px-3 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-600 print:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 22V4M4 4h13l-2 4 2 4H4" />
        </svg>
        <span className="hidden sm:inline">{t('ui.report_an_issue')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div role="dialog" aria-modal="true" aria-label={t('ui.report_an_issue')} className="w-full max-w-[460px] rounded-xl bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-medium text-ink">{t('ui.report_an_issue')}</h2>
            <p className="mt-1 text-sm text-muted-600">{t('ui.tell_us_what_went_wrong_our')}</p>

            <p className="mt-4 text-sm font-medium text-ink">{t('ui.what_is_it_about')}</p>
            <SelectMenu
              className="mt-1"
              value={category}
              onChange={(v) => setCategory(v as IssueCategory)}
              options={ISSUE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />

            <label className="mt-4 block text-sm font-medium text-ink" htmlFor="issue-message">{t('ui.what_happened')}</label>
            <textarea
              id="issue-message"
              ref={textRef}
              value={message}
              maxLength={MAX}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t('ui.describe_the_problem_and_what_you')}
              className="mt-1 w-full resize-none rounded-md border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <p className="mt-1 text-xs text-muted">{t('ui.we_ll_attach_your_account_email')}</p>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink">{t('ui.cancel')}</button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || message.trim().length < 5}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? t('ui.sending') : t('ui.send_report')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
