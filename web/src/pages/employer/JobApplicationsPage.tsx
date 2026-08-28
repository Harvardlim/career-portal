import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import {
  DownloadIcon,
  FilterIcon,
  MoreIcon,
  PlusCircleIcon,
} from '@/components/icons'

type Applicant = {
  name: string
  role: string
  education: string
}

const columns: { title: string; count: number; applicants: Applicant[] }[] = [
  {
    title: 'All Application',
    count: 213,
    applicants: [
      { name: 'Ronald Richards', role: 'UI/UX Designer', education: 'Master Degree' },
      { name: 'Theresa Webb', role: 'Product Designer', education: 'High School Degree' },
      { name: 'Devon Lane', role: 'User Experience Designer', education: 'Master Degree' },
      { name: 'Kathryn Murphy', role: 'Graphic Designer', education: 'Bachelor Degree' },
    ],
  },
  {
    title: 'Shortlisted',
    count: 2,
    applicants: [
      { name: 'Darrell Steward', role: 'UI/UX Designer', education: 'Intermediate Degree' },
      { name: 'Jenny Wilson', role: 'UI Designer', education: 'Bachelor Degree' },
    ],
  },
]

function ApplicantCard({ a }: { a: Applicant }) {
  return (
    <Link
      to="/employer/applications/applicant"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <div className="flex items-center gap-3">
        <span className="size-12 shrink-0 rounded-full bg-muted-slate/40" />
        <span className="flex flex-col">
          <span className="font-medium text-ink">{a.name}</span>
          <span className="text-sm text-muted">{a.role}</span>
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-muted-600">
        <li className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-muted-slate">
          7 Years Experience
        </li>
        <li className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-muted-slate">
          Education: {a.education}
        </li>
        <li className="flex gap-2 before:mt-2 before:size-1 before:shrink-0 before:rounded-full before:bg-muted-slate">
          Applied: Jan 23, 2022
        </li>
      </ul>
      <span className="flex items-center gap-1.5 text-sm font-medium text-brand">
        <DownloadIcon className="size-4" />
        Download Cv
      </span>
    </Link>
  )
}

export function JobApplicationsPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-muted">Home</Link>
          <span className="text-muted">/</span>
          <span className="text-muted">Job</span>
          <span className="text-muted">/</span>
          <span className="text-muted">Senior UI/UX Designer</span>
          <span className="text-muted">/</span>
          <span className="font-medium text-brand">Applications</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-medium text-ink">Job Applications</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-[4px] border border-line px-4 py-2 text-sm text-ink-600"
            >
              <FilterIcon className="size-4" />
              Filter
            </button>
            <button
              type="button"
              className="rounded-[4px] bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Sort
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto]">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4 rounded-xl bg-surface-alt/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">
                  {col.title} ({col.count})
                </p>
                <MoreIcon className="size-5 text-muted" />
              </div>
              {col.applicants.map((a) => (
                <Fragment key={a.name}>
                  <ApplicantCard a={a} />
                </Fragment>
              ))}
            </div>
          ))}
          <button
            type="button"
            className="flex h-fit items-center gap-2 rounded-xl border border-dashed border-line px-6 py-4 text-sm font-medium text-muted-600"
          >
            <PlusCircleIcon className="size-5" />
            Create column
          </button>
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
