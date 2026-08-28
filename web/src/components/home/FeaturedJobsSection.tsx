import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  DollarIcon,
  MapPinIcon,
} from '@/components/icons'

type Job = {
  title: string
  type: string
  location: string
  salary: string
  remaining: string
  logoBg: string
  lightLogo?: boolean
  active?: boolean
}

const jobs: Job[] = [
  {
    title: 'Senior UX Designer',
    type: 'Contract Base',
    location: 'Australia',
    salary: '$30K-$35K',
    remaining: '4 Days Remaining',
    logoBg: '#6fda44',
  },
  {
    title: 'Software Engineer',
    type: 'Full Time',
    location: 'China',
    salary: '$50K-$60K',
    remaining: '4 Days Remaining',
    logoBg: '#191f33',
    active: true,
  },
  {
    title: 'Junior Graphic Designer',
    type: 'Full Time',
    location: 'Canada',
    salary: '$50K-$70K',
    remaining: '4 Days Remaining',
    logoBg: '#000000',
  },
  {
    title: 'Product Designer',
    type: 'Full Time',
    location: 'United States',
    salary: '$35K-$40K',
    remaining: '4 Days Remaining',
    logoBg: '#eb524f',
  },
  {
    title: 'Marketing Officer',
    type: 'Internship',
    location: 'Germany',
    salary: '$50K-$90K',
    remaining: '4 Days Remaining',
    logoBg: '#1877f2',
  },
  {
    title: 'Interaction Designer',
    type: 'Full Time',
    location: 'France',
    salary: '$5K-$10K',
    remaining: '4 Days Remaining',
    logoBg: '#edeff5',
    lightLogo: true,
  },
]

export function FeaturedJobsSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-6 py-20 lg:gap-[50px] lg:px-10 lg:py-25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-medium text-ink-heading lg:text-[40px] lg:leading-[48px]">
            Featured job
          </h2>
          <a
            href="#"
            className="flex items-center gap-3 rounded-[3px] border border-brand-50 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            View All
            <ArrowRightIcon className="size-6" />
          </a>
        </div>

        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <article
              key={job.title}
              className={`flex flex-col gap-6 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8 ${
                job.active
                  ? 'border-brand shadow-feature'
                  : 'border-line-soft'
              }`}
            >
              <div className="flex items-start gap-5">
                <span
                  className="flex size-[68px] shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: job.logoBg }}
                >
                  <BriefcaseIcon
                    className={`size-7 ${job.lightLogo ? 'text-ink' : 'text-white'}`}
                  />
                </span>
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-xl font-medium ${
                        job.active ? 'text-brand' : 'text-ink-heading'
                      }`}
                    >
                      {job.title}
                    </h3>
                    <span className="rounded-full bg-brand-tint px-3 py-0.5 text-sm text-brand">
                      {job.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-600">
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="size-[22px]" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarIcon className="size-[22px]" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="size-[22px]" />
                      {job.remaining}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Save job"
                  className={`rounded-[5px] p-3 ${
                    job.active ? 'bg-brand-tint text-brand' : 'text-muted-slate'
                  }`}
                >
                  <BookmarkIcon className="size-6" />
                </button>
                <a
                  href="#"
                  className={`flex items-center gap-3 rounded-[3px] px-6 py-3 text-base font-semibold transition-colors ${
                    job.active
                      ? 'bg-brand text-white hover:bg-brand-600'
                      : 'bg-brand-50 text-brand hover:bg-brand-100'
                  }`}
                >
                  Apply Now
                  <ArrowRightIcon className="size-6" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
