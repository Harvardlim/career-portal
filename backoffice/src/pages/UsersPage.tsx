import { CompanyBadge } from '../components/CompanyBadge'
import {
  Checkbox,
  ListCard,
  ListFooter,
  ListTopBar,
  RowActions,
  SortHead,
} from '../components/ListShell'
import { Card, StatusPill } from '../components/ui'
import {
  IconBriefcase,
  IconCheckSquare,
  IconDotsV,
  IconHeart,
  IconPhone,
  IconPin,
  IconUsers,
} from '../components/Icons'

const summary = [
  { label: 'Total Users', value: '250', icon: <IconUsers width={18} height={18} />, tint: 'bg-brand/15 text-brand' },
  { label: 'New Users', value: '15', icon: <IconUsers width={18} height={18} />, tint: 'bg-white/[0.05] text-ink-200' },
  { label: 'Top Users', value: '200', icon: <IconHeart width={18} height={18} />, tint: 'bg-success/15 text-success' },
  { label: 'Other Users', value: '35', icon: <IconDotsV width={18} height={18} />, tint: 'bg-cyan/15 text-cyan' },
]

type User = {
  name: string
  email: string
  phone: string
  location: string
  company: string
  online: boolean
  avatar: number
  checked?: boolean
}

const USERS: User[] = [
  { name: 'John Carter', email: 'john@google.com', phone: '(414) 907 - 1274', location: 'United States', company: 'Google', online: true, avatar: 12, checked: true },
  { name: 'Sophie Moore', email: 'sophie@webflow.com', phone: '(240) 480 - 4277', location: 'United Kingdom', company: 'Webflow', online: false, avatar: 5 },
  { name: 'Matt Cannon', email: 'matt@facebook.com', phone: '(318) 698 - 9889', location: 'Australia', company: 'Facebook', online: false, avatar: 33 },
  { name: 'Graham Hills', email: 'graham@twitter.com', phone: '(540) 627 - 3890', location: 'India', company: 'Twitter', online: true, avatar: 8, checked: true },
  { name: 'Sandy Houston', email: 'sandy@youtube.com', phone: '(440) 410 - 3848', location: 'Canada', company: 'YouTube', online: false, avatar: 47 },
  { name: 'Andy Smith', email: 'andy@reddit.com', phone: '(504) 458 - 3268', location: 'United States', company: 'Reddit', online: true, avatar: 15, checked: true },
  { name: 'Lilly Woods', email: 'lilly@spotify.com', phone: '(361) 692 - 1819', location: 'Australia', company: 'Spotify', online: false, avatar: 24 },
  { name: 'Patrick Meyer', email: 'patrick@pinterest.com', phone: '(760) 582 - 5670', location: 'United Kingdom', company: 'Pinterest', online: true, avatar: 52, checked: true },
  { name: 'Frances Willen', email: 'frances@twitch.com', phone: '(216) 496 - 5864', location: 'Canada', company: 'Twitch', online: false, avatar: 20 },
  { name: 'Ernest Houston', email: 'ernest@linkedin.com', phone: '(704) 339 - 8813', location: 'India', company: 'LinkedIn', online: false, avatar: 60 },
]

export const UsersPage = () => (
  <div className="space-y-6">
    <ListTopBar title="Users" searchPlaceholder="Search for..." action="Add user" />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className={`grid size-11 place-items-center rounded-full ${s.tint}`}>
                {s.icon}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{s.label}</p>
                <p className="text-[13px] text-muted">{s.value}</p>
              </div>
            </div>
            <button aria-label="More" className="text-muted hover:text-ink-200">
              <IconDotsV width={16} height={16} />
            </button>
          </div>
        </Card>
      ))}
    </div>

    <ListCard title="All Users" range="1 - 10 of 256">
      <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-y border-line text-[12px] text-muted">
            <th className="py-3 pl-6 pr-3 font-medium">
              <span className="flex items-center gap-3">
                <Checkbox indeterminate />
                <SortHead icon={<IconUsers width={13} height={13} />} label="Name" />
              </span>
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconPhone width={13} height={13} />} label="Phone" />
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconPin width={13} height={13} />} label="Location" />
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconBriefcase width={13} height={13} />} label="Company" />
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconCheckSquare width={13} height={13} />} label="Status" />
            </th>
            <th className="py-3 pr-6" />
          </tr>
        </thead>
        <tbody>
          {USERS.map((u) => (
            <tr key={u.email} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
              <td className="py-4 pl-6 pr-3">
                <span className="flex items-center gap-3">
                  <Checkbox checked={u.checked} />
                  <img src={`https://i.pravatar.cc/64?img=${u.avatar}`} alt="" className="size-8 rounded-full object-cover" />
                  <span>
                    <span className="block font-semibold text-ink">{u.name}</span>
                    <span className="block text-[12px] text-muted">{u.email}</span>
                  </span>
                </span>
              </td>
              <td className="px-3 py-4 text-ink-200">{u.phone}</td>
              <td className="px-3 py-4 text-ink-200">{u.location}</td>
              <td className="px-3 py-4">
                <CompanyBadge name={u.company} />
              </td>
              <td className="px-3 py-4">
                <StatusPill tone={u.online ? 'online' : 'offline'}>
                  {u.online ? 'Online' : 'Offline'}
                </StatusPill>
              </td>
              <td className="py-4 pr-6">
                <RowActions />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListCard>

    <ListFooter total="1 - 10 of 460" />
  </div>
)
