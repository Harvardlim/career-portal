import { CompanyBadge } from '../components/CompanyBadge'
import {
  Checkbox,
  ListCard,
  ListFooter,
  ListTopBar,
  RowActions,
  SortHead,
} from '../components/ListShell'
import { StatusPill } from '../components/ui'
import {
  IconBriefcase,
  IconCheckSquare,
  IconClipboard,
  IconDollar,
  IconTag,
} from '../components/Icons'

type Job = {
  title: string
  category: string
  type: string
  company: string
  open: boolean
  checked?: boolean
}

const JOBS: Job[] = [
  { title: 'Product Designer', category: 'Design', type: 'Full time', company: 'Google', open: true, checked: true },
  { title: 'Frontend Engineer', category: 'Engineering', type: 'Remote', company: 'Webflow', open: false },
  { title: 'iOS Developer', category: 'Engineering', type: 'Contract', company: 'Facebook', open: false },
  { title: 'Marketing Lead', category: 'Marketing', type: 'Full time', company: 'Twitter', open: true, checked: true },
  { title: 'Data Analyst', category: 'Analytics', type: 'Full time', company: 'YouTube', open: false },
  { title: 'Community Manager', category: 'Support', type: 'Part time', company: 'Reddit', open: true, checked: true },
  { title: 'Backend Engineer', category: 'Engineering', type: 'Remote', company: 'Spotify', open: false },
  { title: 'Brand Designer', category: 'Design', type: 'Full time', company: 'Pinterest', open: true, checked: true },
  { title: 'QA Engineer', category: 'Engineering', type: 'Contract', company: 'Twitch', open: false },
  { title: 'Recruiter', category: 'People', type: 'Full time', company: 'LinkedIn', open: false },
]

const JobIcon = ({ seed }: { seed: number }) => (
  <span
    className="grid size-8 place-items-center rounded-full text-white"
    style={{
      background: `linear-gradient(135deg, hsl(${(seed * 47) % 360} 80% 60%), #00C2FF)`,
    }}
  >
    <IconBriefcase width={15} height={15} />
  </span>
)

export const JobListPage = () => (
  <div className="space-y-6">
    <ListTopBar title="Job List" searchPlaceholder="Search for job..." action="Add New Job" />

    <ListCard title="All Jobs" range="1 - 10 of 256">
      <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-y border-line text-[12px] text-muted">
            <th className="py-3 pl-6 pr-3 font-medium">
              <span className="flex items-center gap-3">
                <Checkbox indeterminate />
                <SortHead icon={<IconBriefcase width={13} height={13} />} label="Job Title" />
              </span>
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconTag width={13} height={13} />} label="Category" />
            </th>
            <th className="px-3 py-3 font-medium">
              <SortHead icon={<IconClipboard width={13} height={13} />} label="Type" />
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
          {JOBS.map((j, i) => (
            <tr key={j.title} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
              <td className="py-4 pl-6 pr-3">
                <span className="flex items-center gap-3">
                  <Checkbox checked={j.checked} />
                  <JobIcon seed={i + 1} />
                  <span className="font-semibold text-ink">{j.title}</span>
                </span>
              </td>
              <td className="px-3 py-4 text-muted">{j.category}</td>
              <td className="px-3 py-4 text-ink-200">
                <span className="inline-flex items-center gap-1 text-muted">
                  <IconDollar width={12} height={12} /> {j.type}
                </span>
              </td>
              <td className="px-3 py-4">
                <CompanyBadge name={j.company} />
              </td>
              <td className="px-3 py-4">
                <StatusPill tone={j.open ? 'in' : 'out'}>{j.open ? 'Open' : 'Closed'}</StatusPill>
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
