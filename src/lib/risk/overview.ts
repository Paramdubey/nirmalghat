import type { ReadingResult, RiskLabel, SiteRisk } from '../../types'
import type { Summary } from './summary'

export interface OverviewStats {
  readingCount: number
  years: { from: number; to: number }
  waterBodies: string[]
  highSites: string[]
  gapSites: string[]
  /** Valid DO + BOD + pH readings, i.e. every reading that was actually compared with Class B. */
  validCoreTests: number
  breachPercent: number
  doBelowPercent: number
  bodAbovePercent: number
  /** Readings printed as blank / not sampled across all parameters. */
  unsampledReadings: number
  sitesByLabel: Record<RiskLabel, string[]>
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10)

/** Pure: every number on the Overview that is not already in Summary, computed from loaded data. */
export function overviewStats(ranking: SiteRisk[], results: ReadingResult[], s: Summary): OverviewStats {
  const years = results.map((r) => r.reading.year)
  const validCoreTests = s.doValid + s.bodValid + s.phValid
  const sitesByLabel: Record<RiskLabel, string[]> = {
    'High priority': [], 'Moderate priority': [], 'Lower observed concern': [], 'Insufficient data': [],
  }
  for (const r of ranking) sitesByLabel[r.label].push(r.site)
  return {
    readingCount: results.length,
    years: { from: Math.min(...years), to: Math.max(...years) },
    waterBodies: [...new Set(ranking.map((r) => r.waterBody))],
    highSites: sitesByLabel['High priority'],
    gapSites: ranking.filter((r) => r.gaps.length > 0).map((r) => r.site),
    validCoreTests,
    breachPercent: percent(s.totalBreaches, validCoreTests),
    doBelowPercent: percent(s.doBelow, s.doValid),
    bodAbovePercent: percent(s.bodAbove, s.bodValid),
    unsampledReadings: results.filter((r) => r.reading.status === 'missing').length,
    sitesByLabel,
  }
}

