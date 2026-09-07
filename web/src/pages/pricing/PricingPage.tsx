import { Link, NavLink } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'

type Audience = 'candidate' | 'employer'

type Plan = {
  name: string
  price: string
  period?: string
  blurb: string
  features: string[]
  cta: { label: string; to: string }
  popular?: boolean
}

// Kept in sync with the real checkout flows:
//   candidate → MembershipPage (/dashboard/membership) + lib/stripe.ts
//   employer  → PostJobPricingPage (/employer/pricing)
const plansByAudience: Record<Audience, Plan[]> = {
  candidate: [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      blurb: 'Everything you need to start applying.',
      features: [
        'Create your profile & apply to jobs',
        'Standard match visibility',
        'Save favourite jobs',
      ],
      cta: { label: 'Create account', to: '/create-account' },
    },
    {
      name: 'Member — Monthly',
      price: '$99',
      period: 'per month',
      blurb: 'Get seen first by employers.',
      features: [
        'Verified badge on your profile',
        'Priority Match — shown to employers first',
        'Everything in Free',
      ],
      cta: { label: 'Choose Monthly', to: '/dashboard/membership' },
    },
    {
      name: 'Member — Yearly',
      price: '$199',
      period: 'per year',
      blurb: 'Best value — pay once for the year.',
      popular: true,
      features: [
        'Verified badge on your profile',
        'Priority Match — shown to employers first',
        'Everything in Free',
        'Save vs. paying monthly',
      ],
      cta: { label: 'Choose Yearly', to: '/dashboard/membership' },
    },
  ],
  employer: [
    {
      name: 'Standard',
      price: '$999',
      period: 'for 3 credits',
      blurb: 'Buy credits outright, no strings attached.',
      features: [
        '1 job post = 1 credit',
        'Credits valid for 60 days',
        'Use credits to extend or repost',
      ],
      cta: { label: 'Buy credits', to: '/employer/pricing' },
    },
    {
      name: 'Referral',
      price: '$499',
      period: 'for 3 credits',
      blurb: 'Invite 3 HR emails to unlock this price.',
      popular: true,
      features: [
        'Same 3 credits as Standard',
        'Half price when 3 HR colleagues join',
        'Per-email consent required',
      ],
      cta: { label: 'Invite & save', to: '/employer/pricing' },
    },
    {
      name: 'Top Up',
      price: '$199',
      period: 'for 5 credits',
      blurb: 'Member rate for topping up.',
      features: [
        '5 credits at the discounted rate',
        'Unlocked after your first purchase',
        'Credits valid for 60 days',
      ],
      cta: { label: 'View top-up', to: '/employer/pricing' },
    },
  ],
}

export function PricingPage({ audience }: { audience: Audience }) {
  const plans = plansByAudience[audience]

  const tab = (to: string, label: string, active: boolean) => (
    <NavLink
      to={to}
      className={`rounded-[6px] px-5 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'text-ink-600 hover:text-ink'
      }`}
    >
      {label}
    </NavLink>
  )

  return (
    <AppShell>
      <Breadcrumb
        title="Pricing Plans"
        trail={[
          { label: 'Home', to: '/' },
          { label: 'Pricing Plans' },
        ]}
      />

      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-8 px-6 py-14 lg:px-10">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-medium text-ink lg:text-[40px]">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-600">
            {audience === 'candidate'
              ? 'Applying to jobs is always free. Upgrade any time for Priority Match.'
              : 'One job post uses one credit. Buy a package now, top up later.'}
          </p>
        </div>

        <div className="flex gap-1 rounded-[8px] border border-line bg-surface p-1">
          {tab('/pricing/candidate', 'For Candidates', audience === 'candidate')}
          {tab('/pricing/employer', 'For Employers', audience === 'employer')}
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-8 ${
                plan.popular ? 'border-brand shadow-feature' : 'border-line'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-8 rounded bg-brand px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <p className="text-lg font-medium text-ink">{plan.name}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-medium text-ink">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted">{plan.period}</span>
                )}
              </p>
              <p className="mt-3 text-sm text-muted-600">{plan.blurb}</p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-ink-600"
                  >
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={plan.cta.to}
                className={`mt-8 flex items-center justify-center gap-2 rounded-[4px] py-3 text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-brand text-white hover:bg-brand-600'
                    : 'bg-brand-50 text-brand hover:bg-brand-100'
                }`}
              >
                {plan.cta.label}
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted">
          Prices in USD. Taxes may apply. Need something else?{' '}
          <Link to="/contact" className="font-medium text-brand">
            Talk to us
          </Link>
          .
        </p>
      </div>
    </AppShell>
  )
}
