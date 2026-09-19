import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDownIcon, CheckIcon, CircleCheckIcon, SearchPlusIcon, UsersIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'
import { COUNTRY_NAMES, formatLocal, formatUsd, type PricingCountry } from '@/lib/partly'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

export function Section({
  children,
  tone = 'plain',
  className = '',
}: {
  children: ReactNode
  tone?: 'plain' | 'alt' | 'navy'
  className?: string
}) {
  const bg = tone === 'alt' ? 'bg-cream' : tone === 'navy' ? 'bg-navy text-white' : 'bg-surface'
  return (
    <section className={`${bg} ${className}`}>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">{children}</div>
    </section>
  )
}

export function GoldCircle({ children, size = 48 }: { children: ReactNode; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-gold text-navy"
    >
      {children}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
      {children}
    </span>
  )
}

export function Headline({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <h1
      className={`font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-[44px] lg:leading-[1.15] ${
        light ? 'text-white' : 'text-navy'
      }`}
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {children}
    </h1>
  )
}

export function Steps({
  steps,
  compact = false,
}: {
  steps: { title: string; body?: string }[]
  compact?: boolean
}) {
  return (
    <ol className={`grid gap-6 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <GoldCircle size={40}>
            <span className="text-sm font-bold">{i + 1}</span>
          </GoldCircle>
          <div>
            <p className="font-semibold text-navy">{s.title}</p>
            {s.body && <p className="mt-1 text-sm text-ink-600">{s.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function TrustStrip() {
  const t = useT()
  const items: { Icon: Icon; label: string }[] = [
    { Icon: CircleCheckIcon, label: t('trust.verified') },
    { Icon: SearchPlusIcon, label: t('trust.matched') },
    { Icon: CheckIcon, label: t('trust.pay') },
  ]
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-3">
      {items.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-3">
          <GoldCircle size={40}>
            <Icon className="size-5" />
          </GoldCircle>
          <span className="text-sm font-medium text-navy">{label}</span>
        </div>
      ))}
    </div>
  )
}

export function AudienceToggle({
  value,
  onChange,
}: {
  value: 'business' | 'expert'
  onChange: (v: 'business' | 'expert') => void
}) {
  const t = useT()
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-1">
      {(['business', 'expert'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            value === v ? 'bg-navy text-white' : 'text-ink-600 hover:text-navy'
          }`}
        >
          {v === 'business' ? t('hero.toggle.business') : t('hero.toggle.expert')}
        </button>
      ))}
    </div>
  )
}

export function CtaButton({
  to,
  children,
  variant = 'gold',
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: 'gold' | 'navy' | 'outline'
  className?: string
}) {
  const cls =
    variant === 'gold'
      ? 'bg-gold text-navy hover:bg-amber-400'
      : variant === 'navy'
        ? 'bg-navy text-white hover:bg-[#25365e]'
        : 'border border-navy/20 text-navy hover:bg-navy/5'
  return (
    <Link
      to={to}
      className={`inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors ${cls} ${className}`}
    >
      {children}
    </Link>
  )
}

export function FeeTable({
  pricing,
  selected,
  onSelect,
  showBadge = true,
}: {
  pricing: PricingCountry[]
  selected?: string
  onSelect?: (code: string) => void
  showBadge?: boolean
}) {
  const t = useT()
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-navy text-left text-white">
          <tr>
            <th className="px-4 py-3 font-medium">{t('pay.table.country')}</th>
            <th className="px-4 py-3 font-medium">{t('pay.table.lead')}</th>
            {showBadge && <th className="px-4 py-3 font-medium">{t('pay.table.badge')}</th>}
          </tr>
        </thead>
        <tbody>
          {pricing.map((p, i) => {
            const active = selected === p.code
            return (
              <tr
                key={p.code}
                onClick={onSelect ? () => onSelect(p.code) : undefined}
                className={`${i % 2 ? 'bg-cream/60' : 'bg-surface'} ${active ? 'ring-2 ring-inset ring-gold' : ''} ${
                  onSelect ? 'cursor-pointer' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-navy">{COUNTRY_NAMES[p.code] ?? p.name}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-ink">{formatLocal(p, p.lead_fee_local)}</span>
                  <span className="ml-2 text-muted">· {formatUsd(p.lead_fee_usd)}</span>
                </td>
                {showBadge && (
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink">{formatLocal(p, p.badge_fee_local)}</span>
                    <span className="ml-2 text-muted">· {formatUsd(p.badge_fee_usd)}</span>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((it, i) => (
        <div key={it.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
          >
            <span className="font-medium text-navy">{it.q}</span>
            <ChevronDownIcon className={`size-5 shrink-0 text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-5 pb-5 text-sm text-ink-600">{it.a}</p>}
        </div>
      ))}
    </div>
  )
}

export function AudienceIcon({ kind }: { kind: 'business' | 'expert' }) {
  return kind === 'business' ? <UsersIcon className="size-5" /> : <CircleCheckIcon className="size-5" />
}
