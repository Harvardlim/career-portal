import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PostJobPricingPage } from '@/pages/employer/PostJobPricingPage'
import { Dialog } from '@/components/app/Dialog'
import { startCheckout, type CreditPackageKey } from '@/lib/stripe'
import { ArrowRightIcon } from '@/components/icons'
import { useT, tr } from '@/lib/i18n'

const PACKAGES: Record<CreditPackageKey, { label: string; price: string; credits: string }> = {
  standard: { get label() { return tr('co.standard') }, price: '$999.00', get credits() { return tr('co.c3') } },
  referral: { get label() { return tr('co.referral') }, price: '$499.00', get credits() { return tr('co.c3') } },
  repeat_1: { get label() { return tr('co.repeat1') }, price: '$399.00', get credits() { return tr('co.c3') } },
  repeat_2: { get label() { return tr('co.repeat2') }, price: '$199.00', get credits() { return tr('co.c5') } },
}

export function CheckoutPage() {
  const t = useT()
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
      toast.error(err instanceof Error ? err.message : t('ui.could_not_start_checkout'))
      setPending(false)
    }
  }

  return (
    <>
      <PostJobPricingPage />
      <Dialog closeTo="/employer/pricing" width="max-w-[480px]">
        <div className="flex flex-col gap-6 p-8">
          <h2 className="text-xl font-medium text-ink">{t('ui.checkout')}</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex justify-between text-sm text-muted-600">
              <span>{t('ui.package')}{' '}<span className="text-ink">{info.label}</span>
              </span>
              <span>{info.credits}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-sm font-medium text-ink">
              <span>{t('ui.total')}</span>
              <span>{t('ui.usd_3', { price: info.price })}</span>
            </div>
          </div>
          <p className="text-sm text-muted-600">{t('ui.payments_are_processed_securely_by_stripe')}</p>
          <button
            type="button"
            onClick={pay}
            disabled={pending}
            className="flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t('ui.redirecting') : t('ui.pay_with_stripe')}
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </Dialog>
    </>
  )
}
