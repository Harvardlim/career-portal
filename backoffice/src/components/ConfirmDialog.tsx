import { useEffect, type ReactNode } from 'react'

type Props = {
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
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: Props) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-danger text-white hover:brightness-110'
      : 'gradient-brand text-white hover:brightness-110'

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
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h2 id="confirm-dialog-title" className="text-[18px] font-semibold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-[13px] leading-relaxed text-muted">{message}</div>

        {error ? (
          <p className="mt-3 rounded-lg bg-danger/12 px-3 py-2 text-[13px] text-danger">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-[13px] font-semibold text-ink-200 transition hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
