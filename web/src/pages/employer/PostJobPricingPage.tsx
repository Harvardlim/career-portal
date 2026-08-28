import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'

const pricingPlans = [
  {
    name: 'BASIC',
    price: 19,
    features: [
      'Post 1 Job',
      'Urgents & Featured Jobs',
      'Highlights Job with Colors',
      'Access & Saved 5 Candidates',
      '10 Days Resume Visibility',
      '24/7 Critical Support',
    ],
  },
  {
    name: 'STANDARD',
    price: 39,
    recommended: true,
    features: [
      '3 Active Jobs',
      'Urgents & Featured Jobs',
      'Highlights Job with Colors',
      'Access & Saved 10 Candidates',
      '20 Days Resume Visibility',
      '24/7 Critical Support',
    ],
  },
  {
    name: 'PREMIUM',
    price: 59,
    features: [
      '6 Active Jobs',
      'Urgents & Featured Jobs',
      'Highlights Job with Colors',
      'Access & Saved 20 Candidates',
      '30 Days Resume Visibility',
      '24/7 Critical Support',
    ],
  },
]

export function PostJobPricingPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h1 className="text-2xl font-medium text-ink">
              Buy Premium Subscription to Post a Job
            </h1>
            <p className="mt-3 text-muted-600">
              Donec eu dui ut dolor commodo ornare. Sed arcu libero, malesuada
              quis justo sit amet, varius tempus neque. Quisque ultrices mi sed
              lorem condimentum, vel tempus lectus ultricies.
            </p>
          </div>
          <div className="h-40 w-64 shrink-0 rounded-2xl bg-brand-50" aria-hidden />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border ${
                plan.recommended ? 'border-brand' : 'border-line'
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-brand px-3 py-1 text-xs font-medium text-white">
                  Recommendation
                </span>
              )}
              <div className="flex flex-col gap-3 border-b border-line p-6">
                <p className="text-base font-medium text-ink">{plan.name}</p>
                <p className="text-sm text-muted-600">
                  Praesent eget pulvinar orci. Duis ut pellentesque ligula
                  convalis.
                </p>
                <p className="text-3xl font-medium text-brand">
                  ${plan.price}
                  <span className="text-sm text-muted">/Monthly</span>
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-3 p-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                    <CheckIcon className="size-4 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="p-6 pt-0">
                <Link
                  to="/employer/checkout"
                  className={`flex items-center justify-center gap-2 rounded-[4px] py-3 text-sm font-semibold ${
                    plan.recommended
                      ? 'bg-brand text-white'
                      : 'bg-brand-50 text-brand hover:bg-brand-100'
                  }`}
                >
                  Choose Plan
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
