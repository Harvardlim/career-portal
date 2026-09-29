import { Link } from 'react-router-dom'
import { Breadcrumb } from '@/components/app/Breadcrumb'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { ShareRow } from '@/components/app/SocialLinks'
import { ArrowRightIcon, CalendarIcon, QuoteIcon, UserIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

const comments = [
  {
    name: 'Cody Fisher',
    time: '1 day ago',
    text: 'Aliqu metus tortor, auctor id gravida condimentum, viverra quis sem.',
    replies: [],
  },
  {
    name: 'Bessie Cooper',
    time: '10 hrs ago',
    text: 'Nulla vitae consequat dolor enim velit mollis. Exercitation veniam consequat sunt nostrud amet.',
    replies: [
      {
        name: 'Bessie Cooper',
        time: '10 hrs ago',
        text: 'Velit officia consequat duis enim velit mollis. Exercitation veniam consequat sunt nostrud amet.',
      },
    ],
  },
  {
    name: 'Courtney Henry',
    time: '1 hr ago',
    text: 'Exercitation veniam consequat sunt nostrud amet.',
    replies: [],
  },
]

const related = [
  'Donec accumsan volutpat interdum. Nunc lobus enim.',
  'Praesent tristique sagittis malesuada. Nulla vulputate pretium',
  'Pharetra vel sapien vel, sagittis pulvinar orci. Pellentesque.',
]

function CommentItem({
  c,
  nested = false,
}: {
  c: (typeof comments)[number]['replies'][number] & { replies?: unknown[] }
  nested?: boolean
}) {
  const t = useT()
  return (
    <div className={nested ? 'ml-12' : ''}>
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-alt text-muted">
          <UserIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm">
            <span className="font-medium text-ink">{c.name}</span>
            <span className="text-muted">{c.time}</span>
          </span>
          <p className="text-sm text-muted-600">{c.text}</p>
          <button type="button" className="w-fit text-sm font-medium text-brand">{t('ui.reply')}</button>
        </div>
      </div>
    </div>
  )
}

export function SingleBlogPage() {
  const t = useT()
  return (
    <>
      <Breadcrumb
        title={t('ui.blog_single')}
        trail={[
          { label: t('ui.home'), to: '/' },
          { label: t('ui.blog'), to: '/blog' },
          { label: t('ui.blog_single_2') },
        ]}
      />
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-6 py-12 lg:flex-row lg:px-10">
        <article className="flex flex-1 flex-col gap-6">
          <h1 className="text-3xl font-medium text-ink">{t('ui.20_cool_fonts_for_web_and')}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <UserIcon className="size-4 text-brand" />{t('ui.kevin_gilbert')}</span>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-4 text-brand" />{t('ui.nov_12_2021')}</span>
            <span>{t('ui.25_comments')}</span>
          </div>

          <div className="h-72 rounded-xl bg-muted-slate/50" />

          <p className="text-lg leading-8 text-ink">{t('ui.check_out_these_20_cool_fonts')}</p>
          <p className="text-base leading-7 text-muted-600">{t('ui.this_aesthetic_nature_influences_designers_perception')}</p>
          <p className="text-base leading-7 text-muted-600">{t('ui.the_graphic_family_has_14_different')}</p>

          <blockquote className="flex gap-4 rounded-xl bg-surface-alt/60 p-6">
            <QuoteIcon className="size-8 shrink-0 text-brand" />
            <p className="text-base italic leading-7 text-ink">{t('ui.vintage_meets_vogue_is_the_only')}</p>
          </blockquote>

          <h2 className="text-xl font-medium text-ink">{t('ui.eb_garamond_and_relative_free_paid')}</h2>
          <p className="text-base leading-7 text-muted-600">{t('ui.relative_is_an_opentype_spec_certified')}</p>
          <div className="h-72 rounded-xl bg-muted-slate/50" />

          <ShareRow label={t('ui.share_this_post')} />

          <section className="flex flex-col gap-4 border-t border-line pt-8">
            <h2 className="text-lg font-medium text-ink">{t('ui.write_a_comments')}</h2>
            <textarea
              rows={4}
              placeholder={t('ui.share_your_thoughts_on_this_post')}
              className="w-full resize-none rounded-md border border-line p-4 text-base text-ink outline-none focus:border-brand placeholder:text-muted-400"
            />
            <button
              type="button"
              className="w-fit rounded-[4px] bg-brand px-6 py-3 text-sm font-semibold text-white"
            >{t('ui.post_a_comments')}</button>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-lg font-medium text-ink">{t('ui.comments')}</h2>
            {comments.map((c) => (
              <div key={c.name + c.time} className="flex flex-col gap-6">
                <CommentItem c={c} />
                {c.replies.map((r) => (
                  <CommentItem key={r.name + r.time} c={r} nested />
                ))}
              </div>
            ))}
            <button
              type="button"
              className="w-fit rounded-[4px] bg-brand-50 px-6 py-2.5 text-sm font-semibold text-brand"
            >{t('ui.load_more')}</button>
          </section>
        </article>

        <BlogSidebar />
      </div>

      <section className="bg-surface-alt/50">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-3xl font-medium text-ink lg:text-[40px]">{t('ui.related_blog')}</h2>
            <div className="flex gap-3">
              <button type="button" aria-label={t('ui.previous')} className="rounded bg-brand-50 p-3 text-brand">
                <ArrowRightIcon className="size-5 -scale-x-100" />
              </button>
              <button type="button" aria-label={t('ui.next')} className="rounded bg-brand-50 p-3 text-brand">
                <ArrowRightIcon className="size-5" />
              </button>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((title, i) => (
              <Link
                key={title}
                to="/blog/post"
                className={`flex flex-col gap-4 rounded-xl border bg-surface p-4 ${
                  i === 1 ? 'border-brand shadow-feature' : 'border-line-soft'
                }`}
              >
                <span className="h-40 rounded-lg bg-muted-slate/50" />
                <span className="text-base font-medium text-ink">{title}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-brand">{t('ui.read_more')}<ArrowRightIcon className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
