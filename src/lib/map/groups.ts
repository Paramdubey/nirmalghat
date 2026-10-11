import type { SiteRisk } from '../../types'

export interface WaterBodyGroup {
  waterBody: string
  sites: SiteRisk[]
}

/** The data prints "Lower Lake (as printed in Durga tables)" for one ghat; it is the same Lower Lake as the others. */
export const baseWaterBody = (name: string) => name.replace(/\s*\(as printed[^)]*\)\s*$/i, '').trim()

/**
 * Groups ghats by water body. There are no coordinates in the data, so this is the only spatial
 * information the schematic map uses. Groups are ordered by their highest-ranked ghat.
 */
export function groupByWaterBody(ranking: SiteRisk[]): WaterBodyGroup[] {
  const groups = new Map<string, SiteRisk[]>()
  for (const r of ranking) {
    const key = baseWaterBody(r.waterBody)
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  return [...groups.entries()].map(([waterBody, sites]) => ({ waterBody, sites }))
}

export interface HeatScale {
  min: number
  max: number
}

/** Score range over ghats that have enough evidence to be ranked. "Insufficient data" ghats are left out on purpose. */
export function heatScale(ranking: SiteRisk[]): HeatScale | null {
  const scores = ranking.filter((r) => r.label !== 'Insufficient data').map((r) => r.score)
  return scores.length === 0 ? null : { min: Math.min(...scores), max: Math.max(...scores) }
}

/**
 * 0 to 1 shade for a ghat's historical risk score, or null for "Insufficient data" (never shaded, so it
 * can never look low). Every ranked ghat gets at least a faint tint: a low score is not "no concern".
 */
export function heatLevel(risk: SiteRisk, scale: HeatScale | null): number | null {
  if (risk.label === 'Insufficient data' || !scale) return null
  const span = scale.max - scale.min
  return span === 0 ? 1 : 0.15 + 0.85 * ((risk.score - scale.min) / span)
}
