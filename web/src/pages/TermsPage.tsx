import { Breadcrumb } from '@/components/app/Breadcrumb'

const sections = [
  {
    id: 'terms',
    num: '01.',
    title: 'Terms & Condition',
    body: 'Praesent placerat dictum elementum. Nam pulvinar urna vel lectus maximus, eget faucibus turpis hendrerit. Sed iaculis molestie arcu, et accumsan nisl. Quisque molestie velit vitae ligula luctus bibendum. Duis sit amet eros mollis, iaculis ipsum sed, convallis sapien. Donec justo erat, pulvinar vitae dui ut, finibus euismod enim.',
    bullets: [
      'In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum.',
      'Curabitur luctus sapien augue, mattis faucibus nisl vehicula nec. Mauris at scelerisque lorem.',
      'Aenean vel metus leo. Vivamus nec neque a libero sodales aliquam a et dolor.',
      'Vestibulum rhoncus sagittis dolor vel finibus.',
      'Integer feugiat lacus ut efficitur mattis. Sed quis molestie velit.',
    ],
  },
  {
    id: 'limitations',
    num: '02.',
    title: 'Limitations',
    body: 'In pretium est sit amet diam feugiat eleifend. Curabitur consectetur fringilla metus. Morbi hendrerit facilisis tincidunt. Sed condimentum lacinia arcu. Ut ut iaculis metus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel erat elit.',
    bullets: [
      'In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum.',
      'Curabitur luctus sapien augue.',
      'mattis faucibus nisl vehicula nec, Mauris at scelerisque lorem.',
      'Nullam tempus felis ipsum, sagittis malesuada nulla vulputate et.',
      'Vivamus nec neque a libero sodales aliquam a et dolor.',
    ],
  },
  {
    id: 'security',
    num: '03.',
    title: 'Security',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ex neque, elementum eu blandit in, ornare eu purus. Fusce eu rhoncus mi, quis ultrices lacus. Phasellus id pellentesque nulla.',
    bullets: [],
  },
  {
    id: 'privacy',
    num: '04.',
    title: 'Privacy Policy',
    body: 'Praesent non sem facilisis, hendrerit nisi vitae, volutpat quam. Aliquam metus mauris, semper eu eros vitae, blandit tristique metus. Vestibulum maximus nec justo sed maximus. Vivamus sit amet turpis sem.',
    bullets: [
      'In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum.',
      'Mauris at scelerisque lorem. Nullam tempus felis ipsum, sagittis malesuada nulla vulputate et.',
      'Aenean vel metus leo.',
      'Vestibulum rhoncus sagittis dolor vel finibus.',
      'Integer feugiat lacus ut efficitur mattis. Sed quis molestie velit.',
    ],
  },
]

export function TermsPage() {
  return (
    <>
      <Breadcrumb
        title="Terms & Conditions"
        trail={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]}
      />
      <div className="mx-auto grid w-full max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-[1fr_240px] lg:px-10">
        <div className="flex flex-col gap-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex flex-col gap-4">
              <h2 className="text-2xl font-medium text-ink">
                {s.num} {s.title}
              </h2>
              <p className="text-base leading-7 text-muted-600">{s.body}</p>
              {s.bullets.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-sm text-muted-600 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-muted-slate"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="text-sm leading-6 text-muted">
            Fusce rutrum mauris sit amet justo rutrum, ut sodales lorem
            ullamcorper. Aliquam vitae iaculis urna. Nulla vitae mi vel nisl
            viverra ullamcorper vel elementum est.
          </p>
        </div>

        <nav className="hidden lg:block">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-400">
            Table of contents
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-600 hover:text-brand">
                  {s.num} {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
