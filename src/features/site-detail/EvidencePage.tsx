import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FilterChips } from '../../components/FilterChips'
import { RiskBadge } from '../../components/RiskBadge'
import { NO_LIMIT_TEXT } from '../../constants/cpcb'
import { RESULT_KEY, t } from '../../constants/i18n'
import { sourceReport } from '../../constants/sources'
import { compareObservations, listEvents } from '../../lib/risk/events'
import { isBreach } from '../../lib/risk/evaluate'
import { buildRanking } from '../../lib/risk/rank'
import { buildSeries } from '../../lib/risk/series'
import { FieldReportView } from '../../components/FieldReportView'
import { useOfficerData } from '../../store/agents'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import type { ReadingResult } from '../../types'
import { ParamChart } from './ParamChart'

function citation(r: ReadingResult): string {
  const x = r.reading
  const value = x.status === 'valid' ? `${x.value}${x.unit ? ` ${x.unit}` : ''}` : r.result
  return `${sourceReport(x.year)}, PDF page ${x.sourcePage} — ${x.siteAsPrinted} (${x.site}), ${x.parameterAsPrinted}, ${x.year} ${x.festival}, ${x.phase}: ${value} (as printed: ${x.valueAsPrinted || 'blank'}). Units assumed, not printed in the report.`
}

export function EvidencePage() {
  const lang = useUi((s) => s.lang)
  const results = useData((s) => s.results)
  const { selectedSite, selectSite } = useRanking()
  const assignments = useOfficerData((s) => s.assignments)
  const [params, setParams] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const ranking = useMemo(() => buildRanking(results), [results])
  const events = useMemo(() => listEvents(results.map((r) => r.reading)), [results])
  const site = ranking.find((r) => r.site === selectedSite) ?? ranking[0]
  const parameters = useMemo(() => [...new Set(results.map((r) => r.reading.parameter))], [results])

  const rows = useMemo(
    () => results
      .filter((r) => r.reading.site === site.site && (params.length === 0 || params.includes(r.reading.parameter)))
      .sort((a, b) => compareObservations(a.reading, b.reading) || parameters.indexOf(a.reading.parameter) - parameters.indexOf(b.reading.parameter)),
    [results, site.site, params, parameters],
  )
  const series = (parameter: string) => buildSeries(results, site.site, parameter, events)
  const fieldReports = assignments.filter((a) => a.site === site.site && a.submission)
  const printedNames = [...new Set(results.filter((r) => r.reading.site === site.site).map((r) => r.reading.siteAsPrinted))]
  const latest = site.latestObservation

  async function copy(r: ReadingResult) {
    try {
      await navigator.clipboard.writeText(citation(r))
      setCopied(r.reading.csvLine)
      setTimeout(() => setCopied((c) => (c === r.reading.csvLine ? null : c)), 1500)
    } catch {
      setCopied(null) // clipboard blocked: leave the button unchanged rather than claim success
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('evTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('evLead', lang)}</p>
      </div>

      <label className="block">
        <span className="label-caps">{t('evPick', lang)}</span>
        <select value={site.site} onChange={(e) => selectSite(e.target.value)} className="field mt-2 max-w-xl appearance-none pr-4">
          {ranking.map((r) => <option key={r.site} value={r.site}>{r.site}</option>)}
        </select>
      </label>

      <section className="rounded-lg border border-divider p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold leading-8">{site.site}</h2>
            <p className="text-sm text-ink-3">{site.waterBody}</p>
          </div>
          <RiskBadge label={site.label} />
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Item term={t('evPrintedNames', lang)}>{printedNames.join(' · ')}</Item>
          <Item term={t('evMatch', lang)}>
            {site.matchConfidence === 'medium'
              ? <span className="flex items-start gap-2 font-medium"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{t('evMatchMedium', lang)}</span>
              : t('evMatchHigh', lang)}
          </Item>
          <Item term={t('evLatest', lang)}>{latest ? `${latest.year} ${latest.festival}, ${latest.phase} (PDF page ${latest.sourcePage})` : '—'}</Item>
          <Item term={t('evComplete', lang)}><span className="tabular">{Math.round(site.completeness * 100)}%</span></Item>
        </dl>
        <h3 className="label-caps mt-5">{t('evLimits', lang)}</h3>
        {site.gaps.length === 0
          ? <p className="mt-2 text-sm text-ink-2">{t('evNoLimits', lang)}</p>
          : <ul className="mt-2 space-y-1 text-sm">{site.gaps.map((g) => <li key={g.code + g.text} className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{g.text}</li>)}</ul>}
        <p className="mt-4 text-xs text-ink-3">{t('evUnits', lang)}</p>
      </section>

      <section className="space-y-4">
        <ParamChart title={t('chartDo', lang)} points={series('Dissolved oxygen')} reference={{ kind: 'line', y: 5, label: t('refDo', lang) }} />
        <ParamChart title={t('chartBod', lang)} points={series('BOD')} reference={{ kind: 'line', y: 3, label: t('refBod', lang) }} />
        <ParamChart title={t('chartPh', lang)} points={series('pH')} reference={{ kind: 'band', low: 6.5, high: 8.5, label: t('refPh', lang) }} />
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
          <li className="flex items-center gap-2"><svg width="14" height="14"><circle cx="7" cy="7" r="4.5" /></svg>{t('legWithin', lang)}</li>
          <li className="flex items-center gap-2"><svg width="14" height="14"><rect x="2" y="2" width="10" height="10" fill="#e11900" stroke="#000" strokeWidth="1.5" /></svg>{t('legBreach', lang)}</li>
          <li className="flex items-center gap-2"><svg width="14" height="14"><path d="M7 1L13 7L7 13L1 7Z" fill="#fff" stroke="#000" strokeWidth="1.5" /></svg>{t('legBdl', lang)}</li>
          <li className="flex items-center gap-2"><svg width="14" height="14"><path d="M7 1L13 12L1 12Z" fill="#fff" stroke="#000" strokeWidth="1.5" /></svg>{t('legNd', lang)}</li>
          <li className="flex items-center gap-2"><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#fff" stroke="#000" strokeWidth="1.5" /></svg>{t('legNotSampled', lang)}</li>
          <li className="flex items-center gap-2"><svg width="14" height="14"><path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="1.5" /></svg>{t('legNoTable', lang)}</li>
        </ul>
        <p className="text-sm text-ink-2">{t('chartGapNote', lang)}</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold leading-8">{t('tblTitle', lang)}</h2>
          <p className="tabular text-sm text-ink-2">{t('rowsShown', lang, { n: rows.length })}</p>
        </div>
        <FilterChips label={t('fParameter', lang)} options={parameters.map((v) => ({ value: v, label: v }))} selected={params}
          onToggle={(v) => setParams((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))} />
        <div className="max-h-[560px] overflow-auto rounded-lg border border-divider">
          <table className="tabular w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {(['tblParameter', 'tblValue', 'tblPrinted', 'tblCriterion', 'tblResult', 'tblYear', 'tblFestival', 'tblStage', 'tblPage', 'tblReport', 'tblCite'] as const)
                  .map((k) => <th key={k} className="whitespace-nowrap px-3 py-3 font-semibold">{t(k, lang)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const x = r.reading
                return (
                  <tr key={x.csvLine} className="border-t border-divider align-top">
                    <td className="px-3 py-2">{x.parameter}</td>
                    <td className="px-3 py-2">{x.status === 'valid' ? `${x.value}${x.unit ? ` ${x.unit}` : ''}` : '—'}</td>
                    <td className="px-3 py-2">{x.valueAsPrinted || <span className="text-ink-3">blank</span>}</td>
                    <td className="px-3 py-2">{r.criterion ? r.criterion.label : NO_LIMIT_TEXT}</td>
                    <td className={`px-3 py-2 ${isBreach(r.result) ? 'font-bold' : ''}`}>
                      {isBreach(r.result) && <TriangleAlert className="mr-1 inline size-4 text-high" aria-hidden />}
                      {t(RESULT_KEY[r.result], lang)}
                    </td>
                    <td className="px-3 py-2">{x.year}</td>
                    <td className="px-3 py-2">{x.festival}</td>
                    <td className="px-3 py-2">{x.phase}</td>
                    <td className="px-3 py-2">{x.sourcePage}</td>
                    <td className="px-3 py-2">{sourceReport(x.year)}</td>
                    <td className="px-3 py-1">
                      <button onClick={() => copy(r)} aria-label={t('copyCite', lang)} className="grid size-11 place-items-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-black">
                        {copied === x.csvLine ? <Check className="size-4" aria-label={t('copied', lang)} /> : <Copy className="size-4" />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-bold leading-8">{t('evFieldTitle', lang)}</h2>
        <p className="flex items-start gap-2 rounded-lg bg-surface p-3 text-sm"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{t('fieldUnverified', lang)}</p>
        {fieldReports.length === 0 ? <p className="text-sm text-ink-2">{t('evFieldNone', lang)}</p> : (
          <ul className="space-y-3">
            {fieldReports.map((a) => (
              <li key={a.id} className="rounded-lg border border-divider p-4">
                <p className="text-sm text-ink-2">{t('evFieldBy', lang, { agent: a.agentName ?? '', date: a.submission!.report.sampledOn, stage: a.submission!.report.stage })}</p>
                <FieldReportView report={a.submission!.report} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Item({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps !text-[11px]">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
