const columns: { title: string; type: 'radio' | 'checkbox'; options: string[] }[] = [
  {
    title: 'Experience',
    type: 'radio',
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
  },
  {
    title: 'Salery',
    type: 'radio',
    options: [
      '$50 - $1000',
      '$1000 - $2000',
      '$3000 - $4000',
      '$4000 - $6000',
      '$6000 - $8000',
      '$8000 - $10000',
      '$10000 - $15000',
      '$15000+',
    ],
  },
  {
    title: 'Job Type',
    type: 'checkbox',
    options: [
      'All',
      'Full Time',
      'Part Time',
      'Internship',
      'Remote',
      'Temporary',
      'Contract Base',
    ],
  },
  {
    title: 'Education',
    type: 'checkbox',
    options: [
      'All',
      'High School',
      'Intermediate',
      'Graduation',
      'Master Degree',
      'Bachelor Degree',
    ],
  },
  {
    title: 'Job Level',
    type: 'radio',
    options: ['Entry Level', 'Mid Level', 'Expert Level'],
  },
]

export function AdvanceFilterPanel() {
  return (
    <div className="mt-3 rounded-lg border border-line-soft bg-surface p-8 shadow-[0px_12px_40px_rgba(0,44,109,0.04)]">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-line">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-4 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <p className="text-lg font-medium text-ink">{col.title}</p>
            <div className="flex flex-col gap-3">
              {col.options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 text-sm text-ink-600"
                >
                  <input
                    type={col.type}
                    name={col.type === 'radio' ? col.title : `${col.title}-${opt}`}
                    className={`size-[22px] shrink-0 border border-brand-200 text-brand accent-brand ${
                      col.type === 'radio' ? 'rounded-full' : 'rounded-[3px]'
                    }`}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
