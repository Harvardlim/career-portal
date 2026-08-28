import { Card } from '../ui'
import { IconCalendar, IconCheckSquare, IconChevronDown, IconTag } from '../Icons'

type Order = {
  id: string
  date: string
  status: 'Paid' | 'Pending'
  total: string
  checked?: boolean
}

const ORDERS: Order[] = [
  { id: '#1532', date: 'Dec 30, 10:06 AM', status: 'Paid', total: '$ 329.40', checked: true },
  { id: '#1531', date: 'Dec 29, 2:59 AM', status: 'Pending', total: '$ 117.24' },
  { id: '#1530', date: 'Dec 29, 12:54 AM', status: 'Pending', total: '$ 52.16' },
  { id: '#1529', date: 'Dec 28, 2:32 PM', status: 'Paid', total: '$ 350.52', checked: true },
  { id: '#1528', date: 'Dec 27, 2:20 PM', status: 'Pending', total: '$ 246.78' },
  { id: '#1527', date: 'Dec 26, 9:48 AM', status: 'Paid', total: '$ 64.00', checked: true },
]

const Check = ({ on }: { on?: boolean }) => (
  <span
    className={`grid size-4 place-items-center rounded-[5px] border ${
      on ? 'border-brand bg-brand text-white' : 'border-line'
    }`}
  >
    {on ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    ) : null}
  </span>
)

const StatusTag = ({ status }: { status: Order['status'] }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${
      status === 'Paid' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'
    }`}
  >
    <span className={`size-1.5 rounded-full ${status === 'Paid' ? 'bg-success' : 'bg-warning'}`} />
    {status}
  </span>
)

export const RecentOrders = () => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-[17px] font-semibold text-ink">Recent orders</h3>
      <button className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink-200">
        <IconCalendar width={14} height={14} className="text-muted" />
        Jan 2024
        <IconChevronDown width={13} height={13} className="text-muted" />
      </button>
    </div>

    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-[12px] text-muted">
            <th className="py-2 pr-3 font-medium">
              <span className="flex items-center gap-2">
                <Check />
                <IconTag width={13} height={13} /> Order
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
          {ORDERS.map((o) => (
            <tr key={o.id} className="border-b border-line/70 text-[13px] last:border-0">
              <td className="py-3 pr-3">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <Check on={o.checked} />
                  {o.id}
                </span>
              </td>
              <td className="py-3 pr-3 text-muted">{o.date}</td>
              <td className="py-3 pr-3">
                <StatusTag status={o.status} />
              </td>
              <td className="py-3 text-right font-medium text-ink">{o.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
)
