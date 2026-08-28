import { ArrowRightIcon, QuoteIcon, StarIcon } from '@/components/icons'

type Testimonial = {
  quote: string
  name: string
  role: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    quote:
      '“Ut ullamcorper hendrerit tempor. Aliquam in rutrum dui. Maecenas ac placerat metus, in faucibus est.”',
    name: 'Robert Fox',
    role: 'UI/UX Designer',
    avatar: '/figma/avatar-1.jpg',
  },
  {
    quote:
      '“Mauris eget lorem odio. Mauris convallis justo molestie metus aliquam lacinia. Suspendisse ut dui vulputate augue condimentum ornare. Morbi vitae tristique ante”',
    name: 'Bessie Cooper',
    role: 'Creative Director',
    avatar: '/figma/avatar-2.jpg',
  },
  {
    quote:
      '“Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse et magna quis nibh accumsan venenatis sit amet id orci. Duis vestibulum bibendum dapibus.”',
    name: 'Jane Cooper',
    role: 'Photographer',
    avatar: '/figma/avatar-3.jpg',
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-surface-alt">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-12 px-6 py-20 lg:gap-[50px] lg:px-10 lg:py-25">
        <h2 className="text-center text-3xl font-medium text-ink-heading lg:text-[40px] lg:leading-[48px]">
          Clients Testimonial
        </h2>

        <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between gap-6 rounded-xl bg-surface p-6 shadow-card"
            >
              <div className="flex flex-col gap-4">
                <div className="flex gap-0.5 text-star">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="size-7" />
                  ))}
                </div>
                <blockquote className="text-base leading-6 text-[#464d61]">
                  {t.quote}
                </blockquote>
              </div>
              <figcaption className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="size-12 shrink-0 rounded-full object-cover"
                    width={48}
                    height={48}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-medium text-ink-heading">
                      {t.name}
                    </span>
                    <span className="text-sm text-[#767e94]">{t.role}</span>
                  </span>
                </div>
                <QuoteIcon className="size-12 shrink-0 text-muted-slate" />
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            aria-label="Previous testimonial"
            className="rounded-[5px] bg-surface p-3 text-ink shadow-search"
          >
            <ArrowRightIcon className="size-6 -scale-x-100" />
          </button>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-100" />
            <span className="size-2.5 rounded-full bg-brand-100" />
            <span className="h-2.5 w-6 rounded-full bg-[#0066ff]" />
            <span className="size-2.5 rounded-full bg-brand-100" />
            <span className="size-2.5 rounded-full bg-brand-100" />
          </div>
          <button
            type="button"
            aria-label="Next testimonial"
            className="rounded-[5px] bg-surface p-3 text-ink shadow-search"
          >
            <ArrowRightIcon className="size-6" />
          </button>
        </div>
      </div>
    </section>
  )
}
