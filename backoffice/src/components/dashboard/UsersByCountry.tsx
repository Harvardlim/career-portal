import { Card, Delta } from '../ui'
import { IconDownload } from '../Icons'

const rows = [
  { country: 'United States', pct: 30, color: '#CB3CFF' },
  { country: 'United Kingdom', pct: 20, color: '#9A91FB' },
  { country: 'Canada', pct: 20, color: '#7F45FF' },
  { country: 'Australia', pct: 15, color: '#00C2FF' },
  { country: 'Spain', pct: 15, color: '#00C2FF' },
]

/** Rough land boxes in normalised map space (x,y in 0..1, y down). */
const LAND: [number, number, number, number][] = [
  [0.04, 0.08, 0.24, 0.32], // North America
  [0.12, 0.34, 0.1, 0.16], // Central America
  [0.22, 0.58, 0.12, 0.36], // South America
  [0.28, 0.02, 0.08, 0.1], // Greenland
  [0.43, 0.12, 0.12, 0.22], // Europe
  [0.46, 0.34, 0.16, 0.44], // Africa
  [0.52, 0.08, 0.32, 0.34], // Asia
  [0.63, 0.4, 0.09, 0.14], // India
  [0.74, 0.46, 0.12, 0.16], // SE Asia
  [0.8, 0.62, 0.14, 0.16], // Australia
]

const inLand = (x: number, y: number) =>
  LAND.some(([lx, ly, lw, lh]) => x >= lx && x <= lx + lw && y >= ly && y <= ly + lh)

const MAP_W = 620
const MAP_H = 360
const STEP = 11

const dots: { x: number; y: number }[] = []
for (let gx = 0; gx * STEP < MAP_W; gx++) {
  for (let gy = 0; gy * STEP < MAP_H; gy++) {
    const nx = (gx * STEP) / MAP_W
    const ny = (gy * STEP) / MAP_H
    if (inLand(nx, ny)) {
      dots.push({ x: gx * STEP + 6, y: gy * STEP + 6 })
    }
  }
}

const markers = [
  { x: 0.16, y: 0.3, color: '#CB3CFF' },
  { x: 0.5, y: 0.22, color: '#CB3CFF' },
  { x: 0.8, y: 0.2, color: '#CB3CFF' },
  { x: 0.86, y: 0.68, color: '#00C2FF', label: true },
]

const WorldMap = () => (
  <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" role="img" aria-label="Users by country map">
    <defs>
      {markers.map((m, i) => (
        <radialGradient key={i} id={`glow${i}`}>
          <stop offset="0%" stopColor={m.color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={m.color} stopOpacity="0" />
        </radialGradient>
      ))}
    </defs>
    {dots.map((d, i) => (
      <circle key={i} cx={d.x} cy={d.y} r="1.6" fill="#33406b" />
    ))}
    {markers.map((m, i) => {
      const cx = m.x * MAP_W
      const cy = m.y * MAP_H
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r="34" fill={`url(#glow${i})`} />
          <circle cx={cx} cy={cy} r="4.5" fill={m.color} stroke="#081028" strokeWidth="2" />
          {m.label ? (
            <g transform={`translate(${cx + 10}, ${cy - 34})`}>
              <text x="0" y="0" fill="#ffffff" fontSize="15" fontWeight="600">
                1.86 K
              </text>
              <text x="0" y="15" fill="#7e89ac" fontSize="11">
                Australia
              </text>
            </g>
          ) : null}
        </g>
      )
    })}
  </svg>
)

export const UsersByCountry = () => (
  <Card className="p-6">
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div>
        <p className="text-[15px] font-semibold text-ink">Users by country</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[22px] font-semibold text-ink">12.4 K</span>
          <Delta value="28.5%" dir="up" />
        </div>
        <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink-200">
          Export <IconDownload width={13} height={13} className="text-muted" />
        </button>

        <ul className="mt-5 space-y-4">
          {rows.map((r) => (
            <li key={r.country}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-200">{r.country}</span>
                <span className="text-muted">{r.pct}%</span>
              </div>
              <div className="mt-2 h-[3px] w-full rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.pct * 2.6}%`,
                    background: `linear-gradient(90deg, ${r.color}, #00C2FF)`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0">
        <WorldMap />
      </div>
    </div>
  </Card>
)
