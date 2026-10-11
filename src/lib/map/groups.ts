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
