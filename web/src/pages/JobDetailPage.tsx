import { Link } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { InfoCard, OverviewGrid } from '@/components/app/InfoCard'
import { SocialLinks, ShareRow } from '@/components/app/SocialLinks'
import { JobCard } from '@/components/jobs/JobCard'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { jobs } from '@/data/jobs'
import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  LayersIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '@/components/icons'

const description = [
  'Integer aliquet pretium consequat. Donec et sapien id leo accumsan pellentesque eget maximus tellus. Duis et est ac leo rhoncus tincidunt vitae vehicula augue. Donec in suscipit diam. Pellentesque quis justo sit amet arcu commodo sollicitudin. Integer finibus blandit condimentum. Vivamus sit amet ligula ullamcorper, pulvinar ante id, tristique erat. Quisque sit amet aliquam urna. Maecenas blandit felis id massa sodales finibus. Integer bibendum eu nulla eu sollicitudin. Sed lobortis diam tincidunt accumsan faucibus. Quisque blandit augue quis turpis auctor, dapibus euismod ante ultricies. Ut non felis lacinia turpis feugiat euismod at id magna. Sed ut orci arcu. Suspendisse sollicitudin faucibus aliquet.',
  'Nam dapibus consectetur erat in euismod. Cras urna augue, mollis venenatis augue sed, porttitor aliquet nibh. Sed tristique dictum elementum. Nulla imperdiet sit amet quam eget lobortis. Etiam in neque sit amet orci interdum tincidunt.',
]

const responsibilities = [
  'Quisque semper gravida est et consectetur.',
  'Curabitur blandit lorem velit, vitae pretium leo placerat eget.',
  'Morbi mattis in ipsum ac tempus.',
  'Curabitur eu vehicula libero. Vestibulum sed purus ullamcorper, lobortis lectus nec.',
  'vulputate turpis. Quisque ante odio, iaculis a porttitor sit amet.',
  'lobortis vel lectus. Nulla at risus ut diam.',
  'commodo feugiat. Nullam laoreet, diam placerat dapibus tincidunt.',
  'odio metus posuere lorem, id condimentum erat velit nec neque.',
  'dui sodales ut. Curabitur tempus augue.',
]

const overview = [
  { Icon: CalendarIcon, label: 'Job Posted:', value: '14 June, 2021' },
  { Icon: ClockIcon, label: 'Job expire in:', value: '14 July, 2021' },
  { Icon: LayersIcon, label: 'Education', value: 'Graduation' },
  { Icon: DollarIcon, label: 'Salery:', value: '$50k-80k/month' },
  { Icon: MapPinIcon, label: 'Location:', value: 'New York, USA' },
  { Icon: BriefcaseIcon, label: 'Job Type:', value: 'Full Time' },
  { Icon: BriefcaseIcon, label: 'Experience', value: '10-15 Years' },
]

const companyRows = [
  ['Founded in:', 'March 21, 2006'],
  ['Organization type:', 'Private Company'],
  ['Company size:', '120-300 Employers'],
  ['Phone:', '(406) 555-0120'],
  ['Email:', 'twitter@gmail.com'],
  ['Website:', 'https://twitter.com'],
]

const relatedJobs = jobs
  .filter((j) =>
    [
      'visual-designer',
      'front-end-developer',
      'technical-support-specialist',
      'software-engineer',
      'product-designer',
      'interaction-designer',
    ].includes(j.id),
  )
  .map((j) => ({ ...j, highlighted: false }))

export function JobDetailPage() {
  return (
    <AppShell>
      <Breadcrumb
        title="Job Details"
        trail={[
          { label: 'Home', to: '/' },
          { label: 'Find Job', to: '/find-job' },
          { label: 'Graphics & Design' },
          { label: 'Job Details' },
        ]}
      />

      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start lg:justify-between lg:px-10">
          <div className="flex items-start gap-5">
            <CompanyLogo bg="linear-gradient(135deg,#7c3aed,#fa8f21,#d82d7e)" size={80} rounded="rounded-full" />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-medium text-ink">Senior UX Designer</h1>
                <span className="rounded-full bg-danger-50 px-3 py-0.5 text-sm text-danger">
                  Featured
                </span>
                <span className="rounded-full bg-brand-tint px-3 py-0.5 text-sm text-brand">
                  Full Time
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-600">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="size-4 text-brand" />
                  https://instagram.com
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="size-4 text-brand" />
                  (406) 555-0120
                </span>
                <span className="flex items-center gap-1.5">
                  <MailIcon className="size-4 text-brand" />
                  career@instagram.com
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Save job"
                className="rounded-[5px] bg-brand-50 p-3 text-brand"
              >
                <BookmarkIcon className="size-6" />
              </button>
              <Link
                to="/apply-job"
                className="flex items-center gap-3 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Apply Now
                <ArrowRightIcon className="size-5" />
              </Link>
            </div>
            <p className="text-sm text-muted">
              Job expire in:{' '}
              <span className="font-medium text-danger">June 30, 2021</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-6 py-12 lg:grid-cols-[1fr_400px] lg:px-10">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Job Description</h2>
            {description.map((p, i) => (
              <p key={i} className="text-base leading-7 text-muted-600">
                {p}
              </p>
            ))}
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Responsibilities</h2>
            <ul className="flex flex-col gap-3">
              {responsibilities.map((r) => (
                <li
                  key={r}
                  className="flex gap-3 text-base text-muted-600 before:mt-2.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-muted-slate"
                >
                  {r}
                </li>
              ))}
            </ul>
          </section>
          <ShareRow />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard title="Job Overview">
            <OverviewGrid items={overview} />
          </InfoCard>
          <InfoCard>
            <div className="mb-5 flex items-center gap-3">
              <CompanyLogo bg="linear-gradient(135deg,#7c3aed,#fa8f21,#d82d7e)" size={56} />
              <div>
                <p className="text-lg font-medium text-ink">Instagram</p>
                <p className="text-sm text-muted">Social networking service</p>
              </div>
            </div>
            <dl className="flex flex-col">
              {companyRows.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-line py-3 text-sm last:border-0"
                >
                  <dt className="text-muted-600">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <SocialLinks />
            </div>
          </InfoCard>
        </aside>
      </div>

      <section className="bg-surface-alt/50">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10">
          <h2 className="mb-10 text-3xl font-medium text-ink lg:text-[40px]">
            Related Jobs
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
