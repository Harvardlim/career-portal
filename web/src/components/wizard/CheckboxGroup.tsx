export function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink">{label}</span>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2.5 text-sm text-ink-600"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="size-[22px] shrink-0 rounded-[3px] border border-brand-200 text-brand accent-brand"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}
