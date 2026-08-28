import { Link } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { SearchFilterBar, ResultsToolbar } from '@/components/app/SearchFilterBar'
import { SidebarFilter } from '@/components/app/SidebarFilter'
import { CompanyLogo } from '@/components/jobs/CompanyLogo'
import { employers } from '@/data/employers'
import { ArrowRightIcon, BriefcaseIcon, MapPinIcon } from '@/components/icons'

export function BrowseEmployerPage() {
  return (
    <AppShell>
      <Breadcrumb
        title="Find Employers"
        trail={[{ label: 'Home', to: '/' }, { label: 'Find Employers' }]}
      />
      <SearchFilterBar />
      <ResultsToolbar view="grid" />

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-6 py-8 lg:flex-row lg:px-10">
        <SidebarFilter
          groups={[
            {
              title: 'Organization Type',
              type: 'radio',
              name: 'org-type',
              options: [
                'Government',
                'Semi Government',
                'NGO',
                'Private Company',
                'International Agencies',
                'Others',
              ],
            },
          ]}
        />

        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {employers.map((e) => (
              <article
                key={e.id}
                className="flex flex-col gap-4 rounded-xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <CompanyLogo bg={e.logoBg} lightLogo={e.lightLogo} />
                  <div className="flex flex-col gap-1.5">
                    <p className="text-base font-medium text-ink">{e.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <MapPinIcon className="size-[18px]" />
                        {e.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BriefcaseIcon className="size-[18px]" />
                        {e.openJobs} - open Job
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/employer-detail"
                  className="flex shrink-0 items-center gap-3 rounded-[3px] bg-brand-50 px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand-100"
                >
                  Open Position
                  <ArrowRightIcon className="size-5" />
                </Link>
              </article>
            ))}
          </div>
          <div className="pt-10">
            <Pagination current={1} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
