import { PostJobPricingPage } from '@/pages/employer/PostJobPricingPage'
import { Dialog } from '@/components/app/Dialog'
import { ArrowRightIcon } from '@/components/icons'

export function CheckoutPage() {
  return (
    <>
      <PostJobPricingPage />
      <Dialog closeTo="/employer/pricing" width="max-w-[720px]">
        <div className="flex flex-col gap-6 p-8">
          <h2 className="text-xl font-medium text-ink">Checkout</h2>
          <div className="grid gap-8 border-t border-line pt-6 sm:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-ink">Payment System</p>
              <div className="flex gap-6 border-b border-line text-sm">
                <span className="-mb-px border-b-2 border-brand pb-2 font-medium text-brand">
                  Debit/Credit Card
                </span>
                <span className="pb-2 text-muted-600">Paypal</span>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-line p-3 text-sm">
                <input type="radio" name="card" className="size-4 accent-brand" />
                <span className="flex flex-1 items-center justify-between">
                  <span className="flex flex-col">
                    <span className="text-xs text-muted">Card Number</span>
                    <span className="font-medium text-ink">5847 **** **** ****</span>
                  </span>
                  <span className="flex flex-col text-right">
                    <span className="text-xs text-muted">Name on Card</span>
                    <span className="font-medium text-ink">Esther Howard</span>
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-brand p-3 text-sm">
                <input type="radio" name="card" defaultChecked className="size-4 accent-brand" />
                New payment card
              </label>

              <label className="flex flex-col gap-2 text-sm text-ink">
                Name on Card
                <input
                  placeholder="Name"
                  className="h-12 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-ink">
                Credit Card
                <div className="flex h-12 items-center gap-3 rounded-md border border-line px-4 text-base text-muted-400">
                  <input
                    placeholder="Card number"
                    className="flex-1 bg-transparent text-ink outline-none placeholder:text-muted-400"
                  />
                  <span>MM/YY</span>
                  <span>CVC</span>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <p className="text-sm font-medium text-ink">Summery</p>
              <div className="flex justify-between text-sm text-muted-600">
                <span>
                  Pricing Plans: <span className="text-ink">Premium</span>
                </span>
                <span>$59.00</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-sm font-medium text-ink">
                <span>Total:</span>
                <span>$59 USD</span>
              </div>
              <button
                type="button"
                className="mt-2 flex items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
              >
                Choose Plan
                <ArrowRightIcon className="size-4" />
              </button>
              <p className="text-center text-xs text-muted">
                This package will expire after one month.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
