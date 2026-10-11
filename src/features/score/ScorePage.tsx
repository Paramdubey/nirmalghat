import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { RiskBadge } from '../../components/RiskBadge'
import { t } from '../../constants/i18n'
import { HIGH_PRIORITY_MIN, MODERATE_PRIORITY_MIN, RECURRENCE_PER_EVENT, WEIGHT_RATIONALE } from '../../constants/weights'
import { buildRanking } from '../../lib/risk/rank'
import { contextFrom, explainScore } from '../../lib/risk/score'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'

const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

/** Step-by-step score for one ghat: every breach with its weight, severity, recency and points, the page it came from, and the total. */
export function ScorePage() {
  const lang = useUi((s) => s.lang)
  const results = useData((s) => s.results)
  const { selectedSite, selectSite } = useRanking()
  const ranking = useMemo(() => buildRanking(results), [results])
  const site = ranking.find((r) => r.site === selectedSite) ?? ranking[0]
  const x = useMemo(() => explainScore(site.site, results, contextFrom(results)), [site.site, results])
  const groups = x.byParameter.filter((g) => g.count > 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('scTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('scLead', lang)}</p>
      </div>

      <label className="block">
        <span className="label-caps">{t('evPick', lang)}</span>
        <select value={site.site} onChange={(e) => selectSite(e.target.value)} className="field mt-2 max-w-xl appearance-none pr-4">
          {ranking.map((r) => <option key={r.site} value={r.site}>{r.site}</option>)}
        </select>
      </label>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-divider p-5">
        <div>
          <h2 className="text-2xl font-bold leading-8">{site.site}</h2>
          <p className="text-sm text-ink-3">{site.waterBody} · {t('scBasedOn', lang, { n: site.readingsUsed })}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="caption-mono uppercase text-ink-3">{t('scTotal', lang)}</p>
            <p className="tabular text-[40px] font-bold leading-[48px]">{f1(x.total)}</p>
          </div>
          <RiskBadge label={x.label} />
        </div>
      </section>

      <p className="rounded-lg bg-surface p-4 text-sm font-medium">{t('scFormula', lang)}</p>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {WEIGHT_RATIONALE.slice(0, 3).map((w) => (
          <li key={w.name} className="rounded-lg border border-divider p-3"><b>{w.name}:</b> {w.value}. <span className="text-ink-2">{w.why}</span></li>
        ))}
        <li className="rounded-lg border border-divider p-3 text-ink-2">{t('scRecencyNote', lang, { newest: x.newestYear })}</li>
      </ul>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('scStep1', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('scStep1Note', lang)}</p>
        {groups.length === 0 ? <p className="mt-3 text-sm text-ink-2">{t('scNoBreaches', lang)}</p> : groups.map((g) => (
          <div key={g.parameter} className="mt-4">
            <h3 className="font-bold">{t('scSubtotal', lang, { parameter: g.parameter, count: g.count, points: f1(g.points) })}</h3>
            <div className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-divider">
              <table className="tabular w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-surface"><tr>
                  {(['scColReading', 'scColWhen', 'scColWeight', 'scColSeverity', 'scColRecency', 'scColPoints'] as const).map((k) => <th key={k} className="whitespace-nowrap px-3 py-2 font-semibold">{t(k, lang)}</th>)}
                </tr></thead>
                <tbody>
                  {x.rows.filter((r) => r.parameter === g.parameter).map((r, i) => (
                    <tr key={i} className="border-t border-divider">
                      <td className="px-3 py-2 font-medium">{r.value}{r.unit ? ` ${r.unit}` : ''}</td>
                      <td className="px-3 py-2">{r.year} {r.festival}, {r.phase} · p. {r.sourcePage}</td>
                      <td className="px-3 py-2">{r.weight}</td>
                      <td className="px-3 py-2">{r.severity.toFixed(2)}</td>
                      <td className="px-3 py-2">{r.recency.toFixed(1)}</td>
                      <td className="px-3 py-2 font-bold">{f1(r.points)} <span className="font-normal text-ink-3">({r.weight} × {r.severity.toFixed(2)} × {r.recency.toFixed(1)})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-divider p-5">
        <h2 className="text-xl font-bold leading-7">{t('scStepScale', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('scScaleNote', lang, { ref: x.referenceReadings })}</p>
        <p className="tabular mt-2 text-lg font-bold">{t('scScaleLine', lang, { raw: f1(x.rawReadingPoints), n: x.validReadings, ref: x.referenceReadings, score: f1(x.readingScore) })}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('scStep2', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('scStep2Note', lang, { each: RECURRENCE_PER_EVENT })}</p>
        <ul className="mt-2 flex flex-wrap gap-2">{x.events.map((e) => <li key={e} className="rounded-full bg-surface px-3 py-1 text-sm">{e}</li>)}</ul>
        <p className="tabular mt-2 text-sm font-bold">{t('scStep2Sum', lang, { raw: x.recurrenceRaw, with: x.eventsWithData, all: x.eventsAll, points: f1(x.recurrencePoints) })}</p>
      </section>

      <section className="rounded-lg border border-divider p-5">
        <h2 className="text-xl font-bold leading-7">{t('scStep3', lang)}</h2>
        <p className="tabular mt-2 text-lg font-bold">{t('scSum', lang, { a: f1(x.readingScore), b: f1(x.recurrencePoints), total: f1(x.total) })}</p>
        <div className="relative mt-4 h-3 rounded-full bg-surface" aria-hidden>
          <div className="h-3 rounded-full bg-black" style={{ width: `${Math.min(100, (x.total / (HIGH_PRIORITY_MIN * 1.4)) * 100)}%` }} />
          <span className="absolute -top-1 h-5 w-0.5 bg-ink-3" style={{ left: `${(MODERATE_PRIORITY_MIN / (HIGH_PRIORITY_MIN * 1.4)) * 100}%` }} />
          <span className="absolute -top-1 h-5 w-0.5 bg-ink-3" style={{ left: `${(HIGH_PRIORITY_MIN / (HIGH_PRIORITY_MIN * 1.4)) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-2">{t('scLabelRule', lang, { high: HIGH_PRIORITY_MIN, moderate: MODERATE_PRIORITY_MIN })}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold leading-7">{t('scNotCounted', lang)}</h2>
        <p className="tabular text-sm">{t('scNotCountedBody', lang, x.notCounted)}</p>
        <p className="flex items-start gap-2 text-sm text-ink-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{t('scGapsNote', lang)}</p>
        {site.gaps.length > 0 && <ul className="list-disc pl-9 text-sm">{site.gaps.map((g) => <li key={g.code + g.text}>{g.text}</li>)}</ul>}
      </section>
    </div>
  )
}
