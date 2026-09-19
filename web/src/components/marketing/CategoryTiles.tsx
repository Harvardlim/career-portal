import { useState, type ComponentType, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import {
  BriefcaseIcon,
  ChartBarIcon,
  ChevronDownIcon,
  CodeIcon,
  DollarIcon,
  FileIcon,
  GearIcon,
  MegaphoneIcon,
  PenNibIcon,
  SearchPlusIcon,
  UsersIcon,
} from '@/components/icons'
import { GoldCircle } from '@/components/marketing/blocks'
import { useCategories, type Category } from '@/lib/categories'
import { useT } from '@/lib/i18n'

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  users: UsersIcon,
  monitor: CodeIcon,
  coins: DollarIcon,
  megaphone: MegaphoneIcon,
  scale: FileIcon,
  'trending-up': ChartBarIcon,
  compass: SearchPlusIcon,
  settings: GearIcon,
  'graduation-cap': BriefcaseIcon,
  palette: PenNibIcon,
}

/**
 * The 10-tile grid (2 x 5). Each tile expands inline to its sub-category tags
 * rather than navigating away, with a dual CTA for either audience.
 */
export function CategoryTiles({ audience }: { audience: 'business' | 'expert' | 'both' }) {
  const { categories, loading } = useCategories()
  const [open, setOpen] = useState<string | null>(null)
  const t = useT()

  if (loading) return <p className="text-center text-sm text-muted">Loading…</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {categories.map((c) => (
        <Tile
          key={c.id}
          category={c}
          open={open === c.id}
          onToggle={() => setOpen(open === c.id ? null : c.id)}
          audience={audience}
          t={t}
        />
      ))}
    </div>
  )
}

function Tile({
  category,
  open,
  onToggle,
  audience,
  t,
}: {
  category: Category
  open: boolean
  onToggle: () => void
  audience: 'business' | 'expert' | 'both'
  t: ReturnType<typeof useT>
}) {
  const Icon = ICONS[category.icon ?? ''] ?? BriefcaseIcon
  return (
    <div
      className={`flex flex-col rounded-xl border bg-surface p-5 transition-shadow ${
        open ? 'border-gold shadow-card sm:col-span-2 lg:col-span-5' : 'border-line hover:shadow-card'
      }`}
    >
      <button type="button" onClick={onToggle} className="flex items-center gap-3 text-left" aria-expanded={open}>
        <GoldCircle size={44}>
          <Icon className="size-5" />
        </GoldCircle>
        <span className="flex-1">
          <span className="block font-semibold text-navy">{category.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            {open ? t('cat.collapse') : t('cat.expand')}
            <ChevronDownIcon className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {category.subcategories.map((s) => (
              <span
                key={s.id}
                title={s.notes ?? undefined}
                className="rounded-full bg-cream px-3 py-1 text-xs text-navy"
              >
                {s.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {(audience === 'business' || audience === 'both') && (
              <Link to="/employer/post-need" className="text-sm font-medium text-brand hover:underline">
                {t('cat.tile.business', { category: category.name })}
              </Link>
            )}
            {(audience === 'expert' || audience === 'both') && (
              <Link to={`/needs?category=${category.id}`} className="text-sm font-medium text-brand hover:underline">
                {t('cat.tile.expert', { category: category.name })}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
