import { useEffect, type ReactNode } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/partly/ui'

/**
 * The one confirm modal for the app — replaces browser `confirm()` popups,
 * which look inconsistent across browsers and block on the main thread.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => !busy && onCancel()}
        className="fixed inset-0 cursor-default bg-ink/40"
      />
      <div className="relative w-full max-w-[420px] rounded-xl border border-line bg-surface p-6 shadow-2xl">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-muted">{message}</div>

        {error ? <p className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2.5">
          <SecondaryButton className="h-10 px-4" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            className={`h-10 px-4 ${tone === 'danger' ? 'bg-danger hover:bg-danger/90' : ''}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
