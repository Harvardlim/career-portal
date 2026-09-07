import { AppShell } from '@/layouts/AppShell'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { SearchFilterBar, ResultsToolbar } from '@/components/app/SearchFilterBar'
import { SidebarFilter } from '@/components/app/SidebarFilter'
import { CandidateRow } from '@/components/candidates/CandidateRow'
import { candidates } from '@/data/candidates'

export function BrowseCandidatePage() {
  return (
    <AppShell>
      <Breadcrumb
        title="Find Candidate"
        trail={[{ label: 'Home', to: '/' }, { label: 'Find Candidate' }]}
      />
      <SearchFilterBar />
      <ResultsToolbar view="list" />

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-6 py-8 lg:flex-row lg:px-10">
        <SidebarFilter
          groups={[
            {
              title: 'Candidate Level',
              type: 'radio',
              name: 'level',
              options: ['Entry Level', 'Mid Level', 'Expert Level'],
              selected: ['Mid Level'],
            },
            {
              title: 'Experiences',
              type: 'radio',
              name: 'experience',
              options: [
                'Freshers',
                '1 - 2 Years',
                '2 - 4 Years',
                '4 - 6 Years',
                '6 - 8 Years',
                '8 - 10 Years',
                '10 - 15 Years',
                '15+ Years',
              ],
              selected: ['4 - 6 Years'],
            },
            {
              title: 'Education',
              type: 'checkbox',
              name: 'education',
              options: [
                'All',
                'High School',
                'Intermediate',
                'Graduation',
                'Master Degree',
                'Bachelor Degree',
              ],
              selected: ['Graduation'],
            },
            {
              title: 'Gender',
              type: 'radio',
              name: 'gender',
              options: ['Male', 'Female', 'Others'],
              selected: ['Male'],
            },
          ]}
        />

        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {candidates.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
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
