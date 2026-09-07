import { areaFromLine, smoothLine, toPoints } from '../../lib/svg'
import { Card, Delta } from '../ui'

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const PLOT = { x: 56, y: 16, w: 560, h: 300 }
const VB_W = 640
const VB_H = 360

type Props = {
  months?: string[]
  seriesA?: number[]
  seriesB?: number[]
  labelA?: string
  labelB?: string
  total?: string
  delta?: { value: string; dir: 'up' | 'down' } | null
}

const money = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return `$${Math.round(n)}`
}

function niceMax(v: number) {
  if (v <= 0) return 100
  const mag = 10 ** Math.floor(Math.log10(v))
  const step = v / mag
  const nice = step <= 1 ? 1 : step <= 2 ? 2 : step <= 5 ? 5 : 10
  return nice * mag
}

export const RevenueChart = ({
  months = DEFAULT_MONTHS,
  seriesA = [30, 42, 38, 60, 72, 66, 95, 120, 168, 205, 232, 244],
  seriesB = [22, 30, 55, 78, 96, 120, 132, 120, 150, 176, 150, 128],
  labelA = 'Revenue',
  labelB = 'Expenses',
  total = '$240.8K',
  delta = { value: '24.6%', dir: 'up' },
}: Props) => {
  const showDelta = delta && delta.value !== ''
  const max = niceMax(Math.max(1, ...seriesA, ...seriesB))
  const domain: [number, number] = [0, max]
  const aPts = toPoints(seriesA, PLOT, domain)
  const bPts = toPoints(seriesB, PLOT, domain)
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => ({ v: max * f, label: money(max * f) }))

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">Total revenue</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[26px] font-semibold text-ink">{total}</span>
            {showDelta ? <Delta value={delta!.value} dir={delta!.dir} /> : null}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-ink-200">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" /> {labelA}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan" /> {labelB}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="mt-4 w-full" role="img" aria-label="Total revenue over time">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CB3CFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#CB3CFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = PLOT.y + PLOT.h - (t.v / max) * PLOT.h
          return (
            <g key={t.v}>
              <line x1={PLOT.x} y1={y} x2={PLOT.x + PLOT.w} y2={y} stroke="#1b2b4b" strokeWidth="1" />
              <text x={PLOT.x - 12} y={y + 4} textAnchor="end" fill="#7e89ac" fontSize="11">
                {t.label}
              </text>
            </g>
          )
        })}

        <path d={areaFromLine(bPts, PLOT.y + PLOT.h)} fill="url(#expFill)" />
        <path d={areaFromLine(aPts, PLOT.y + PLOT.h)} fill="url(#revFill)" />
        <path d={smoothLine(bPts)} fill="none" stroke="#00C2FF" strokeWidth="2.5" />
        <path d={smoothLine(aPts)} fill="none" stroke="#CB3CFF" strokeWidth="2.5" />

        {months.map((m, i) => {
          const x = PLOT.x + (PLOT.w * i) / (months.length - 1)
          return (
            <text key={`${m}-${i}`} x={x} y={VB_H - 8} textAnchor="middle" fill="#7e89ac" fontSize="11">
              {m}
            </text>
          )
        })}
      </svg>
    </Card>
  )
}
