import type { Filters, ReadingResult, SiteRisk, SortKey } from '../../types'
import { compareObservations } from './events'
import { contextFrom, scoreSite } from './score'

export const EMPTY_FILTERS: Filters = {
  sites: [], festivals: [], years: [], phases: [], parameters: [], labels: [], uncertainOnly: false,
}

const allows = <T,>(selected: T[], value: T) => selected.length === 0 || selected.includes(value)

/** Applies the reading-level filters (site, festival, year, phase, parameter). */
export function filterResults(results: ReadingResult[], f: Filters): ReadingResult[] {
  return results.filter(({ reading: r }) =>
    allows(f.sites, r.site) && allows(f.festivals, r.festival) && allows(f.years, r.year) &&
    allows(f.phases, r.phase) && allows(f.parameters, r.parameter))
}

export function sortRisks(risks: SiteRisk[], sort: SortKey): SiteRisk[] {
  const byName = (a: SiteRisk, b: SiteRisk) => a.site.localeCompare(b.site)
  const byLatest = (a: SiteRisk, b: SiteRisk) =>
    a.latestObservation && b.latestObservation ? compareObservations(b.latestObservation, a.latestObservation)
      : Number(!!b.latestObservation) - Number(!!a.latestObservation)
  const compare = {
    // Insufficient-data ghats are listed after ranked ones: they are unranked, not "low".
    priority: (a: SiteRisk, b: SiteRisk) =>
      Number(a.label === 'Insufficient data') - Number(b.label === 'Insufficient data') ||
      b.score - a.score || b.breachCount - a.breachCount || byName(a, b),
    latest: (a: SiteRisk, b: SiteRisk) => byLatest(a, b) || b.score - a.score || byName(a, b),
    breaches: (a: SiteRisk, b: SiteRisk) => b.breachCount - a.breachCount || b.score - a.score || byName(a, b),
  }[sort]
  return [...risks].sort(compare)
}

/**
 * Ranks every ghat. Scores use the filtered readings; the festival calendar and newest year
 * come from the full data, so a filter never makes a real table look "missing".
 */
export function buildRanking(all: ReadingResult[], filters: Filters = EMPTY_FILTERS, sort: SortKey = 'priority'): SiteRisk[] {
  if (all.length === 0) return []
  const ctx = contextFrom(all)
  const filtered = filterResults(all, filters)
  const sites = [...new Set(filtered.map((r) => r.reading.site))]
  const risks = sites
    .map((site) => scoreSite(site, filtered, ctx, all))
    .filter((r) => allows(filters.labels, r.label))
    .filter((r) => !filters.uncertainOnly || r.gaps.length > 0)
  return sortRisks(risks, sort)
}
