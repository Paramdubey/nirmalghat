import type { ReadingResult, RiskLabel, SiteRisk } from '../../types'
import { isBreach } from './evaluate'

export interface Summary {
  ghatsAnalysed: number
  highPriority: number
  totalBreaches: number
  sitesWithGaps: number
  distribution: Record<RiskLabel, number>
  doBelow: number
  doValid: number
  bodAbove: number
  bodValid: number
}

/** Everything on the Overview is computed here from loaded data — nothing hardcoded. */
export function summarise(risks: SiteRisk[], results: ReadingResult[]): Summary {
  const distribution: Record<RiskLabel, number> = {
    'High priority': 0, 'Moderate priority': 0, 'Lower observed concern': 0, 'Insufficient data': 0,
  }
  for (const r of risks) distribution[r.label]++
  const count = (parameter: string) => results.filter((r) => r.reading.parameter === parameter && r.reading.status === 'valid')
  const doValid = count('Dissolved oxygen')
  const bodValid = count('BOD')
  return {
    ghatsAnalysed: risks.length,
    highPriority: distribution['High priority'],
    totalBreaches: results.filter((r) => isBreach(r.result)).length,
    sitesWithGaps: risks.filter((r) => r.gaps.length > 0).length,
    distribution,
    doBelow: doValid.filter((r) => isBreach(r.result)).length,
    doValid: doValid.length,
    bodAbove: bodValid.filter((r) => isBreach(r.result)).length,
    bodValid: bodValid.length,
  }
}
