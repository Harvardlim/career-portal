import { smoothLine, toPoints } from '../../lib/svg'
import { Card, Delta } from '../ui'
import { IconTrend } from '../Icons'

const DEFAULT_BARS = [
  34, 40, 30, 52, 44, 60, 48, 66, 72, 58, 80, 64, 90, 76, 96, 84, 70, 88, 60, 74,
  52, 66, 44, 58, 40, 50, 34, 46,
]

const Bars = ({ values }: { values: number[] }) => {
  const w = 360
  const h = 120
  const gap = 5
  const bw = (w - gap * (values.length - 1)) / values.length
  const max = Math.max(1, ...values)
  return (
    <svg viewBox={`0 0 ${w} ${h + 18}`} className="w-full" role="img" aria-label="Monthly totals">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CB3CFF" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * h)
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={bw / 2}
            fill="url(#barGrad)"
          />
        )
      })}
    </svg>
  )
}

type PanelProps = {
  title?: string
  value?: string
  delta?: { value: string; dir: 'up' | 'down' }
  series?: number[]
  footnote?: string
}

export const ProfitChart = ({
  title = 'Total profit',
  value = '$144.6K',
  delta = { value: '28.5%', dir: 'up' },
  series = DEFAULT_BARS,
  footnote = 'Last 12 months',
}: PanelProps) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <IconTrend width={15} height={15} /> {title}
    </div>
    <div className="mt-1 flex items-center gap-2">
      <span className="text-[24px] font-semibold text-ink">{value}</span>
      {delta ? <Delta value={delta.value} dir={delta.dir} /> : null}
    </div>
    <div className="mt-4">
      <Bars values={series} />
    </div>
    <div className="mt-4 border-t border-line pt-3 text-[12px] text-muted">{footnote}</div>
  </Card>
)

const DEFAULT_LINE = [90, 60, 120, 80, 150, 110, 210, 140, 120, 170, 90, 130, 100, 80]
const S_PLOT = { x: 34, y: 8, w: 320, h: 96 }

const Line = ({ values }: { values: number[] }) => {
  const max = Math.max(1, ...values)
  const pts = toPoints(values, S_PLOT, [0, max])
  const ticks = [max, max / 2, 0]
  return (
    <svg viewBox="0 0 360 118" className="w-full" role="img" aria-label="Monthly trend">
      {ticks.map((v, i) => {
        const y = S_PLOT.y + (S_PLOT.h * i) / 2
        return (
          <g key={i}>
            <line x1={S_PLOT.x} y1={y} x2={S_PLOT.x + S_PLOT.w} y2={y} stroke="#1b2b4b" />
            <text x={S_PLOT.x - 8} y={y + 3} textAnchor="end" fill="#7e89ac" fontSize="9">
              {Math.round(v)}
            </text>
          </g>
        )
      })}
      <path d={smoothLine(pts)} fill="none" stroke="#CB3CFF" strokeWidth="2.5" />
    </svg>
  )
}

export const SessionsChart = ({
  title = 'Total sessions',
  value = '400',
  delta = { value: '16.8%', dir: 'up' },
  series = DEFAULT_LINE,
  footnote = 'Last 12 months',
}: PanelProps) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <span className="size-2 rounded-full bg-brand" /> {title}
    </div>
    <div className="mt-1 flex items-center gap-2">
      <span className="text-[24px] font-semibold text-ink">{value}</span>
      {delta ? <Delta value={delta.value} dir={delta.dir} /> : null}
    </div>
    <div className="mt-3">
      <Line values={series} />
    </div>
    <div className="mt-3 border-t border-line pt-3 text-[12px] text-muted">{footnote}</div>
  </Card>
)
