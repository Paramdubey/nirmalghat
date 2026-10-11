import { AlertTriangle, ArrowLeft, CircleHelp, Info, MapPin as MapPinIcon, TriangleAlert, Waves } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LABEL_KEY, t } from '../../constants/i18n'
import { groupByWaterBody, heatLevel, heatScale } from '../../lib/map/groups'
import { buildRanking } from '../../lib/risk/rank'
import { useOfficerData } from '../../store/agents'
import { useLocations } from '../../store/locations'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import { LeafletMap, type MapPin } from './LeafletMap'
import type { RiskLabel } from '../../types'

const LABELS: RiskLabel[] = ['High priority', 'Moderate priority', 'Lower observed concern', 'Insufficient data']
const PIN: Record<RiskLabel, { className: string; icon: typeof Info }> = {
  'High priority': { className: 'bg-high text-white', icon: TriangleAlert },
  'Moderate priority': { className: 'bg-moderate text-black', icon: AlertTriangle },
  'Lower observed concern': { className: 'bg-ink text-white', icon: Info },
  'Insufficient data': { className: 'hatch text-black ring-1 ring-ink-3', icon: CircleHelp },
}

/** Red tint for a 0 to 1 heat level. The same text colour works on every shade. */
const heatColor = (level: number) => `color-mix(in srgb, #e11900 ${Math.round(level * 38)}%, white)`

/** Schematic map: ghats grouped by water body. No coordinates exist in the data, so nothing here is geographic. */
export function MapPage() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const setFocusSite = useRanking((s) => s.setFocusSite)
  const results = useData((s) => s.results)
  const ranking = useMemo(() => buildRanking(results), [results])
  const groups = useMemo(() => groupByWaterBody(ranking), [ranking])
  const scale = useMemo(() => heatScale(ranking), [ranking])
  const assignments = useOfficerData((s) => s.assignments)
  const { locations, error: locError, load: loadLocations, save } = useLocations()
  const [placing, setPlacing] = useState<string | null>(null)
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { void loadLocations() }, [loadLocations])
  const pins: MapPin[] = useMemo(() => ranking.flatMap((r) => {
    const loc = locations.find((l) => l.site === r.site)
    return loc ? [{ site: r.site, lat: loc.lat, lng: loc.lng, rank: ranking.indexOf(r) + 1, label: r.label, summary: `${t(LABEL_KEY[r.label], lang)} · ${t('mapScore', lang, { n: r.score })}` }] : []
  }), [ranking, locations, lang])
  const rankOf = (site: string) => ranking.findIndex((r) => r.site === site) + 1

  const open = useCallback((site: string) => {
    setFocusSite(site)
    setView('ranking')
  }, [setFocusSite, setView])
  const place = useCallback((lat: number, lng: number) => setPending({ lat, lng }), [])

  async function savePending() {
    if (!placing || !pending) return setMessage({ ok: false, text: t('mapNeedClick', lang) })
    setSaving(true)
    try {
      await save(placing, pending.lat, pending.lng)
      setMessage({ ok: true, text: t('mapSaved', lang, { site: placing }) })
      setPlacing(null)
      setPending(null)
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not save' })
    } finally {
      setSaving(false)
    }
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
      {locError && <p role="alert" className="rounded-lg bg-moderate-tint p-3 text-sm font-medium">{locError}</p>}

      {placing && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-black p-3 text-sm text-white">
          <span>{t('mapPlacing', lang, { site: placing })}</span>
          <span className="flex gap-2">
            <button onClick={savePending} disabled={saving || !pending} className="min-h-11 rounded-full bg-white px-5 font-semibold text-black disabled:opacity-50">{t('mapSave', lang)}</button>
            <button onClick={() => { setPlacing(null); setPending(null) }} className="min-h-11 rounded-full bg-[#2c2c2c] px-5 font-semibold">{t('mapCancel', lang)}</button>
          </span>
        </div>
      )}
      {message && <p role="status" className={`text-sm font-medium ${message.ok ? '' : 'text-high'}`}>{message.text}</p>}

      <LeafletMap pins={pins} openLabel={t('mapPopupOpen', lang)} onOpen={open} placing={placing !== null} pending={pending} onPlace={place} />

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={t('mapLegend', lang)}>
        {LABELS.map((l) => {
          const { className, icon: Icon } = PIN[l]
          return <li key={l} className="flex items-center gap-2"><span className={`grid size-6 place-items-center rounded-full ${className}`}><Icon className="size-3.5" aria-hidden /></span>{t(LABEL_KEY[l], lang)}</li>
        })}
      </ul>

      {scale && (
        <div className="rounded-lg border border-divider p-3">
          <p className="label-caps !text-black">{t('mapHeatTitle', lang)}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="tabular">{t('mapHeatLow', lang, { n: scale.min })}</span>
            <span className="h-3 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${heatColor(0.15)}, ${heatColor(1)})` }} aria-hidden />
            <span className="tabular">{t('mapHeatHigh', lang, { n: scale.max })}</span>
            <span className="hatch ml-2 inline-block size-4 rounded ring-1 ring-ink-3" aria-hidden />
            <span>{t(LABEL_KEY['Insufficient data'], lang)}</span>
          </div>
          <p className="mt-2 text-xs text-ink-3">{t('mapHeatNote', lang)}</p>
        </div>
      )}

      <h2 className="text-xl font-bold leading-7">{t('mapListTitle', lang)}</h2>
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
                const level = heatLevel(r, scale)
                const briefs = assignments.filter((a) => a.site === r.site)
                return (
                  <li key={r.site}>
                    <button onClick={() => open(r.site)} aria-label={t('mapOpenCard', lang, { site: r.site })}
                      style={level === null ? undefined : { backgroundColor: heatColor(level) }}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border border-divider p-3 text-left hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${level === null ? 'hatch' : ''}`}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${className}`}><Icon className="size-5" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-5">{r.site}</span>
                        <span className="tabular block text-xs text-ink-2">{t('mapRank', lang, { n: rankOf(r.site) })} · {t(LABEL_KEY[r.label], lang)}{level !== null && ` · ${t('mapScore', lang, { n: r.score })}`}</span>
                      </span>
                      {r.gaps.length > 0 && <TriangleAlert className="size-4 shrink-0" aria-label="Data limits" />}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-ink-2">
                      {(() => {
                        const loc = locations.find((l) => l.site === r.site)
                        return (
                          <>
                            <span className="flex items-center gap-1"><MapPinIcon className="size-3.5" aria-hidden />{loc ? t('mapSetBy', lang, { when: new Date(loc.setAt).toLocaleDateString('en-IN') }) : t('mapNotSet', lang)}</span>
                            <button onClick={() => { setPlacing(r.site); setPending(null); setMessage(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                              className="min-h-11 rounded-full bg-surface px-3 font-semibold text-black focus-visible:outline-2 focus-visible:outline-black">
                              {t('mapSet', lang)}
                            </button>
                          </>
                        )
                      })()}
                    </div>
                    {briefs.length > 0 && (
                      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-2 text-sm">
                        {briefs.map((a) => (
                          <li key={a.id} className="flex flex-wrap items-center gap-2">
                            <b>{a.agentName}</b>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.submission ? 'bg-info-tint text-info' : 'hatch'}`}>{a.submission ? t('asgSubmitted', lang) : t('asgAssigned', lang)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
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
