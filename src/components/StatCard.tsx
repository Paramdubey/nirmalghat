interface Props {
  label: string
  tag?: string
  tagTone?: 'red' | 'amber' | 'grey'
  value: number | string
  caption: string
  description: string
  footer: [string, string][]
  accent?: boolean
}

const TONE = { red: 'bg-high-tint text-high', amber: 'bg-moderate-tint text-[#7a5300]', grey: 'bg-surface text-ink-2' }

/** Overview summary card: mono label, big number, short description, two key/value footer lines. */
export function StatCard({ label, tag, tagTone = 'grey', value, caption, description, footer, accent }: Props) {
  return (
    <div className="flex flex-col rounded-lg border border-divider bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <p className={`caption-mono font-semibold uppercase ${accent ? 'text-high' : 'text-ink-2'}`}>{label}</p>
        {tag && <span className={`caption-mono rounded-full px-2 py-0.5 font-semibold uppercase ${TONE[tagTone]}`}>{tag}</span>}
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="tabular text-[40px] font-bold leading-[48px]">{value}</span>
        <span className="text-sm font-medium text-ink-2">{caption}</span>
      </p>
      <p className="mt-2 flex-1 text-sm leading-5 text-ink-3">{description}</p>
      <dl className="caption-mono mt-4 space-y-1 border-t border-divider pt-3">
        {footer.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-ink-3">{k}</dt>
            <dd className="tabular text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
