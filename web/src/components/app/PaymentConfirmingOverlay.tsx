/**
 * Shown right after returning from Stripe Checkout while the server-side
 * confirm call is in flight, so the user isn't left looking at stale state
 * wondering whether the payment went through.
 */
export function PaymentConfirmingOverlay({
  message = 'Confirming your payment…',
}: {
  message?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-surface px-8 py-10 text-center shadow-2xl">
        <span className="size-10 animate-spin rounded-full border-4 border-line border-t-brand" />
        <div>
          <p className="text-base font-medium text-ink">{message}</p>
          <p className="mt-1 text-sm text-muted">This only takes a moment — don't close this tab.</p>
        </div>
      </div>
    </div>
  )
}
