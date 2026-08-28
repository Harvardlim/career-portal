import { Card } from '../ui'

const legend = [
  { label: 'Desktop users', value: '15,624', color: '#CB3CFF' },
  { label: 'Phone app users', value: '5,546', color: '#9A91FB' },
  { label: 'Laptop users', value: '2,478', color: '#00C2FF' },
]

export const DeviceGauge = () => (
  <Card className="p-6">
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 170" className="w-[280px]" role="img" aria-label="Users by device">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00C2FF" />
            <stop offset="55%" stopColor="#7F45FF" />
            <stop offset="100%" stopColor="#CB3CFF" />
          </linearGradient>
        </defs>
        <path
          d="M 24 150 A 126 126 0 0 1 276 150"
          fill="none"
          stroke="#12203f"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M 24 150 A 126 126 0 0 1 276 150"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray="360 400"
        />
        <text x="150" y="132" textAnchor="middle" fill="#ffffff" fontSize="34" fontWeight="600">
          23,648
        </text>
        <text x="150" y="158" textAnchor="middle" fill="#7e89ac" fontSize="13">
          Users by device
        </text>
      </svg>
    </div>

    <ul className="mt-4 space-y-3.5">
      {legend.map((l) => (
        <li key={l.label} className="flex items-center justify-between border-t border-line pt-3.5 text-[13px] first:border-t-0">
          <span className="flex items-center gap-2 text-ink-200">
            <span className="size-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
          <span className="font-semibold text-ink">{l.value}</span>
        </li>
      ))}
    </ul>
  </Card>
)
