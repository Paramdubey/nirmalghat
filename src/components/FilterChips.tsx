interface Option<T> {
  value: T
  label: string
}

/** Multi-select pill chips. Empty selection means "no restriction". */
export function FilterChips<T extends string | number>({ label, options, selected, onToggle }: {
  label: string
  options: Option<T>[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="label-caps mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
              className={`min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${on ? 'bg-black text-white' : 'bg-surface text-ink hover:bg-divider'}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
