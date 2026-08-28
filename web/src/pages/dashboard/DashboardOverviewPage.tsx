import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AppliedJobRow } from '@/components/dashboard/JobRows'
import { appliedJobs } from '@/data/dashboardJobs'
import {
  ArrowRightIcon,
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
} from '@/components/icons'

const stats = [
  { value: '589', label: 'Applied jobs', Icon: BriefcaseIcon, bg: 'bg-brand-50', fg: 'text-brand' },
  { value: '238', label: 'Favorite jobs', Icon: BookmarkIcon, bg: 'bg-[#fff6e6]', fg: 'text-[#ffaa00]' },
  { value: '574', label: 'Job Alerts', Icon: BellIcon, bg: 'bg-[#e7f6ec]', fg: 'text-[#0ba02c]' },
]

export function DashboardOverviewPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-medium text-ink">Hello, Esther Howard</h1>
          <p className="mt-1 text-muted">
            Here is your daily activities and job alerts
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map(({ value, label, Icon, bg, fg }) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded-lg p-6 ${bg}`}
            >
              <div>
                <p className="text-3xl font-medium text-ink">{value}</p>
                <p className="mt-1 text-sm text-ink-600">{label}</p>
              </div>
              <span className={`grid size-12 place-items-center rounded-lg bg-surface ${fg}`}>
                <Icon className="size-6" />
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-danger p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/figma/avatar-1.jpg"
              alt=""
              className="size-14 rounded-full object-cover"
            />
            <div>
              <p className="text-lg font-medium">
                Your profile editing is not completed.
              </p>
              <p className="text-sm text-white/80">
                Complete your profile editing &amp; build your custom Resume
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/settings"
            className="flex shrink-0 items-center gap-2 rounded-[4px] bg-surface px-6 py-3 text-sm font-semibold text-brand"
          >
            Edit Profile
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Recently Applied</h2>
            <Link
              to="/dashboard/applied-jobs"
              className="flex items-center gap-1.5 text-sm text-muted-600"
            >
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-alt px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-600 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8">
            <span>Job</span>
            <span className="sm:w-[150px]">Date Applied</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {appliedJobs.slice(0, 4).map((job) => (
              <AppliedJobRow key={job.title} job={job} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
