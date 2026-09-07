import type { ReactNode } from 'react'
import { Card, Delta } from '../ui'
import { IconDots } from '../Icons'

type Props = {
  icon: ReactNode
  label: string
  value: string
  delta?: string
  dir?: 'up' | 'down'
}

export const StatCard = ({ icon, label, value, delta, dir }: Props) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[13px] text-ink-200">
        <span className="text-muted">{icon}</span>
        {label}
      </span>
      <button aria-label="More" className="text-muted hover:text-ink-200">
        <IconDots width={18} height={18} />
      </button>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <span className="text-[24px] font-semibold text-ink">{value}</span>
      {delta && dir ? <Delta value={delta} dir={dir} /> : null}
    </div>
  </Card>
)
