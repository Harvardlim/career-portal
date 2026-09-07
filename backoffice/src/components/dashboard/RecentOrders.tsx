import { Card } from '../ui'
import { IconCalendar, IconCheckSquare, IconTag } from '../Icons'

export type RecentPurchaseRow = {
  id: string
  company: string
  date: string
  status: string
  total: string
}

const DEFAULT_ROWS: RecentPurchaseRow[] = [
  { id: '#1532', company: 'Acme Inc', date: 'Dec 30, 10:06 AM', status: 'paid', total: '$ 329.40' },
  { id: '#1531', company: 'Globex', date: 'Dec 29, 2:59 AM', status: 'pending', total: '$ 117.24' },
  { id: '#1530', company: 'Initech', date: 'Dec 29, 12:54 AM', status: 'pending', total: '$ 52.16' },
  { id: '#1529', company: 'Umbrella', date: 'Dec 28, 2:32 PM', status: 'paid', total: '$ 350.52' },
  { id: '#1528', company: 'Soylent', date: 'Dec 27, 2:20 PM', status: 'pending', total: '$ 246.78' },
]

const StatusTag = ({ status }: { status: string }) => {
  const paid = status === 'paid'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${
        paid ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'
      }`}
    >
      <span className={`size-1.5 rounded-full ${paid ? 'bg-success' : 'bg-warning'}`} />
      {paid ? 'Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export const RecentOrders = ({ rows = DEFAULT_ROWS }: { rows?: RecentPurchaseRow[] }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-[17px] font-semibold text-ink">Recent purchases</h3>
    </div>

    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-[12px] text-muted">
            <th className="py-2 pr-3 font-medium">
              <span className="flex items-center gap-1.5">
                <IconTag width={13} height={13} /> Company
              </span>
            </th>
            <th className="py-2 pr-3 font-medium">
              <span className="flex items-center gap-1.5">
                <IconCalendar width={13} height={13} /> Date
              </span>
            </th>
            <th className="py-2 pr-3 font-medium">
              <span className="flex items-center gap-1.5">
                <IconCheckSquare width={13} height={13} /> Status
              </span>
            </th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[13px] text-muted">
                No purchases yet.
              </td>
            </tr>
          ) : (
            rows.map((o) => (
              <tr key={o.id} className="border-b border-line/70 text-[13px] last:border-0">
                <td className="py-3 pr-3 font-medium text-ink">{o.company}</td>
                <td className="py-3 pr-3 text-muted">{o.date}</td>
                <td className="py-3 pr-3">
                  <StatusTag status={o.status} />
                </td>
                <td className="py-3 text-right font-medium text-ink">{o.total}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </Card>
)
