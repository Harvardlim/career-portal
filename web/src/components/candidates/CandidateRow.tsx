import { Link } from 'react-router-dom'
import type { Candidate } from '@/data/candidates'
import { ArrowRightIcon, BookmarkIcon, ClockIcon, MapPinIcon } from '@/components/icons'

export function CandidateRow({ candidate }: { candidate: Candidate }) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between ${
        candidate.highlighted ? 'border-brand shadow-feature' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted-slate/40 text-lg font-medium text-white">
          {candidate.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </span>
        <div className="flex flex-col gap-1.5">
          <p
            className={`text-base font-medium ${
              candidate.highlighted ? 'text-brand' : 'text-ink'
            }`}
          >
            {candidate.name}
          </p>
          <p className="text-sm text-muted">{candidate.role}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-[18px]" />
              {candidate.location}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-[18px]" />
              {candidate.experience}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Save candidate"
          className={`rounded-[5px] p-3 ${
            candidate.highlighted ? 'bg-brand-tint text-brand' : 'text-muted-slate'
          }`}
        >
          <BookmarkIcon className="size-6" />
        </button>
        <Link
          to="/send-email"
          className={`flex items-center gap-3 rounded-[3px] px-6 py-3 text-base font-semibold transition-colors ${
            candidate.highlighted
              ? 'bg-brand text-white hover:bg-brand-600'
              : 'bg-brand-50 text-brand hover:bg-brand-100'
          }`}
        >
          View Profile
          <ArrowRightIcon className="size-5" />
        </Link>
      </div>
    </article>
  )
}
