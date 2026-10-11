import type { Festival, ObservationRef, Phase, Reading } from '../../types'

const FESTIVAL_ORDER: Record<Festival, number> = { Ganesh: 0, Durga: 1 } // Ganesh falls before Durga each year
const PHASE_ORDER: Record<Phase, number> = { pre: 0, during: 1, after: 2 }

export interface FestivalEvent {
  year: number
  festival: Festival
}

export const eventKey = (e: FestivalEvent) => `${e.year} ${e.festival}`

export function compareEvents(a: FestivalEvent, b: FestivalEvent): number {
  return a.year - b.year || FESTIVAL_ORDER[a.festival] - FESTIVAL_ORDER[b.festival]
}

/** Chronological order of a single observation (year → festival → phase). */
export function compareObservations(a: ObservationRef, b: ObservationRef): number {
  return compareEvents(a, b) || PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]
}

export const PHASES: Phase[] = ['pre', 'during', 'after']

/** Every year+festival present anywhere in the data, oldest first. */
export function listEvents(readings: Reading[]): FestivalEvent[] {
  const seen = new Map<string, FestivalEvent>()
  for (const r of readings) seen.set(eventKey(r), { year: r.year, festival: r.festival })
  return [...seen.values()].sort(compareEvents)
}

export function toRef(r: Reading): ObservationRef {
  return { year: r.year, festival: r.festival, phase: r.phase, sourcePage: r.sourcePage }
}

export function describeRef(ref: ObservationRef): string {
  return `${ref.year} ${ref.festival}, ${ref.phase}, p. ${ref.sourcePage}`
}

export type CellStatus = 'sampled' | 'BDL' | 'ND' | 'not sampled' | 'no table'

export interface CoverageCell {
  event: FestivalEvent
  phase: Phase
  status: CellStatus
  valid: number
  /** Rows printed blank / not sampled in this cell. */
  missing: number
  total: number
}

/** Site × (year·festival·phase) coverage. 'no table' = the report has no rows for this site at all in that festival. */
export function buildCoverage(readings: Reading[], site: string, events: FestivalEvent[]): CoverageCell[] {
  const cells: CoverageCell[] = []
  for (const event of events) {
    for (const phase of PHASES) {
      const rows = readings.filter((r) => r.site === site && r.year === event.year && r.festival === event.festival && r.phase === phase)
      const valid = rows.filter((r) => r.status === 'valid').length
      const missing = rows.filter((r) => r.status === 'missing').length
      let status: CellStatus
      if (rows.length === 0) status = 'no table'
      else if (valid > 0) status = 'sampled'
      else if (rows.some((r) => r.status === 'BDL')) status = 'BDL'
      else if (rows.some((r) => r.status === 'ND')) status = 'ND'
      else status = 'not sampled'
      cells.push({ event, phase, status, valid, missing, total: rows.length })
    }
  }
  return cells
}
