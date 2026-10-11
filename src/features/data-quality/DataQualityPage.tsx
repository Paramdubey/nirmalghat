import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { t } from '../../constants/i18n'
import { buildCoverage, listEvents, PHASES, type CellStatus, type CoverageCell } from '../../lib/risk/events'
import { qualityStats } from '../../lib/risk/quality'
import { buildRanking } from '../../lib/risk/rank'
import { useData } from '../../store/data'
import { useUi } from '../../store/ui'

type Shown = CellStatus | 'partial'

/** Same shapes as the evidence charts, so a mark means the same thing everywhere. */
function Glyph({ status }: { status: Shown }) {
  const common = { fill: '#fff', stroke: '#000', strokeWidth: 1.5 }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      {status === 'sampled' && <circle cx="8" cy="8" r="5" fill="#000" />}
      {status === 'partial' && <><circle cx="8" cy="8" r="5" {...common} /><path d="M8 3a5 5 0 0 0 0 10Z" fill="#000" /></>}
      {status === 'BDL' && <path d="M8 2L14 8L8 14L2 8Z" {...common} />}
      {status === 'ND' && <path d="M8 2L14 13L2 13Z" {...common} />}
      {status === 'not sampled' && <circle cx="8" cy="8" r="5" {...common} />}
      {status === 'no table' && <path d="M3 3L13 13M13 3L3 13" stroke="#000" strokeWidth="1.5" />}
    </svg>
  )
}

const LABEL: Record<Shown, string> = {
  sampled: 'Sampled', partial: 'Partly sampled', BDL: 'BDL', ND: 'ND', 'not sampled': 'Not sampled', 'no table': 'No table in report',
}

const shown = (c: CoverageCell): Shown => (c.status === 'sampled' && c.missing > 0 ? 'partial' : c.status)

export function DataQualityPage() {
  const lang = useUi((s) => s.lang)
  const { results, issues, file, isSample } = useData()
  const q = useMemo(() => qualityStats(results), [results])
  const ranking = useMemo(() => buildRanking(results), [results])
  const events = useMemo(() => listEvents(results.map((r) => r.reading)), [results])
  const sites = q.bySite.map((s) => s.site)
  const coverage = useMemo(() => sites.map((site) => ({ site, cells: buildCoverage(results.map((r) => r.reading), site, events) })), [results, sites, events])
  const incomplete = ranking.filter((r) => r.gaps.length > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('dqTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('dqLead', lang)}</p>
        <p className="caption-mono mt-2 text-ink-3">{t('dqLoaded', lang, { file })}{isSample && ` · ${t('sampleData', lang)}`}</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {([['dqCardTotal', q.total], ['dqCardValid', q.valid], ['dqCardBdl', q.bdl], ['dqCardNd', q.nd], ['dqCardMissing', q.missing], ['dqCardWarnings', issues.length]] as const).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-divider p-4">
            <p className="caption-mono uppercase text-ink-3">{t(k, lang)}</p>
            <p className="tabular mt-1 text-3xl font-bold">{v.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold leading-8">{t('dqMatrixTitle', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('dqMatrixLead', lang)}</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-divider">
          <table className="w-full min-w-[900px] border-collapse text-center text-xs">
            <thead>
              <tr className="bg-surface">
                <th rowSpan={2} className="px-3 py-2 text-left text-sm">{t('fSite', lang)}</th>
                {events.map((e) => <th key={`${e.year}${e.festival}`} colSpan={3} className="border-l border-divider px-2 py-2 font-semibold">{e.year} {e.festival}</th>)}
              </tr>
              <tr className="bg-surface">
                {events.flatMap((e) => PHASES.map((p, i) => <th key={`${e.year}${e.festival}${p}`} className={`px-1 py-1 font-normal text-ink-3 ${i === 0 ? 'border-l border-divider' : ''}`}>{p}</th>))}
              </tr>
            </thead>
            <tbody>
              {coverage.map(({ site, cells }) => (
                <tr key={site} className="border-t border-divider">
                  <th scope="row" className="px-3 py-2 text-left text-sm font-medium">{site}</th>
                  {cells.map((c, i) => {
                    const s = shown(c)
                    const detail = c.total > 0 ? t('dqCellValid', lang, { a: c.valid, b: c.total }) : ''
                    return (
                      <td key={i} title={`${LABEL[s]}${detail ? ` — ${detail}` : ''}`} className={`px-1 py-2 ${i % 3 === 0 ? 'border-l border-divider' : ''}`}>
                        <span className="inline-flex justify-center"><Glyph status={s} /></span>
                        <span className="sr-only">{LABEL[s]}. {detail}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
          {([['sampled', 'dqSampled'], ['partial', 'dqPartial'], ['BDL', 'legBdl'], ['ND', 'legNd'], ['not sampled', 'legNotSampled'], ['no table', 'legNoTable']] as const).map(([s, k]) => (
            <li key={s} className="flex items-center gap-2"><Glyph status={s} />{t(k, lang)}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold leading-7">{t('dqBySiteTitle', lang)}</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-divider">
            <table className="tabular w-full min-w-[480px] text-left text-sm">
              <thead className="bg-surface"><tr>
                <th className="px-3 py-2">{t('fSite', lang)}</th>
                {(['dqColValid', 'dqCardBdl', 'dqCardNd', 'dqCardMissing', 'dqColTotal'] as const).map((k) => <th key={k} className="px-3 py-2 text-right">{t(k, lang)}</th>)}
              </tr></thead>
              <tbody>
                {q.bySite.map((s) => (
                  <tr key={s.site} className="border-t border-divider">
                    <th scope="row" className="px-3 py-2 font-medium">{s.site}</th>
                    <td className="px-3 py-2 text-right">{s.valid}</td><td className="px-3 py-2 text-right">{s.bdl}</td>
                    <td className="px-3 py-2 text-right">{s.nd}</td><td className="px-3 py-2 text-right font-bold">{s.missing}</td>
                    <td className="px-3 py-2 text-right">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold leading-7">{t('dqByParamTitle', lang)}</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-divider">
            <table className="tabular w-full min-w-[420px] text-left text-sm">
              <thead className="bg-surface"><tr>
                <th className="px-3 py-2">{t('tblParameter', lang)}</th>
                {PHASES.map((p) => <th key={p} className="px-3 py-2 text-right">{p}</th>)}
                <th className="px-3 py-2 text-right">{t('dqColTotal', lang)}</th>
              </tr></thead>
              <tbody>
                {q.missingByParameter.map((p) => (
                  <tr key={p.parameter} className="border-t border-divider">
                    <th scope="row" className="px-3 py-2 font-medium">{p.parameter}</th>
                    {PHASES.map((ph) => <td key={ph} className="px-3 py-2 text-right">{p.counts[ph]}</td>)}
                    <td className="px-3 py-2 text-right font-bold">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('dqIncompleteTitle', lang)}</h2>
        {incomplete.length === 0 ? <p className="mt-2 text-sm text-ink-2">{t('dqNoIncomplete', lang)}</p> : (
          <ul className="mt-3 space-y-3">
            {incomplete.map((r) => (
              <li key={r.site} className="rounded-lg border border-divider p-4">
                <p className="font-semibold">{r.site}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {r.gaps.map((g) => <li key={g.code + g.text} className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{g.text}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('dqNamesTitle', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('dqNamesLead', lang)}</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {q.names.map((n) => (
            <li key={n.site} className={`rounded-lg border p-4 ${n.confidence === 'medium' ? 'border-moderate bg-moderate-tint' : 'border-divider'}`}>
              <p className="flex items-start gap-2 font-semibold">
                {n.confidence === 'medium' && <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                {n.site}
              </p>
              <p className="text-xs text-ink-3">{n.waterBody} · {n.confidence === 'medium' ? t('evMatchMedium', lang) : t('evMatchHigh', lang)}</p>
              <p className="label-caps mt-2 !text-[11px]">{t('dqPrinted', lang)}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">{n.printed.map((p) => <li key={p}>{p}</li>)}</ul>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold leading-7">{t('dqNoLimitTitle', lang)}</h2>
          <p className="mt-1 text-sm text-ink-2">{t('dqNoLimitBody', lang)}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {q.noLimitParameters.map((p) => <li key={p} className="rounded-full bg-surface px-3 py-1 text-sm">{p}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold leading-7">{t('dqIssuesTitle', lang)}</h2>
          {issues.length === 0 ? <p className="mt-2 text-sm text-ink-2">{t('dqNoIssues', lang, { n: q.total })}</p> : (
            <ul className="mt-3 space-y-1 text-sm">
              {issues.map((i, k) => (
                <li key={k} className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span><b>{i.severity}</b>{i.csvLine ? ` · ${t('dqLine', lang, { n: i.csvLine })}` : ''}: {i.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('dqCodesTitle', lang)}</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-divider">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface"><tr>
              {(['dqCodeColCode', 'dqCodeColMeaning', 'dqCodeColTreatment'] as const).map((k) => <th key={k} className="px-3 py-2">{t(k, lang)}</th>)}
            </tr></thead>
            <tbody>
              {([['dqCodeBlank', 'dqCodeBlankMeaning', 'dqCodeBlankTreat'], ['dqCodeStar', 'dqCodeStarMeaning', 'dqCodeStarTreat'], ['BDL', 'dqCodeBdlMeaning', 'dqCodeBdlTreat'], ['ND', 'dqCodeNdMeaning', 'dqCodeNdTreat']] as const).map(([c, m, tr]) => (
                <tr key={m} className="border-t border-divider align-top">
                  <td className="caption-mono px-3 py-2 font-semibold">{c === 'BDL' || c === 'ND' ? c : t(c, lang)}</td>
                  <td className="px-3 py-2">{t(m, lang)}</td><td className="px-3 py-2">{t(tr, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('dqSourcesTitle', lang)}</h2>
        <ul className="mt-3 space-y-3">
          {q.sources.map((s) => (
            <li key={s.year} className="rounded-lg border border-divider p-4">
              <p className="font-semibold">{s.report}</p>
              <p className="tabular text-sm text-ink-2">{t('dqReadings', lang, { n: s.readings })} · {t('dqPages', lang, { list: s.pages.join(', ') })}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-3">{t('dqSourcesNote', lang)}</p>
      </section>
    </div>
  )
}
