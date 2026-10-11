import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { FilterChips } from '../../components/FilterChips'
import { RiskBadge } from '../../components/RiskBadge'
import { LABEL_KEY, t, type StringKey } from '../../constants/i18n'
import { WEIGHT_RATIONALE } from '../../constants/weights'
import { buildRanking } from '../../lib/risk/rank'
import { useData } from '../../store/data'
import { hasActiveFilters, useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import type { Phase, RiskLabel, SiteRisk, SortKey } from '../../types'

const LABELS: RiskLabel[] = ['High priority', 'Moderate priority', 'Lower observed concern', 'Insufficient data']
const PHASE_KEY: Record<Phase, StringKey> = { pre: 'phasePre', during: 'phaseDuring', after: 'phaseAfter' }
const SORTS: { value: SortKey; label: StringKey }[] = [
  { value: 'priority', label: 'sortPriority' }, { value: 'latest', label: 'sortLatest' }, { value: 'breaches', label: 'sortBreaches' },
]
// Only these have a Class B limit, so only they can be filtered on.
const CHECKED = ['Dissolved oxygen', 'BOD', 'pH']

export function RankingPage() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const results = useData((s) => s.results)
  const { filters, sort, toggle, setUncertainOnly, setSort, clearFilters, selectSite } = useRanking()

  const everything = useMemo(() => buildRanking(results), [results])
  const ranking = useMemo(() => buildRanking(results, filters, sort), [results, filters, sort])
  const options = useMemo(() => ({
    sites: [...new Set(results.map((r) => r.reading.site))].sort(),
    years: [...new Set(results.map((r) => r.reading.year))].sort(),
    festivals: [...new Set(results.map((r) => r.reading.festival))].sort(),
  }), [results])
  const active = hasActiveFilters(filters)
  const shown = new Set(ranking.map((r) => r.site))
  const hidden = everything.filter((r) => !shown.has(r.site)).map((r) => r.site)

  function viewEvidence(site: string) {
    selectSite(site)
    setView('evidence')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('rankTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('rankLead', lang)}</p>
      </div>

      <section aria-label={t('filters', lang)} className="space-y-5 rounded-lg border border-divider p-5">
        <FilterChips label={t('fSite', lang)} options={options.sites.map((v) => ({ value: v, label: v }))} selected={filters.sites} onToggle={(v) => toggle('sites', v)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FilterChips label={t('fFestival', lang)} options={options.festivals.map((v) => ({ value: v, label: v }))} selected={filters.festivals} onToggle={(v) => toggle('festivals', v)} />
          <FilterChips label={t('fYear', lang)} options={options.years.map((v) => ({ value: v, label: String(v) }))} selected={filters.years} onToggle={(v) => toggle('years', v)} />
          <FilterChips label={t('fPhase', lang)} options={(['pre', 'during', 'after'] as Phase[]).map((v) => ({ value: v, label: t(PHASE_KEY[v], lang) }))} selected={filters.phases} onToggle={(v) => toggle('phases', v)} />
          <div>
            <FilterChips label={t('fParameter', lang)} options={CHECKED.map((v) => ({ value: v, label: v }))} selected={filters.parameters} onToggle={(v) => toggle('parameters', v)} />
            <p className="mt-2 text-xs text-ink-3">{t('fParameterNote', lang)}</p>
          </div>
        </div>
        <FilterChips label={t('fLabel', lang)} options={LABELS.map((v) => ({ value: v, label: t(LABEL_KEY[v], lang) }))} selected={filters.labels} onToggle={(v) => toggle('labels', v)} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={filters.uncertainOnly} onChange={(e) => setUncertainOnly(e.target.checked)} className="size-5 accent-black" />
            {t('fUncertain', lang)}
          </label>
          {active && (
            <button onClick={clearFilters} className="min-h-11 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
              {t('clearFilters', lang)}
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tabular text-sm font-medium" aria-live="polite">{t('showing', lang, { a: ranking.length, b: everything.length })}</p>
        <div role="radiogroup" aria-label={t('sortBy', lang)} className="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
          {SORTS.map((o) => (
            <button
              key={o.value} role="radio" aria-checked={sort === o.value} onClick={() => setSort(o.value)}
              className={`min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-black ${sort === o.value ? 'bg-black text-white' : ''}`}
            >
              {t(o.label, lang)}
            </button>
          ))}
        </div>
      </div>
      {active && <p className="text-sm text-ink-2">{t('filterNote', lang)}</p>}
      {hidden.length > 0 && <p className="rounded-lg bg-surface p-3 text-sm">{t('hiddenNote', lang, { names: hidden.join(', ') })}</p>}

      {ranking.length === 0 ? (
        <div className="rounded-lg border border-divider p-8 text-center">
          <p className="text-lg font-semibold">{t('emptyTitle', lang)}</p>
          <button onClick={clearFilters} className="mt-4 min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white">{t('clearFilters', lang)}</button>
        </div>
      ) : (
        <ol className="space-y-3">
          {ranking.map((r, i) => <RankRow key={r.site} risk={r} rank={i + 1} onView={() => viewEvidence(r.site)} />)}
        </ol>
      )}

      <details className="rounded-lg border border-divider p-5">
        <summary className="cursor-pointer text-lg font-bold">{t('howTitle', lang)}</summary>
        <p className="mt-3 text-sm text-ink-2">{t('howIntro', lang)}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-divider"><th className="py-2 pr-4">&nbsp;</th><th className="py-2 pr-4">{t('howWeight', lang)}</th><th className="py-2">{t('howWhy', lang)}</th></tr></thead>
            <tbody>
              {WEIGHT_RATIONALE.map((w) => (
                <tr key={w.name} className="border-b border-divider align-top">
                  <th scope="row" className="py-2 pr-4 font-semibold">{w.name}</th>
                  <td className="py-2 pr-4">{w.value}</td>
                  <td className="py-2 text-ink-2">{w.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 font-bold">{t('howBreakdown', lang)}</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="tabular w-full text-left text-sm">
            <thead><tr className="border-b border-divider">
              <th className="py-2 pr-4">{t('fSite', lang)}</th>
              {(['bkDo', 'bkBod', 'bkPh', 'bkRecurrence', 'bkTotal'] as const).map((k) => <th key={k} className="py-2 pr-4 text-right">{t(k, lang)}</th>)}
            </tr></thead>
            <tbody>
              {everything.map((r) => (
                <tr key={r.site} className="border-b border-divider">
                  <th scope="row" className="py-2 pr-4 font-medium">{r.site}</th>
                  <td className="py-2 pr-4 text-right">{r.breakdown.doPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.bodPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.phPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.recurrencePoints}</td>
                  <td className="py-2 pr-4 text-right font-bold">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-2">{t('howLabelsNote', lang)}</p>
      </details>
    </div>
  )
}

function RankRow({ risk: r, rank, onView }: { risk: SiteRisk; rank: number; onView: () => void }) {
  const lang = useUi((s) => s.lang)
  const latest = r.latestObservation
  return (
    <li className="rounded-lg border border-divider p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">{rank}</span>
          <div>
            <p className="text-lg font-semibold leading-6">{r.site}</p>
            <p className="text-sm text-ink-3">{r.waterBody}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular text-sm text-ink-2">{t('scoreLabel', lang, { n: r.score })}</span>
          <RiskBadge label={r.label} />
        </div>
      </div>

      <dl className="tabular mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <Stat term={t('colDo', lang)}>
          {r.validDo === 0 ? t('noValid', lang) : <>{t('doCell', lang, { a: r.doBreachCount, b: r.validDo })}{r.lowestDo && <><br /><span className="text-ink-3">{t('lowest', lang, { v: r.lowestDo.value })}</span></>}</>}
        </Stat>
        <Stat term={t('colBod', lang)}>
          {r.validBod === 0 ? t('noValid', lang) : <>{t('bodCell', lang, { a: r.bodBreachCount, b: r.validBod })}{r.highestBod && <><br /><span className="text-ink-3">{t('highest', lang, { v: r.highestBod.value })}</span></>}</>}
        </Stat>
        <Stat term={t('colBreaches', lang)}><span className="text-lg font-bold">{r.breachCount}</span></Stat>
        <Stat term={t('colLatest', lang)}>{latest ? `${latest.year} ${latest.festival}, ${latest.phase}` : '—'}{latest && <><br /><span className="text-ink-3">p. {latest.sourcePage}</span></>}</Stat>
        <Stat term={t('colComplete', lang)}>
          <span className="text-lg font-bold">{Math.round(r.completeness * 100)}%</span>
          <br /><span className="text-ink-3">{t('completenessNote', lang)}</span>
        </Stat>
      </dl>

      <p className="mt-4 text-sm leading-5 text-ink-2">{r.explanation}</p>
      {r.gaps.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {r.gaps.map((g) => (
            <li key={g.code + g.text} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{g.text}</span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onView} className="mt-4 min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
        {t('viewEvidence', lang)}
      </button>
    </li>
  )
}

function Stat({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps !text-[11px]">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
