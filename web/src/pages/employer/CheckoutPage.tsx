import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PostJobPricingPage } from '@/pages/employer/PostJobPricingPage'
import { Dialog } from '@/components/app/Dialog'
import { startCheckout, type CreditPackageKey } from '@/lib/stripe'
import { ArrowRightIcon } from '@/components/icons'

const PACKAGES: Record<CreditPackageKey, { label: string; price: string; credits: string }> = {
  standard: { label: 'Standard', price: '$999.00', credits: '3 credits' },
  referral: { label: 'Referral', price: '$499.00', credits: '3 credits' },
  repeat_1: { label: '1st repeat purchase', price: '$399.00', credits: '3 credits' },
  repeat_2: { label: '2nd repeat purchase', price: '$199.00', credits: '5 credits' },
}

export function CheckoutPage() {
  const [params] = useSearchParams()
  const raw = params.get('pkg') as CreditPackageKey | null
  const pkg: CreditPackageKey = raw && raw in PACKAGES ? raw : 'standard'
  const info = PACKAGES[pkg]
  const [pending, setPending] = useState(false)

  async function pay() {
    setPending(true)
    try {
      await startCheckout({ kind: 'credits', pkg })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setPending(false)
    }
  }

  return (
    <>
      <PostJobPricingPage />
      <Dialog closeTo="/employer/pricing" width="max-w-[480px]">
        <div className="flex flex-col gap-6 p-8">
          <h2 className="text-xl font-medium text-ink">Checkout</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex justify-between text-sm text-muted-600">
              <span>
                Package: <span className="text-ink">{info.label}</span>
              </span>
              <span>{info.credits}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-sm font-medium text-ink">
              <span>Total</span>
              <span>{info.price} USD</span>
            </div>
          </div>
          <p className="text-sm text-muted-600">
            Payments are processed securely by Stripe. You&apos;ll be redirected to
            Stripe to enter your card details, then brought back here.
          </p>
          <button
            type="button"
            onClick={pay}
            disabled={pending}
            className="flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Redirecting…' : 'Pay with Stripe'}
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </Dialog>
    </>
  )
}
