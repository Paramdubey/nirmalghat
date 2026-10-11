import { CRITERIA } from '../../constants/cpcb'
import { sourceReport } from '../../constants/sources'
import type { MatchConfidence, Phase, ReadingResult } from '../../types'
import { PHASES } from './events'

export interface SiteQuality {
  site: string
  valid: number
  bdl: number
  nd: number
  missing: number
  total: number
}

export interface QualityStats {
  total: number
  valid: number
  bdl: number
  nd: number
  missing: number
  bySite: SiteQuality[]
  /** Not-sampled counts per parameter and stage. */
  missingByParameter: { parameter: string; counts: Record<Phase, number>; total: number }[]
  noLimitParameters: string[]
  sources: { year: number; report: string; readings: number; pages: string[] }[]
  names: { site: string; waterBody: string; confidence: MatchConfidence; printed: string[] }[]
}

const byNumberThenText = (a: string, b: string) => Number(a) - Number(b) || a.localeCompare(b)

/** Pure: data-quality counts for the Data quality screen, all computed from loaded readings. */
export function qualityStats(results: ReadingResult[]): QualityStats {
  const count = (rows: ReadingResult[], status: string) => rows.filter((r) => r.reading.status === status).length
  const sites = [...new Set(results.map((r) => r.reading.site))].sort()
  const parameters = [...new Set(results.map((r) => r.reading.parameter))]
  const years = [...new Set(results.map((r) => r.reading.year))].sort()

  return {
    total: results.length,
    valid: count(results, 'valid'),
    bdl: count(results, 'BDL'),
    nd: count(results, 'ND'),
    missing: count(results, 'missing'),
    bySite: sites.map((site) => {
      const rows = results.filter((r) => r.reading.site === site)
      return { site, valid: count(rows, 'valid'), bdl: count(rows, 'BDL'), nd: count(rows, 'ND'), missing: count(rows, 'missing'), total: rows.length }
    }),
    missingByParameter: parameters.map((parameter) => {
      const rows = results.filter((r) => r.reading.parameter === parameter && r.reading.status === 'missing')
      const counts = Object.fromEntries(PHASES.map((p) => [p, rows.filter((r) => r.reading.phase === p).length])) as Record<Phase, number>
      return { parameter, counts, total: rows.length }
    }),
    noLimitParameters: parameters.filter((p) => !(p in CRITERIA)),
    sources: years.map((year) => {
      const rows = results.filter((r) => r.reading.year === year)
      return { year, report: sourceReport(year), readings: rows.length, pages: [...new Set(rows.map((r) => r.reading.sourcePage))].sort(byNumberThenText) }
    }),
    names: sites.map((site) => {
      const rows = results.filter((r) => r.reading.site === site)
      return {
        site, waterBody: rows[0].reading.waterBody, confidence: rows[0].reading.siteMatchConfidence,
        printed: [...new Set(rows.map((r) => r.reading.siteAsPrinted))],
      }
    }),
  }
}
