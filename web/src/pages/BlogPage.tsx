import { Link } from 'react-router-dom'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { Pagination } from '@/components/app/Pagination'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { ArrowRightIcon, CalendarIcon } from '@/components/icons'

const posts = [
  'Proin sit amet massa eget odio consectetur ultricies.',
  'Praesent tristique sagittis malesuada. Nulla vulputate pretium',
  'Integer volutpat fringilla ipsum, nec tempor risus facilisis eget.',
  'Praesent hendrerit diam ac metus finibus, id vehicula velit suscipit.',
  'Nullam et est vel eros sodales sollicitudin.',
  'Pellentesque lobortis diam in dictum maximus.',
  'Class aptent taciti sociosqu ad litora torquent per.',
  'Curabitur feugiat urna quis ante aliquet, nec tincidunt sem mollis.',
]

const excerpt =
  'Integer imperdiet mauris eget nisi ultrices, quis hendrerit est consequat. Vivamus et volutpat odio. Maecenas porta erat sed massa bibendum pellentesque.'

export function BlogPage() {
  return (
    <>
      <Breadcrumb title="Blog" trail={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-6 py-12 lg:flex-row lg:px-10">
        <BlogSidebar />
        <div className="flex flex-1 flex-col gap-8">
          {posts.map((title, i) => (
            <article
              key={title}
              className={`flex flex-col gap-6 rounded-xl border sm:flex-row ${
                i === 1 ? 'border-brand shadow-feature' : 'border-line-soft'
              }`}
            >
              <span className="h-56 shrink-0 rounded-l-xl bg-muted-slate/50 sm:w-[320px]" />
              <div className="flex flex-col gap-3 p-6 sm:pl-0">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="size-4 text-brand" />
                    Nov 12, 2021
                  </span>
                  <span>25 Comments</span>
                </div>
                <h2
                  className={`text-xl font-medium ${
                    i === 1 ? 'text-brand' : 'text-ink'
                  }`}
                >
                  {title}
                </h2>
                <p className="text-sm leading-6 text-muted-600">{excerpt}</p>
                <Link
                  to="/blog/post"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand"
                >
                  Read more
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </article>
          ))}
          <div className="pt-6">
            <Pagination current={1} />
          </div>
        </div>
      </div>
    </>
  )
}
