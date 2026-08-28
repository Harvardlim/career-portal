import { useState } from 'react'
import { Breadcrumb } from '@/components/app/Breadcrumb'

const groups = [
  {
    title: 'Your Account',
    items: [
      'Donec in ipsum sit amet mi tincidunt lacinia ut id risus.',
      'Donec in ipsum sit amet mi tincidunt lacinia ut id risus.',
      'Etiam rutrum ligula at dui tempor, eu tempus ligula tristique.',
      'Morbi vitae neque eu sapien aliquet rhoncus.',
    ],
  },
  {
    title: 'Employers and Jobs',
    items: [
      'Donec in ipsum sit amet mi tincidunt lacinia ut id risus.',
      'Etiam rutrum ligula at dui tempor, eu tempus ligula tristique.',
      'Morbi vitae neque eu sapien aliquet rhoncus.',
    ],
  },
  {
    title: 'Candidate & Resume',
    items: [
      'Donec in ipsum sit amet mi tincidunt lacinia ut id risus.',
      'Etiam rutrum ligula at dui tempor, eu tempus ligula tristique.',
      'Morbi vitae neque eu sapien aliquet rhoncus.',
    ],
  },
]

const answer =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce pretium lacus ac ex tempus, sed dictum libero lacinia. Cras velit mauris, venenatis vel posuere at, scelerisque sed eros.'

function Accordion({ items }: { items: string[] }) {
  const [open, setOpen] = useState(1)
  return (
    <div className="flex flex-col gap-4">
      {items.map((q, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className={`rounded-lg border ${
              isOpen ? 'border-line shadow-feature' : 'border-line-soft'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className={`text-base ${isOpen ? 'font-medium text-brand' : 'text-ink'}`}>
                {q}
              </span>
              <span className="shrink-0 text-xl text-muted">{isOpen ? '×' : '+'}</span>
            </button>
            {isOpen && (
              <p className="px-6 pb-5 text-sm leading-6 text-muted-600">{answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function FaqPage() {
  return (
    <>
      <Breadcrumb title="Faq" trail={[{ label: 'Home', to: '/' }, { label: 'Faq' }]} />
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-12 px-6 py-16">
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-6">
            <h2 className="text-xl font-medium text-ink">{g.title}</h2>
            <Accordion items={g.items} />
          </section>
        ))}
      </div>
    </>
  )
}
