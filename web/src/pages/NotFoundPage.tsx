import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@/components/icons'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-medium text-ink lg:text-5xl">
          Opps! Page not found
        </h1>
        <p className="max-w-sm text-muted-600">
          Something went wrong. It&rsquo;s look like the link is broken or the
          page is removed.
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-[4px] bg-brand px-6 py-3 text-base font-semibold text-white"
          >
            Home
            <ArrowRightIcon className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-[4px] border border-brand-100 px-6 py-3 text-base font-semibold text-brand"
          >
            Go Back
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <span className="text-[120px] font-bold text-brand-50">404</span>
      </div>
    </div>
  )
}
