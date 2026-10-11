import { AlertTriangle, ArrowLeft, CircleHelp, Info, TriangleAlert, Waves } from 'lucide-react'
import { useMemo } from 'react'
import { LABEL_KEY, t } from '../../constants/i18n'
import { groupByWaterBody } from '../../lib/map/groups'
import { buildRanking } from '../../lib/risk/rank'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import type { RiskLabel } from '../../types'

const LABELS: RiskLabel[] = ['High priority', 'Moderate priority', 'Lower observed concern', 'Insufficient data']
const PIN: Record<RiskLabel, { className: string; icon: typeof Info }> = {
  'High priority': { className: 'bg-high text-white', icon: TriangleAlert },
  'Moderate priority': { className: 'bg-moderate text-black', icon: AlertTriangle },
  'Lower observed concern': { className: 'bg-ink text-white', icon: Info },
  'Insufficient data': { className: 'hatch text-black ring-1 ring-ink-3', icon: CircleHelp },
}

/** Schematic map: ghats grouped by water body. No coordinates exist in the data, so nothing here is geographic. */
export function MapPage() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const setFocusSite = useRanking((s) => s.setFocusSite)
  const results = useData((s) => s.results)
  const ranking = useMemo(() => buildRanking(results), [results])
  const groups = useMemo(() => groupByWaterBody(ranking), [ranking])
  const rankOf = (site: string) => ranking.findIndex((r) => r.site === site) + 1

  function open(site: string) {
    setFocusSite(site)
    setView('ranking')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => setView('overview')} className="flex min-h-11 items-center gap-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
        <ArrowLeft className="size-4" aria-hidden />{t('mapBack', lang)}
      </button>
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('mapTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('mapLead', lang)}</p>
      </div>
      <p className="flex items-start gap-2 rounded-lg border border-dashed border-ink-3 p-3 text-sm text-ink-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{t('mapSchematic', lang)}
      </p>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={t('mapLegend', lang)}>
        {LABELS.map((l) => {
          const { className, icon: Icon } = PIN[l]
          return <li key={l} className="flex items-center gap-2"><span className={`grid size-6 place-items-center rounded-full ${className}`}><Icon className="size-3.5" aria-hidden /></span>{t(LABEL_KEY[l], lang)}</li>
        })}
      </ul>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.waterBody} className="overflow-hidden rounded-2xl border border-divider bg-info-tint/40">
            <header className="flex items-center justify-between gap-2 border-b border-divider bg-white/70 px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold"><Waves className="size-5 text-info" aria-hidden />{g.waterBody}</h2>
              <span className="caption-mono text-ink-3">{t('mapGhats', lang, { n: g.sites.length })}</span>
            </header>
            <ul className="space-y-2 p-3">
              {g.sites.map((r) => {
                const { className, icon: Icon } = PIN[r.label]
                return (
                  <li key={r.site}>
                    <button onClick={() => open(r.site)} aria-label={t('mapOpenCard', lang, { site: r.site })}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-divider bg-white p-3 text-left hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${className}`}><Icon className="size-5" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-5">{r.site}</span>
                        <span className="tabular block text-xs text-ink-3">{t('mapRank', lang, { n: rankOf(r.site) })} · {t(LABEL_KEY[r.label], lang)}</span>
                      </span>
                      {r.gaps.length > 0 && <TriangleAlert className="size-4 shrink-0" aria-label="Data limits" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
