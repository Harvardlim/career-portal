import { smoothLine, toPoints } from '../../lib/svg'
import { Card, Delta } from '../ui'
import { IconTrend } from '../Icons'

const bars = [
  34, 40, 30, 52, 44, 60, 48, 66, 72, 58, 80, 64, 90, 76, 96, 84, 70, 88, 60, 74,
  52, 66, 44, 58, 40, 50, 34, 46,
]

const ProfitBars = () => {
  const w = 360
  const h = 120
  const gap = 5
  const bw = (w - gap * (bars.length - 1)) / bars.length
  const max = Math.max(...bars)
  return (
    <svg viewBox={`0 0 ${w} ${h + 18}`} className="w-full" role="img" aria-label="Total profit">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CB3CFF" />
          <stop offset="100%" stopColor="#00C2FF" />
        </linearGradient>
      </defs>
      {bars.map((v, i) => {
        const bh = (v / max) * h
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
      {['12 AM', '8 AM', '4 PM', '11 PM'].map((t, i) => (
        <text
          key={t}
          x={(w * i) / 3}
          y={h + 14}
          textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}
          fill="#7e89ac"
          fontSize="10"
        >
          {t}
        </text>
      ))}
    </svg>
  )
}

export const ProfitChart = () => (
  <Card className="p-5">
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <IconTrend width={15} height={15} /> Total profit
    </div>
    <div className="mt-1 flex items-center gap-2">
      <span className="text-[24px] font-semibold text-ink">$144.6K</span>
      <Delta value="28.5%" dir="up" />
    </div>
    <div className="mt-4">
      <ProfitBars />
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12px]">
      <span className="text-muted">Last 12 months</span>
      <button className="font-semibold text-brand-2">View report</button>
    </div>
  </Card>
)

const sessions = [90, 60, 120, 80, 150, 110, 210, 140, 120, 170, 90, 130, 100, 80]
const S_PLOT = { x: 34, y: 8, w: 320, h: 96 }

const SessionLine = () => {
  const pts = toPoints(sessions, S_PLOT, [0, 240])
  return (
    <svg viewBox="0 0 360 128" className="w-full" role="img" aria-label="Total sessions">
      {[
        { v: 500, y: S_PLOT.y },
        { v: 250, y: S_PLOT.y + S_PLOT.h / 2 },
        { v: 100, y: S_PLOT.y + S_PLOT.h },
      ].map((t) => (
        <g key={t.v}>
          <line x1={S_PLOT.x} y1={t.y} x2={S_PLOT.x + S_PLOT.w} y2={t.y} stroke="#1b2b4b" />
          <text x={S_PLOT.x - 8} y={t.y + 3} textAnchor="end" fill="#7e89ac" fontSize="9">
            {t.v}
          </text>
        </g>
      ))}
      <path d={smoothLine(pts)} fill="none" stroke="#CB3CFF" strokeWidth="2.5" />
      {['12 AM', '8 AM', '4 PM', '11 PM'].map((t, i) => (
        <text
          key={t}
          x={S_PLOT.x + (S_PLOT.w * i) / 3}
          y={126}
          textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}
          fill="#7e89ac"
          fontSize="9"
        >
          {t}
        </text>
      ))}
    </svg>
  )
}

export const SessionsChart = () => (
  <Card className="p-5">
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <span className="size-2 rounded-full bg-brand" /> Total sessions
    </div>
    <div className="mt-1 flex items-center gap-2">
      <span className="text-[24px] font-semibold text-ink">400</span>
      <Delta value="16.8%" dir="up" />
    </div>
    <div className="mt-3">
      <SessionLine />
    </div>
    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12px]">
      <span className="flex items-center gap-1.5 text-muted">
        <span className="size-1.5 rounded-full bg-success" /> Live
        <span className="text-ink-200">10k visitors</span>
      </span>
      <button className="font-semibold text-brand-2">View report</button>
    </div>
  </Card>
)
