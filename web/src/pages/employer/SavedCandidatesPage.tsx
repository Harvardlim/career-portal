import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployerDashboardLayout } from '@/components/dashboard/EmployerDashboardLayout'
import { ArrowRightIcon, BookmarkIcon, MoreIcon } from '@/components/icons'

const saved = [
  { name: 'Guy Hawkins', role: 'Techical Support Specialist' },
  { name: 'Jacob Jones', role: 'Product Designer' },
  { name: 'Cameron Williamson', role: 'Marketing Officer', highlighted: true },
  { name: 'Robert Fox', role: 'Marketing Manager' },
  { name: 'Kathryn Murphy', role: 'Junior Graphic Designer' },
  { name: 'Darlene Robertson', role: 'Visual Designer' },
  { name: 'Kristin Watson', role: 'Senior UX Designer' },
  { name: 'Jenny Wilson', role: 'Interaction Designer' },
  { name: 'Marvin McKinney', role: 'Networking Engineer' },
  { name: 'Theresa Webb', role: 'Software Engineer' },
]

function Row({ c }: { c: (typeof saved)[number] }) {
  const [menu, setMenu] = useState(false)
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
        c.highlighted ? 'border-brand shadow-feature' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="size-12 shrink-0 rounded-md bg-muted-slate/40" />
        <span className="flex flex-col">
          <span className="font-medium text-ink">{c.name}</span>
          <span className="text-sm text-muted">{c.role}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Saved" className="text-brand">
          <BookmarkIcon className="size-6 fill-current" />
        </button>
        <Link
          to="/send-email"
          className={`flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-sm font-semibold ${
            c.highlighted ? 'bg-brand text-white' : 'bg-brand-50 text-brand hover:bg-brand-100'
          }`}
        >
          View Profile
          <ArrowRightIcon className="size-4" />
        </Link>
        <div className="relative">
          <button
            type="button"
            aria-label="Options"
            onClick={() => setMenu((v) => !v)}
            className="grid size-9 place-items-center rounded text-muted hover:bg-surface-alt"
          >
            <MoreIcon className="size-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-10 z-10 w-40 rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
              <button className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt">
                Send Email
              </button>
              <button className="block w-full px-4 py-2 text-left text-ink-600 hover:bg-surface-alt">
                Download Cv
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SavedCandidatesPage() {
  return (
    <EmployerDashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-medium text-ink">Saved Cadidates</h1>
          <p className="text-sm text-muted">
            All of the candidates are visible until 24 march, 2021
          </p>
        </div>
        <div className="flex flex-col divide-y divide-line">
          {saved.map((c) => (
            <Row key={c.name} c={c} />
          ))}
        </div>
      </div>
    </EmployerDashboardLayout>
  )
}
