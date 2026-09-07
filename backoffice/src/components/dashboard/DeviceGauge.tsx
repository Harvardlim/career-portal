import { Card } from '../ui'

export type GaugeSegment = { label: string; value: number; color: string }

const DEFAULT_SEGMENTS: GaugeSegment[] = [
  { label: 'Desktop users', value: 15624, color: '#CB3CFF' },
  { label: 'Phone app users', value: 5546, color: '#9A91FB' },
  { label: 'Laptop users', value: 2478, color: '#00C2FF' },
]

const ARC_LEN = 396 // ~ π * 126, the semicircle path length

type Props = {
  title?: string
  total?: number
  segments?: GaugeSegment[]
}

export const DeviceGauge = ({
  title = 'Users by device',
  total,
  segments = DEFAULT_SEGMENTS,
}: Props) => {
  const sum = segments.reduce((s, x) => s + x.value, 0)
  const shownTotal = total ?? sum

  // Precompute each segment's dash length and start offset along the arc.
  const arcs = segments.reduce<{ seg: GaugeSegment; dash: number; offset: number }[]>(
    (acc, seg) => {
      const dash = (sum > 0 ? seg.value / sum : 0) * ARC_LEN
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
      acc.push({ seg, dash, offset })
      return acc
    },
    [],
  )

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 300 170" className="w-[280px]" role="img" aria-label={title}>
          <path
            d="M 24 150 A 126 126 0 0 1 276 150"
            fill="none"
            stroke="#12203f"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {arcs.map(({ seg, dash, offset }) => (
            <path
              key={seg.label}
              d="M 24 150 A 126 126 0 0 1 276 150"
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${ARC_LEN}`}
              strokeDashoffset={-offset}
            />
          ))}
          <text x="150" y="132" textAnchor="middle" fill="#ffffff" fontSize="34" fontWeight="600">
            {shownTotal.toLocaleString()}
          </text>
          <text x="150" y="158" textAnchor="middle" fill="#7e89ac" fontSize="13">
            {title}
          </text>
        </svg>
      </div>

      <ul className="mt-4 space-y-3.5">
        {segments.map((l) => (
          <li
            key={l.label}
            className="flex items-center justify-between border-t border-line pt-3.5 text-[13px] first:border-t-0"
          >
            <span className="flex items-center gap-2 text-ink-200">
              <span className="size-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
            <span className="font-semibold text-ink">{l.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
