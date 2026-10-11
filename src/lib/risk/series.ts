import type { Phase, ReadingResult, ResultKind } from '../../types'
import { eventKey, PHASES, type FestivalEvent } from './events'

export type PointStatus = 'valid' | 'BDL' | 'ND' | 'not sampled' | 'no table'

export interface SeriesPoint {
  slot: string
  label: string
  event: FestivalEvent
  phase: Phase
  status: PointStatus
  /** Only set for `valid`. Every other status is deliberately null, never 0. */
  value: number | null
  result: ResultKind | null
  unit: string
  sourcePage: string | null
  printed: string | null
}

/**
 * One point per year · festival · stage, in time order, for a single ghat and parameter.
 * Stages with no number keep their own status so the chart can mark them instead of joining across them.
 */
export function buildSeries(results: ReadingResult[], site: string, parameter: string, events: FestivalEvent[]): SeriesPoint[] {
  const own = results.filter((r) => r.reading.site === site && r.reading.parameter === parameter)
  return events.flatMap((event) =>
    PHASES.map((phase): SeriesPoint => {
      const hit = own.find((r) => eventKey(r.reading) === eventKey(event) && r.reading.phase === phase)
      const festival = event.festival === 'Ganesh' ? 'Gan' : 'Dur'
      const base = {
        slot: `${eventKey(event)} ${phase}`,
        label: `${festival} ${event.year} ${phase}`,
        event, phase,
      }
      if (!hit) {
        return { ...base, status: 'no table', value: null, result: null, unit: '', sourcePage: null, printed: null }
      }
      const { reading } = hit
      const common = { ...base, result: hit.result, unit: reading.unit, sourcePage: reading.sourcePage, printed: reading.valueAsPrinted }
      switch (reading.status) {
        case 'valid':
          return { ...common, status: 'valid', value: reading.value }
        case 'BDL':
          return { ...common, status: 'BDL', value: null }
        case 'ND':
          return { ...common, status: 'ND', value: null }
        case 'missing':
          return { ...common, status: 'not sampled', value: null }
      }
    }),
  )
}

/** Round the top of a chart axis up to a tidy tick step. */
export function axisTicks(top: number): { max: number; ticks: number[] } {
  const step = top <= 8 ? 2 : top <= 20 ? 5 : top <= 50 ? 10 : 20
  const max = Math.ceil(top / step) * step
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) }
}
