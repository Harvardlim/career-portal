type Vacancy = { title: string; positions: string; highlight?: boolean }

const vacancies: Vacancy[] = [
  { title: 'Anesthesiologists', positions: '45,904 Open Positions' },
  { title: 'Surgeons', positions: '50,364 Open Positions' },
  { title: 'Obstetricians-Gynecologists', positions: '4,339 Open Positions' },
  { title: 'Orthodontists', positions: '20,079 Open Positions' },
  { title: 'Maxillofacial Surgeons', positions: '74,875 Open Positions' },
  { title: 'Software Developer', positions: '43359 Open Positions' },
  { title: 'Psychiatrists', positions: '18,599 Open Positions' },
  { title: 'Data Scientist', positions: '28,200 Open Positions', highlight: true },
  { title: 'Financial Manager', positions: '61,391 Open Positions' },
  { title: 'Management Analysis', positions: '93,046 Open Positions' },
  { title: 'IT Manager', positions: '50,963 Open Positions' },
  { title: 'Operations Research Analysis', positions: '16,627 Open Positions' },
]

export function VacanciesSection() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-12 px-6 py-20 lg:gap-[50px] lg:px-10 lg:py-25">
        <h2 className="text-3xl font-medium text-ink lg:text-[40px] lg:leading-[48px]">
          Most Popular Vacancies
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {vacancies.map((v) => (
            <a key={v.title} href="#" className="flex flex-col gap-2">
              <span
                className={`text-lg font-medium leading-7 ${
                  v.highlight ? 'text-brand underline' : 'text-ink'
                }`}
              >
                {v.title}
              </span>
              <span className="text-sm text-muted">{v.positions}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
