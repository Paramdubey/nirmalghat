import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { listEvents } from '../src/lib/risk/events'
import { buildSeries, axisTicks } from '../src/lib/risk/series'
import { reading } from './helpers'

const real = parseBhopalCsv(readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')).readings
const results = evaluateAll(real)
const events = listEvents(real)

describe('chart series', () => {
  test('one point per festival and stage, in time order', () => {
    const s = buildSeries(results, 'Khatlapura ghat', 'Dissolved oxygen', events)
    expect(s).toHaveLength(events.length * 3)
    expect(s[0].slot).toBe('2023 Ganesh pre')
    expect(s.at(-1)?.slot).toBe('2025 Durga after')
  })
  test('only valid points carry a number; BDL, not sampled and no-table stay null', () => {
    const s = buildSeries(results, 'Malikhedi kund', 'BOD', events)
    expect(s.filter((p) => p.status !== 'valid').every((p) => p.value === null)).toBe(true)
    expect(s.filter((p) => p.status === 'no table')).toHaveLength(3)
    const bdl = buildSeries(results, 'Khatlapura ghat', 'Lead', events).filter((p) => p.status === 'BDL')
    expect(bdl.length).toBeGreaterThan(0)
    expect(bdl.every((p) => p.value === null)).toBe(true)
  })
  test('source page and printed value are kept on each point', () => {
    const s = buildSeries(results, 'Bairagarh (Sant Hirdaram) kund', 'Dissolved oxygen', events)
    const zero = s.find((p) => p.value === 0)!
    expect(zero.sourcePage).toMatch(/^\d+$/)
    expect(zero.printed).not.toBeNull()
  })
  test('a blank reading is "not sampled", never zero', () => {
    const r = evaluateAll([reading({ parameter: 'BOD' }, null)])
    const s = buildSeries(r, 'Test ghat', 'BOD', [{ year: 2025, festival: 'Ganesh' }])
    expect(s[0]).toMatchObject({ status: 'not sampled', value: null })
  })
  test('axis ticks round up tidily', () => {
    expect(axisTicks(8)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] })
    expect(axisTicks(14.4).max).toBe(15)
  })
})
