import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { buildRanking, EMPTY_FILTERS, sortRisks } from '../src/lib/risk/rank'
import { summarise } from '../src/lib/risk/summary'
import { buildCoverage, listEvents } from '../src/lib/risk/events'
import type { Reading } from '../src/types'
import { reading } from './helpers'

const real = parseBhopalCsv(readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')).readings
const results = evaluateAll(real)
const ranking = buildRanking(results)

/** A tiny dataset: site gets all three phases of DO/BOD/pH across two festivals. */
function fullSite(site: string, doValue: number | 'BDL' | null, bodValue: number | 'BDL' | null, extra: Partial<Reading> = {}): Reading[] {
  const out: Reading[] = []
  for (const festival of ['Ganesh', 'Durga'] as const)
    for (const phase of ['pre', 'during', 'after'] as const) {
      out.push(reading({ parameter: 'Dissolved oxygen', site, festival, phase, ...extra }, doValue))
      out.push(reading({ parameter: 'BOD', site, festival, phase, ...extra }, bodValue))
      out.push(reading({ parameter: 'pH', site, festival, phase, ...extra }, 7))
    }
  return out
}

describe('ranking on real data', () => {
  test('is reproducible and ranks all seven ghats', () => {
    expect(buildRanking(results).map((r) => r.site)).toEqual(ranking.map((r) => r.site))
    expect(ranking).toHaveLength(7)
  })
  test('source pages are preserved in the evidence behind a rank', () => {
    const bairagarh = ranking.find((r) => r.site.startsWith('Bairagarh'))!
    expect(bairagarh.lowestDo).toMatchObject({ value: 0 })
    expect(bairagarh.lowestDo?.sourcePage).toMatch(/^\d+$/)
    expect(bairagarh.explanation).toContain(`p. ${bairagarh.lowestDo?.sourcePage}`)
  })
  test('ghats with no Durga 2025 table carry a limitation flag', () => {
    for (const name of ['Bairagarh', 'Malikhedi']) {
      const risk = ranking.find((r) => r.site.startsWith(name))!
      expect(risk.gaps.some((g) => g.code === 'no-table' && g.text.includes('2025 Durga'))).toBe(true)
      expect(risk.completeness).toBeLessThan(1)
    }
  })
  test('medium-confidence ghat is flagged', () => {
    const risk = ranking.find((r) => r.site.startsWith('Rani Kamlapati'))!
    expect(risk.gaps.some((g) => g.code === 'medium-match')).toBe(true)
  })
  test('guide figures are recomputed from data: 42 of 116 DO below 5, 100 of 112 BOD above 3', () => {
    const s = summarise(ranking, results)
    expect([s.doBelow, s.doValid, s.bodAbove, s.bodValid]).toEqual([42, 116, 100, 112])
  })
})

describe('scoring rules', () => {
  test('missing data never lowers a score', () => {
    const complete = fullSite('A', 2, 6)
    const withGaps = complete.map((r) => (r.parameter === 'pH' ? reading({ parameter: 'pH', site: 'A', festival: r.festival, phase: r.phase }, null) : r))
    const a = buildRanking(evaluateAll(complete))[0]
    const b = buildRanking(evaluateAll(withGaps))[0]
    expect(b.score).toBe(a.score)
  })
  test('a site with only missing readings is Insufficient data, never low', () => {
    const [risk] = buildRanking(evaluateAll(fullSite('Z', null, null)))
    expect(risk.label).toBe('Insufficient data')
    expect(risk.score).toBe(0)
  })
  test('compliant readings with a medium-confidence match are not called low or safe', () => {
    const [risk] = buildRanking(evaluateAll(fullSite('M', 8, 1, { siteMatchConfidence: 'medium' })))
    expect(risk.label).toBe('Insufficient data')
  })
  test('compliant readings with full data are Lower observed concern', () => {
    const [risk] = buildRanking(evaluateAll(fullSite('C', 8, 1)))
    expect(risk.label).toBe('Lower observed concern')
    expect(risk.breachCount).toBe(0)
  })
  test('DO of 0 scores higher than DO just under 5; recurrence adds score', () => {
    const zero = buildRanking(evaluateAll(fullSite('Z', 0, 1)))[0].score
    const mild = buildRanking(evaluateAll(fullSite('M', 4.9, 1)))[0].score
    expect(zero).toBeGreaterThan(mild)
  })
  test('BDL never counts as a breach', () => {
    const [risk] = buildRanking(evaluateAll(fullSite('B', 'BDL', 'BDL')))
    expect(risk.breachCount).toBe(0)
  })
  test('ties break by breach count then site name', () => {
    const base = ranking[0]
    const tied = [{ ...base, site: 'B', breachCount: 1 }, { ...base, site: 'A', breachCount: 1 }, { ...base, site: 'C', breachCount: 5 }]
    expect(sortRisks(tied, 'priority').map((r) => r.site)).toEqual(['C', 'A', 'B'])
  })
  test('Insufficient data is listed after ranked ghats under priority sort', () => {
    const all = [...fullSite('Strong', 0, 9), ...fullSite('Empty', null, null)]
    expect(buildRanking(evaluateAll(all)).map((r) => r.site)).toEqual(['Strong', 'Empty'])
  })
})

describe('filters and sorting', () => {
  test('festival and year filters change readings and counts', () => {
    const all = summarise(ranking, results).totalBreaches
    const durga = buildRanking(results, { ...EMPTY_FILTERS, festivals: ['Durga'] })
    const y2024 = buildRanking(results, { ...EMPTY_FILTERS, years: [2024] })
    expect(durga.reduce((n, r) => n + r.breachCount, 0)).toBeLessThan(all)
    expect(y2024.reduce((n, r) => n + r.breachCount, 0)).not.toBe(durga.reduce((n, r) => n + r.breachCount, 0))
  })
  test('site, label and uncertain-only filters narrow the list', () => {
    expect(buildRanking(results, { ...EMPTY_FILTERS, sites: ['Khatlapura ghat'] })).toHaveLength(1)
    expect(buildRanking(results, { ...EMPTY_FILTERS, labels: ['Moderate priority'] }).every((r) => r.label === 'Moderate priority')).toBe(true)
    const uncertain = buildRanking(results, { ...EMPTY_FILTERS, uncertainOnly: true })
    expect(uncertain.length).toBeGreaterThan(0)
    expect(uncertain.length).toBeLessThan(7)
    expect(uncertain.every((r) => r.gaps.length > 0)).toBe(true)
  })
  test('a filter does not make a real table look missing, nor hide a real gap', () => {
    const filtered = buildRanking(results, { ...EMPTY_FILTERS, festivals: ['Durga'], years: [2023] })
    const hasNoTable = (name: string) => filtered.find((r) => r.site.startsWith(name))!.gaps.some((g) => g.code === 'no-table')
    expect(hasNoTable('Khatlapura')).toBe(false)
    expect(hasNoTable('Bairagarh')).toBe(true)
  })
  test('sort by breaches orders by breach count', () => {
    const sorted = buildRanking(results, EMPTY_FILTERS, 'breaches').map((r) => r.breachCount)
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a))
  })
})

describe('filters never change the label', () => {
  test('score and label come from all readings; counts follow the filter', () => {
    const one = buildRanking(results, { ...EMPTY_FILTERS, festivals: ['Durga'], years: [2024], phases: ['pre'] })
    for (const r of one) {
      const full = ranking.find((x) => x.site === r.site)!
      expect(r.label).toBe(full.label)
      expect(r.score).toBe(full.score)
      expect(r.breachCount).toBeLessThan(full.breachCount)
    }
  })
  test('score breakdown adds up to the score', () => {
    for (const r of ranking) {
      const b = r.breakdown
      expect(Math.abs(b.doPoints + b.bodPoints + b.phPoints + b.recurrencePoints - r.score)).toBeLessThan(0.3)
    }
  })
})

describe('coverage matrix', () => {
  test('marks festivals with no rows as "no table"', () => {
    const cells = buildCoverage(real, 'Malikhedi kund', listEvents(real))
    const missing = cells.filter((c) => c.status === 'no table')
    expect(missing).toHaveLength(3)
    expect(missing.every((c) => c.event.year === 2025 && c.event.festival === 'Durga')).toBe(true)
  })
})
