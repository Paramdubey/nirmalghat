import { AlertTriangle, ArrowRight, Calculator, ListOrdered, MapPin, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { StatCard } from '../../components/StatCard'
import { actionText } from '../../constants/actionText'
import { LABEL_KEY, t } from '../../constants/i18n'
import { generateActions } from '../../lib/actions/generate'
import { overviewStats } from '../../lib/risk/overview'
import { buildRanking } from '../../lib/risk/rank'
import { summarise } from '../../lib/risk/summary'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import type { RiskLabel, SiteRisk } from '../../types'

const LABELS: RiskLabel[] = ['High priority', 'Moderate priority', 'Lower observed concern', 'Insufficient data']
const DOT: Record<RiskLabel, string> = {
  'High priority': 'bg-high', 'Moderate priority': 'bg-moderate', 'Lower observed concern': 'bg-ink', 'Insufficient data': 'hatch',
}
const BADGE: Record<RiskLabel, string> = {
  'High priority': 'bg-high-tint text-high', 'Moderate priority': 'bg-moderate-tint text-[#7a5300]',
  'Lower observed concern': 'bg-surface text-ink', 'Insufficient data': 'hatch text-ink',
}
const pct = (n: number, whole: number) => `${Math.round((n / whole) * 1000) / 10}%`

export function OverviewPage() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const selectSite = useRanking((s) => s.selectSite)
  const results = useData((s) => s.results)
  const { ranking, s, o, actions } = useMemo(() => {
    const ranking = buildRanking(results)
    const s = summarise(ranking, results)
    return { ranking, s, o: overviewStats(ranking, results, s), actions: generateActions(ranking, results) }
  }, [results])
  const years = { from: o.years.from, to: o.years.to }
  const breaches = { bod: s.bodAbove, do: s.doBelow, ph: s.phOut }

  function viewEvidence(site: string) {
    selectSite(site)
    setView('evidence')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="caption-mono rounded-full bg-black px-3 py-1 font-semibold uppercase text-white">{t('ovBadge', lang)}</span>
            <span className="caption-mono rounded-full bg-surface px-3 py-1 text-ink-2">{t('ovScope', lang, { g: s.ghatsAnalysed, r: o.readingCount.toLocaleString('en-IN'), ...years })}</span>
          </div>
          <h1 className="mt-4 text-[40px] font-bold leading-[48px] tracking-tight">{t('ovH1', lang)}</h1>
          <p className="mt-2 border-l-2 border-black pl-3 text-xl font-medium text-ink-2">{t('ovH1Alt', lang)}</p>
          <p className="mt-4 text-base leading-6 text-ink-2">{t('ovIntro', lang, { g: s.ghatsAnalysed })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { selectSite(ranking[0]?.site ?? null); setView('score') }} className="flex min-h-11 items-center gap-2 rounded-full border border-divider bg-white px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
            <Calculator className="size-4" aria-hidden />{t('ovScoreCta', lang)}
          </button>
          <button onClick={() => setView('map')} className="flex min-h-11 items-center gap-2 rounded-full border border-divider bg-white px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
            <MapPin className="size-4" aria-hidden />{t('mapCta', lang)}
          </button>
          <button onClick={() => setView('ranking')} className="flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
            <ListOrdered className="size-4" aria-hidden />{t('ovBtnRanking', lang)}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('ovScopeLabel', lang)} value={s.ghatsAnalysed} caption={t('ovScopeCaption', lang)}
          description={t('ovScopeDesc', lang, { list: o.waterBodies.join(', ') })}
          footer={[[t('ovReadings', lang), o.readingCount.toLocaleString('en-IN')], [t('ovPeriod', lang), `${o.years.from}–${o.years.to}`]]} />
        <StatCard label={t('ovCritLabel', lang)} accent={s.highPriority > 0} tag={s.highPriority > 0 ? t('ovAlert', lang) : undefined} tagTone="red"
          value={s.highPriority} caption={t('ovCritCaption', lang)}
          description={o.highSites.length > 0 ? o.highSites.join(', ') : t('ovNone', lang)}
          footer={[[t('ovShare', lang), pct(s.highPriority, s.ghatsAnalysed)], [t('ovBasis', lang), t('ovBasisValue', lang)]]} />
        <StatCard label={t('ovBreachLabel', lang)} tag={t('ovOutside', lang, { p: o.breachPercent })} tagTone="amber"
          value={s.totalBreaches} caption={t('ovBreachCaption', lang, { n: o.validCoreTests })}
          description={t('ovBreachDesc', lang)}
          footer={[[t('ovCriteria', lang), 'DO · BOD · pH'], [t('ovSplit', lang), t('ovSplitValue', lang, breaches)]]} />
        <StatCard label={t('ovGapLabel', lang)} tag={t('ovAuditGap', lang)} value={s.sitesWithGaps} caption={t('ovGapCaption', lang)}
          description={o.gapSites.length > 0 ? o.gapSites.join(', ') : t('ovNone', lang)}
          footer={[[t('ovUnsampled', lang), String(o.unsampledReadings)], [t('ovProtocol', lang), t('ovProtocolValue', lang)]]} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold leading-7"><span className="size-2 rounded-full bg-black" aria-hidden />{t('ovTopTitle', lang)}</h2>
            <button onClick={() => setView('ranking')} className="flex min-h-11 items-center gap-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
              {t('ovViewAll', lang, { n: s.ghatsAnalysed })}<ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
          <ol className="mt-3 space-y-4">
            {ranking.slice(0, 3).map((r, i) => (
              <SiteCard key={r.site} risk={r} rank={i + 1} onView={() => viewEvidence(r.site)}
                action={actions.find((a) => a.site === r.site && (a.kind === 'zero-do' || a.kind === 'resample'))} />
            ))}
          </ol>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-divider p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{t('ovMatrixTitle', lang)}</h2>
              <span className="caption-mono text-ink-3">{t('ovMatrixSites', lang, { n: s.ghatsAnalysed })}</span>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface" role="img" aria-label={LABELS.map((l) => `${l}: ${s.distribution[l]}`).join(', ')}>
              {LABELS.filter((l) => s.distribution[l] > 0).map((l) => <div key={l} className={DOT[l]} style={{ width: `${(s.distribution[l] / s.ghatsAnalysed) * 100}%` }} />)}
            </div>
            <ul className="mt-4 space-y-2">
              {LABELS.map((l) => (
                <li key={l} className="flex items-start gap-3 rounded-lg bg-surface p-3">
                  <span className={`mt-1 size-3 shrink-0 rounded-full border border-divider ${DOT[l]}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t(LABEL_KEY[l], lang)}</p>
                    <p className="text-xs text-ink-3">{o.sitesByLabel[l].join(', ') || '—'}</p>
                  </div>
                  <p className="tabular text-right text-sm font-semibold">{s.distribution[l]} <span className="font-normal text-ink-3">({pct(s.distribution[l], s.ghatsAnalysed)})</span></p>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-surface p-3 text-xs leading-5 text-ink-2">{t('ovMatrixNote', lang)}</p>
          </section>

          <section className="rounded-lg border border-divider p-5">
            <h2 className="text-base font-bold">{t('ovGovTitle', lang)}</h2>
            <ol className="mt-4 space-y-4">
              {([['01', 'ovGov1', 'ovGov1Body'], ['02', 'ovGov2', 'ovGov2Body'], ['03', 'ovGov3', 'ovGov3Body']] as const).map(([n, h, b]) => (
                <li key={n} className="flex gap-3">
                  <span className="caption-mono grid size-7 shrink-0 place-items-center rounded-md bg-surface font-semibold">{n}</span>
                  <div>
                    <p className="text-sm font-semibold">{t(h, lang)}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-2">{t(b, lang)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <p className="caption-mono border-t border-divider pt-4 text-ink-3">{t('ovFooter', lang, years)}</p>
    </div>
  )
}

function SiteCard({ risk: r, rank, onView, action }: { risk: SiteRisk; rank: number; onView: () => void; action: ReturnType<typeof generateActions>[number] | undefined }) {
  const lang = useUi((s) => s.lang)
  return (
    <li className="rounded-lg border border-divider p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs text-ink-3">
            <span className="caption-mono rounded bg-surface px-2 py-0.5 font-semibold text-ink">#{String(rank).padStart(2, '0')}</span>{r.waterBody}
          </p>
          <h3 className="mt-2 text-xl font-bold leading-7">{r.site}</h3>
        </div>
        <span className={`caption-mono inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold uppercase ${BADGE[r.label]}`}>
          <AlertTriangle className="size-3.5" aria-hidden />{t(LABEL_KEY[r.label], lang)}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-divider border-l-4 border-l-high bg-surface p-3 text-sm leading-5">
        <b>{t('ovConcern', lang)}:</b> {r.explanation}
      </div>
      {r.gaps.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg border border-moderate bg-moderate-tint p-3 text-sm">
          {r.gaps.map((g) => <li key={g.code + g.text} className="flex gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{g.text}</li>)}
        </ul>
      )}

      <dl className="tabular mt-4 grid gap-3 sm:grid-cols-3">
        <Metric term={t('ovMinDo', lang)} sub={t('ovRefDo', lang)}>
          <span className={r.lowestDo && r.lowestDo.value < 5 ? 'text-high' : ''}>{r.lowestDo ? r.lowestDo.value : '—'}</span> <small className="text-xs text-ink-3">mg/l</small>
        </Metric>
        <Metric term={t('ovMaxBod', lang)} sub={t('ovRefBod', lang)}>
          <span className={r.highestBod && r.highestBod.value > 3 ? 'text-high' : ''}>{r.highestBod ? r.highestBod.value : '—'}</span> <small className="text-xs text-ink-3">mg/l</small>
        </Metric>
        <Metric term={t('ovDataStatus', lang)} sub={r.gaps[0]?.text ?? ''}>
          <span className="text-base">{r.gaps.length > 0 ? t('ovDataGap', lang) : t('ovNoGaps', lang)}</span>
        </Metric>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm text-ink-2">
          {action && <><b>{t('ovProposed', lang)}:</b> {actionText(action.kind, 'title', lang, action.vars)}</>}
        </p>
        <button onClick={onView} className="flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          {t('viewEvidence', lang)}<ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  )
}

function Metric({ term, sub, children }: { term: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <dt className="caption-mono uppercase text-ink-3">{term}</dt>
      <dd className="mt-1 text-2xl font-bold">{children}</dd>
      <p className="mt-1 text-xs text-ink-3">{sub}</p>
    </div>
  )
}
