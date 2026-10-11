import { TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FilterChips } from '../../components/FilterChips'
import { actionText } from '../../constants/actionText'
import { t, type StringKey } from '../../constants/i18n'
import { generateActions, type ActionPriority, type ProposedAction } from '../../lib/actions/generate'
import { buildRanking } from '../../lib/risk/rank'
import { useActions } from '../../store/actions'
import { useData } from '../../store/data'
import { useUi } from '../../store/ui'

const PRIORITY: Record<ActionPriority, { key: StringKey; className: string }> = {
  high: { key: 'actPrioHigh', className: 'bg-high-tint text-high' },
  moderate: { key: 'actPrioModerate', className: 'bg-moderate-tint text-[#7a5300]' },
  data: { key: 'actPrioData', className: 'hatch text-ink' },
}

export function ActionsPage() {
  const lang = useUi((s) => s.lang)
  const results = useData((s) => s.results)
  const { included, toggle } = useActions()
  const [priorities, setPriorities] = useState<ActionPriority[]>([])

  const actions = useMemo(() => generateActions(buildRanking(results), results), [results])
  const shown = actions.filter((a) => priorities.length === 0 || priorities.includes(a.priority))
  const includedCount = actions.filter((a) => included.includes(a.id)).length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('actTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('actLead', lang)}</p>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-surface p-4 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('actDisclaimer', lang)}
      </p>

      <FilterChips label={t('actFilter', lang)} selected={priorities}
        options={(Object.keys(PRIORITY) as ActionPriority[]).map((p) => ({ value: p, label: t(PRIORITY[p].key, lang) }))}
        onToggle={(p) => setPriorities((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))} />
      <p className="tabular text-sm font-medium" aria-live="polite">{t('actIncluded', lang, { a: includedCount, b: actions.length })}</p>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-divider p-8 text-center text-ink-2">{t('actNoData', lang)}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => <ActionCard key={a.id} action={a} on={included.includes(a.id)} onToggle={() => toggle(a.id)} />)}
        </ul>
      )}
    </div>
  )
}

function ActionCard({ action: a, on, onToggle }: { action: ProposedAction; on: boolean; onToggle: () => void }) {
  const lang = useUi((s) => s.lang)
  const p = PRIORITY[a.priority]
  const title = actionText(a.kind, 'title', lang, a.vars)
  return (
    <li className="rounded-lg border border-divider p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.className}`}>{t(p.key, lang)}</span>
        <span className="rounded-full border border-dashed border-ink-3 px-3 py-1 text-sm font-semibold">{t('actStamp', lang)}</span>
      </div>
      <h2 className="mt-3 text-lg font-bold leading-6">{title}</h2>
      <p className="mt-2 text-sm leading-5 text-ink-2">{actionText(a.kind, 'reason', lang, a.vars)}</p>

      {a.supporting.length > 0 && (
        <div className="mt-3">
          <h3 className="label-caps !text-[11px]">{t('actSupporting', lang)}</h3>
          <ul className="tabular mt-1 space-y-1 text-sm">
            {a.supporting.map((s) => (
              <li key={`${s.parameter}${s.year}${s.festival}${s.phase}`}>
                <b>{s.parameter} {s.valueText}</b> — {s.year} {s.festival}, {s.phase}, {t('actPage', lang)} {s.sourcePage}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="label-caps !text-[11px]">{t('actTeam', lang)}</dt>
          <dd className="mt-1">{actionText(a.kind, 'team', lang, a.vars)}</dd>
        </div>
        <div>
          <dt className="label-caps !text-[11px]">{t('actVerify', lang)}</dt>
          <dd className="mt-1">{actionText(a.kind, 'verify', lang, a.vars)}</dd>
        </div>
      </dl>

      <label className="mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" role="switch" checked={on} onChange={onToggle} className="size-5 accent-black" />
        {t('actInclude', lang)}
      </label>
    </li>
  )
}
