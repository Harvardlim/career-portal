import { areaFromLine, smoothLine, toPoints } from '../../lib/svg'
import { Card, Delta } from '../ui'
import { IconCalendar, IconChevronDown } from '../Icons'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const revenue = [30, 42, 38, 60, 72, 66, 95, 120, 168, 205, 232, 244]
const expenses = [22, 30, 55, 78, 96, 120, 132, 120, 150, 176, 150, 128]

const PLOT = { x: 56, y: 16, w: 560, h: 300 }
const VB_W = 640
const VB_H = 360
const DOMAIN: [number, number] = [0, 260]

const yTicks = [
  { v: 250, label: '250K' },
  { v: 200, label: '200K' },
  { v: 150, label: '150K' },
  { v: 100, label: '100K' },
  { v: 50, label: '50K' },
  { v: 25, label: '25K' },
  { v: 0, label: '0K' },
]

export const RevenueChart = () => {
  const revPts = toPoints(revenue, PLOT, DOMAIN)
  const expPts = toPoints(expenses, PLOT, DOMAIN)
  const marker = revPts[5] // "June 21, 2023"

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">Total revenue</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[26px] font-semibold text-ink">$240.8K</span>
            <Delta value="24.6%" dir="up" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-[12px] text-ink-200">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-cyan" /> Expenses
            </span>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink-200">
            <IconCalendar width={14} height={14} className="text-muted" />
            Jan 2024 - Dec 2024
            <IconChevronDown width={13} height={13} className="text-muted" />
          </button>
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

        {yTicks.map((t) => {
          const y = PLOT.y + PLOT.h - (t.v / 260) * PLOT.h
          return (
            <g key={t.v}>
              <line x1={PLOT.x} y1={y} x2={PLOT.x + PLOT.w} y2={y} stroke="#1b2b4b" strokeWidth="1" />
              <text x={PLOT.x - 12} y={y + 4} textAnchor="end" fill="#7e89ac" fontSize="11">
                {t.label}
              </text>
            </g>
          )
        })}

        <path d={areaFromLine(expPts, PLOT.y + PLOT.h)} fill="url(#expFill)" />
        <path d={areaFromLine(revPts, PLOT.y + PLOT.h)} fill="url(#revFill)" />
        <path d={smoothLine(expPts)} fill="none" stroke="#00C2FF" strokeWidth="2.5" />
        <path d={smoothLine(revPts)} fill="none" stroke="#CB3CFF" strokeWidth="2.5" />

        <line x1={marker[0]} y1={PLOT.y} x2={marker[0]} y2={PLOT.y + PLOT.h} stroke="#2b3b5b" strokeDasharray="4 4" />
        <circle cx={marker[0]} cy={marker[1]} r="5" fill="#CB3CFF" stroke="#0b1739" strokeWidth="3" />
        <g transform={`translate(${marker[0] - 46}, ${marker[1] - 52})`}>
          <rect width="112" height="40" rx="8" fill="#0a1330" stroke="#343b4f" />
          <text x="12" y="18" fill="#ffffff" fontSize="13" fontWeight="600">$125.2k</text>
          <text x="12" y="32" fill="#7e89ac" fontSize="10">June 21, 2023</text>
        </g>

        {MONTHS.map((m, i) => {
          const x = PLOT.x + (PLOT.w * i) / (MONTHS.length - 1)
          return (
            <text key={m} x={x} y={VB_H - 8} textAnchor="middle" fill="#7e89ac" fontSize="11">
              {m}
            </text>
          )
        })}
      </svg>
    </Card>
  )
}
