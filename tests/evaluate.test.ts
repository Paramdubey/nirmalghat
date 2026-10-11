import { describe, expect, test } from 'vitest'
import { evaluateReading } from '../src/lib/risk/evaluate'
import { reading } from './helpers'

const result = (parameter: string, value: number | 'BDL' | 'ND' | null) =>
  evaluateReading(reading({ parameter }, value)).result

describe('CPCB Class B evaluation', () => {
  test('dissolved oxygen: 5 is within, below 5 breaches', () => {
    expect(result('Dissolved oxygen', 5)).toBe('within')
    expect(result('Dissolved oxygen', 4.9)).toBe('below criterion')
    expect(result('Dissolved oxygen', 0)).toBe('below criterion')
    expect(result('Dissolved oxygen', 7.2)).toBe('within')
  })
  test('BOD: 3 is within, above 3 breaches', () => {
    expect(result('BOD', 3)).toBe('within')
    expect(result('BOD', 2.9)).toBe('within')
    expect(result('BOD', 3.1)).toBe('above criterion')
  })
  test('pH: 6.5 and 8.5 are within, outside breaches', () => {
    expect(result('pH', 6.5)).toBe('within')
    expect(result('pH', 8.5)).toBe('within')
    expect(result('pH', 6.4)).toBe('outside range')
    expect(result('pH', 8.6)).toBe('outside range')
  })
  test('missing is never within, below, above or zero', () => {
    for (const p of ['Dissolved oxygen', 'BOD', 'pH', 'Lead']) expect(result(p, null)).toBe('not sampled')
  })
  test('BDL and ND keep their own status, no exceedance', () => {
    for (const p of ['Dissolved oxygen', 'BOD', 'pH']) {
      expect(result(p, 'BDL')).toBe('BDL')
      expect(result(p, 'ND')).toBe('ND')
    }
  })
  test('parameters without a Class B limit are "no threshold"', () => {
    for (const p of ['COD', 'Turbidity', 'Conductivity', 'Lead', 'Chromium']) expect(result(p, 99999)).toBe('no threshold')
  })
  test('medium site-match confidence adds a visible note', () => {
    const r = evaluateReading(reading({ parameter: 'BOD', siteMatchConfidence: 'medium' }, 2))
    expect(r.notes.join(' ')).toMatch(/medium confidence/)
  })
  test('source page and printed values survive evaluation', () => {
    const r = evaluateReading(reading({ parameter: 'BOD', sourcePage: '28' }, 4))
    expect(r.reading.sourcePage).toBe('28')
    expect(r.reading.valueAsPrinted).toBe('4')
  })
})
