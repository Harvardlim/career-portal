import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { InfoCard } from '@/components/app/InfoCard'
import { Pagination } from '@/components/app/Pagination'
import { ArrowRightIcon, CheckIcon, DownloadIcon, PencilIcon, XCircleIcon } from '@/components/icons'

const benefits = [
  '6 Active Jobs',
  'Urgents & Featured Jobs',
  'Highlights Job with Colors',
  'Access & Saved 20 Candidates',
  '60 Days Resume Visibility',
  '24/7 Critical Support',
]

const remaining = ['9 Resume Access', '21 Days resume visibility', '4 Active Jobs']

const invoices = [
  { id: '#487441', plan: 'Premium' },
  { id: '#653518', plan: 'Standard' },
  { id: '#267400', plan: 'Premium' },
  { id: '#651535', plan: 'Premium' },
  { id: '#449003', plan: 'Premium' },
  { id: '#558612', plan: 'Premium' },
]

export function PlansBillingPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <InfoCard>
              <p className="text-sm font-medium text-ink">Current Plan</p>
              <p className="mt-2 text-3xl font-medium text-ink">Premium</p>
              <p className="mt-2 text-sm text-muted-600">
                Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
                posuere.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  className="rounded-[4px] bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand"
                >
                  Change Plans
                </button>
                <button type="button" className="text-sm text-muted-600">
                  Cancel Plan
                </button>
              </div>
            </InfoCard>

            <InfoCard>
              <p className="text-sm font-medium text-ink">Next Invoices</p>
              <p className="mt-3 text-2xl font-medium text-brand">$59.00 USD</p>
              <p className="mt-1 text-sm text-ink">Nov 28, 2021</p>
              <p className="mt-2 text-xs text-muted">
                Package started: Jan 28, 2021
              </p>
              <p className="mt-1 text-xs text-muted">
                You have to pay this amount of money every month.
              </p>
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
              >
                Pay Now
                <ArrowRightIcon className="size-4" />
              </button>
            </InfoCard>
          </div>

          <div className="flex flex-col gap-6">
            <InfoCard title="Plan Benefits">
              <p className="-mt-4 mb-4 text-sm text-muted-600">
                Proin porta enim sit amet placerat finibus. Sed eget laoreet
                lorem.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <span key={b} className="flex items-center gap-2 text-sm text-ink-600">
                    <CheckIcon className="size-4 text-brand" />
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-xs uppercase tracking-wide text-muted-400">
                Remaining
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {remaining.map((r) => (
                  <span key={r} className="flex items-center gap-2 text-sm text-ink-600">
                    <XCircleIcon className="size-4 text-danger" />
                    {r}
                  </span>
                ))}
              </div>
            </InfoCard>

            <InfoCard>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Payment Card</p>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm text-muted-600"
                >
                  <PencilIcon className="size-4" />
                  Edit Card
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-b border-line pb-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-7 w-11 place-items-center rounded bg-surface-alt text-[10px] font-bold text-ink">
                    MC
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-muted">Name on card</span>
                    <span className="font-medium text-ink">Esther Howard</span>
                  </span>
                </span>
                <span className="flex flex-col text-right">
                  <span className="text-xs text-muted">Expire date</span>
                  <span className="font-medium text-ink">12/29</span>
                </span>
              </div>
              <p className="mt-4 text-lg tracking-widest text-ink">
                6714 **** **** ****
              </p>
            </InfoCard>
          </div>
        </div>

        <InfoCard title="Latest Invoices">
          <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 rounded bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600">
            <span>#ID</span>
            <span>Date</span>
            <span>Plan</span>
            <span>Amount</span>
            <span />
          </div>
          <div className="flex flex-col divide-y divide-line">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] items-center gap-4 px-4 py-4 text-sm text-ink-600"
              >
                <span>{inv.id}</span>
                <span>Dec 7, 2019 23:26</span>
                <span>{inv.plan}</span>
                <span>$999 USD</span>
                <button type="button" aria-label="Download invoice" className="text-muted">
                  <DownloadIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-6">
            <Pagination current={1} />
          </div>
        </InfoCard>
      </div>
    </EmployerDashboardLayout>
  )
}
