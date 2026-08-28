import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { InfoCard, OverviewGrid, ContactRow } from '@/components/app/InfoCard'
import { SocialLinks, ShareRow } from '@/components/app/SocialLinks'
import { JobCard } from '@/components/jobs/JobCard'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { jobs } from '@/data/jobs'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  GlobeIcon,
  LayersIcon,
  MailIcon,
  PhoneIcon,
  UsersIcon,
} from '@/components/icons'

const benefits = [
  'In hac habitasse platea dictumst.',
  'Sed aliquet, arcu eget pretium bibendum, odio enim rutrum arcu.',
  'Vestibulum id vestibulum odio.',
  'Etiam libero ante accumsan id tellus venenatis rhoncus vulputate velit.',
  'Nam condimentum sit amet ipsum id malesuada.',
]

const openPositions = jobs.filter((j) =>
  [
    'visual-designer',
    'front-end-developer',
    'technical-support-specialist',
    'software-engineer',
    'product-designer',
  ].includes(j.id),
)

export function EmployerDetailPage() {
  return (
    <AppShell>
      <Breadcrumb
        title="Single Employers"
        trail={[
          { label: 'Home', to: '/' },
          { label: 'Find Employers', to: '/browse-employer' },
          { label: 'Single Employers' },
        ]}
      />

      <div className="h-56 w-full bg-[radial-gradient(120%_140%_at_20%_0%,#0a65cc_0%,#042852_70%)]" />

      <div className="mx-auto -mt-16 w-full max-w-[1320px] px-6 lg:px-10">
        <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-8 shadow-feature sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CompanyLogo bg="linear-gradient(135deg,#fa8f21,#d82d7e)" size={64} rounded="rounded-lg" />
            <div>
              <p className="text-xl font-medium text-ink">Twitter</p>
              <p className="text-sm text-muted">Information Technology (IT)</p>
            </div>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-3 rounded-[4px] bg-brand px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-600"
          >
            View Open Position
            <ArrowRightIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-6 py-12 lg:grid-cols-[1fr_400px] lg:px-10">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Description</h2>
            <p className="text-base leading-7 text-muted-600">
              Fusce et erat at nibh maximus fermentum. Mauris ac justo nibh.
              Praesent nec lorem lorem. Donec ullamcorper lacus mollis tortor
              pretium malesuada. In quis porta nisi, quis fringilla orci. Donec
              porttitor, odio a efficitur blandit, orci nisl porta elit, eget
              vulputate quam nibh ut tellus. Sed ut posuere risus, vitae commodo
              velit. Nullam in lorem dolor. Class aptent taciti sociosqu ad
              litora torquent per conubia nostra, per inceptos himenaeos.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Company Benefits</h2>
            <p className="text-base leading-7 text-muted-600">
              Donec dignissim nunc eu tellus malesuada fermentum. Sed blandit in
              magna at accumsan. Etiam imperdiet massa aliquam, consectetur leo
              in, auctor neque.
            </p>
            <ul className="flex flex-col gap-3">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex gap-3 text-base text-muted-600 before:mt-2.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-muted-slate"
                >
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-ink">Company Vision</h2>
            <p className="text-base leading-7 text-muted-600">
              Praesent ultrices mauris at nisi euismod, ut venenatis augue
              blandit. Etiam massa risus, accumsan nec tempus nec, venenatis in
              nisl. Maecenas nulla ex, blandit in magna id, pellentesque
              facilisis sapien. In feugiat auctor mi, eget commodo lectus
              convallis ac.
            </p>
          </section>

          <ShareRow label="Share profile:" />
        </div>

        <aside className="flex flex-col gap-6">
          <InfoCard>
            <OverviewGrid
              columns={2}
              items={[
                { Icon: CalendarIcon, label: 'Founded in:', value: '14 June, 2021' },
                { Icon: LayersIcon, label: 'Organization Type', value: 'Private Company' },
                { Icon: UsersIcon, label: 'Team Size', value: '120-300 Candidates' },
                { Icon: BriefcaseIcon, label: 'Industry Types', value: 'Technology' },
              ]}
            />
          </InfoCard>

          <InfoCard title="Contact Information">
            <ContactRow Icon={GlobeIcon} label="Website" value="www.estherhoward.com" />
            <ContactRow Icon={PhoneIcon} label="Phone" value="+1-202-555-0141" />
            <ContactRow
              Icon={MailIcon}
              label="Email address"
              value="esther.howard@gmail.com"
            />
          </InfoCard>

          <InfoCard>
            <SocialLinks label="Follow us on:" />
          </InfoCard>
        </aside>
      </div>

      <section className="bg-surface-alt/50">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10">
          <h2 className="mb-10 text-3xl font-medium text-ink lg:text-[40px]">
            Open Position (05)
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {openPositions.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
