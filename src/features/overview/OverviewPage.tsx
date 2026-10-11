import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { RiskBadge } from '../../components/RiskBadge'
import { StatCard } from '../../components/StatCard'
import { LABEL_KEY, t } from '../../constants/i18n'
import { buildRanking } from '../../lib/risk/rank'
import { summarise } from '../../lib/risk/summary'
import { useData } from '../../store/data'
import { useUi } from '../../store/ui'
import type { RiskLabel } from '../../types'

const LABELS: RiskLabel[] = ['High priority', 'Moderate priority', 'Lower observed concern', 'Insufficient data']
const SEGMENT: Record<RiskLabel, string> = {
  'High priority': 'bg-high', 'Moderate priority': 'bg-moderate', 'Lower observed concern': 'bg-info', 'Insufficient data': 'hatch',
}

export function OverviewPage() {
  const lang = useUi((s) => s.lang)
  const results = useData((s) => s.results)
  const ranking = useMemo(() => buildRanking(results), [results])
  const s = useMemo(() => summarise(ranking, results), [ranking, results])

  const findings = [
    t('findDo', lang, { a: s.doBelow, b: s.doValid }),
    t('findBod', lang, { a: s.bodAbove, b: s.bodValid }),
    ...(s.zeroDoCount > 0 ? [t('findZero', lang, { a: s.zeroDoCount, b: s.zeroDoSites.join(', ') })] : []),
    t('findGaps', lang, { a: s.sitesWithGaps, b: s.ghatsAnalysed }),
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('overviewTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('overviewLead', lang)}</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('statGhats', lang)} value={s.ghatsAnalysed} sub={t('statGhatsSub', lang)} />
        <StatCard label={t('statHigh', lang)} value={s.highPriority} sub={t('statHighSub', lang, { n: s.ghatsAnalysed })} />
        <StatCard label={t('statBreaches', lang)} value={s.totalBreaches} sub={t('statBreachesSub', lang)} />
        <StatCard label={t('statGaps', lang)} value={s.sitesWithGaps} sub={t('statGapsSub', lang, { n: s.ghatsAnalysed })} />
      </section>

      <section className="rounded-lg border border-divider p-5">
        <h2 className="text-2xl font-bold leading-8">{t('headlineTitle', lang)}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-6">
          {findings.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold leading-8">{t('topTitle', lang)}</h2>
        <ol className="mt-3 space-y-3">
          {ranking.slice(0, 3).map((r, i) => (
            <li key={r.site} className="rounded-lg border border-divider p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="tabular grid size-8 place-items-center rounded-full bg-black text-sm font-bold text-white">{i + 1}</span>
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
              <p className="mt-3 text-sm leading-5 text-ink-2">{r.explanation}</p>
              {r.gaps.length > 0 && (
                <p className="mt-3 flex items-start gap-2 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span><b>{t('dataLimits', lang)}:</b> {r.gaps.map((g) => g.text).join('; ')}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-divider p-5">
        <h2 className="text-2xl font-bold leading-8">{t('distTitle', lang)}</h2>
        <div className="mt-4 flex h-6 overflow-hidden rounded-full bg-surface" role="img" aria-label={LABELS.map((l) => `${l}: ${s.distribution[l]}`).join(', ')}>
          {LABELS.filter((l) => s.distribution[l] > 0).map((l) => (
            <div key={l} className={SEGMENT[l]} style={{ width: `${(s.distribution[l] / s.ghatsAnalysed) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {LABELS.map((l) => (
            <li key={l} className="flex items-center gap-3 text-sm">
              <span className={`size-3 rounded-full border border-divider ${SEGMENT[l]}`} aria-hidden />
              <span className="flex-1">{t(LABEL_KEY[l], lang)}</span>
              <span className="tabular font-semibold">{s.distribution[l]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-surface p-5">
        <h2 className="text-xl font-bold leading-7">{t('caveatsTitle', lang)}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-ink-2">
          {(['caveat1', 'caveat2', 'caveat3', 'caveat4'] as const).map((k) => <li key={k}>{t(k, lang)}</li>)}
        </ul>
      </section>
    </div>
  )
}
