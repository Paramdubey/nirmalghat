import { CRITERIA } from '../../constants/cpcb'
import type { Criterion, Reading, ReadingResult, ResultKind } from '../../types'

function checkValue(value: number, c: Criterion): ResultKind {
  switch (c.kind) {
    case 'min':
      return value < c.limit ? 'below criterion' : 'within' // limit itself is within
    case 'max':
      return value > c.limit ? 'above criterion' : 'within'
    case 'range':
      return value < c.low || value > c.high ? 'outside range' : 'within'
  }
}

export function isBreach(result: ResultKind): boolean {
  return result === 'below criterion' || result === 'above criterion' || result === 'outside range'
}

/** Compares one reading with CPCB Class B. Missing / BDL / ND never become numbers or "within". */
export function evaluateReading(reading: Reading): ReadingResult {
  const criterion = CRITERIA[reading.parameter] ?? null
  const notes: string[] = []
  if (reading.siteMatchConfidence === 'medium') {
    notes.push('Site name match is medium confidence: this ghat may cover two places.')
  }

  switch (reading.status) {
    case 'missing':
      return { reading, criterion, result: 'not sampled', notes }
    case 'BDL':
      return { reading, criterion, result: 'BDL', notes }
    case 'ND':
      return { reading, criterion, result: 'ND', notes }
    case 'valid':
      return { reading, criterion, result: criterion ? checkValue(reading.value, criterion) : 'no threshold', notes }
  }
}

export function evaluateAll(readings: Reading[]): ReadingResult[] {
  return readings.map(evaluateReading)
}
