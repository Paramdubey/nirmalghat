import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { buildRanking, EMPTY_FILTERS, sortRisks } from '../src/lib/risk/rank'
import { summarise } from '../src/lib/risk/summary'
import { overviewStats } from '../src/lib/risk/overview'
import { contextFrom, explainScore } from '../src/lib/risk/score'
import { groupByWaterBody, heatLevel, heatScale } from '../src/lib/map/groups'
import { qualityStats } from '../src/lib/risk/quality'
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
  test('missing data never lowers a score (readings are averaged over those that exist)', () => {
    const complete = fullSite('A', 2, 6)
    const withGaps = complete.map((r) => (r.parameter === 'pH' ? reading({ parameter: 'pH', site: 'A', festival: r.festival, phase: r.phase }, null) : r))
    const a = buildRanking(evaluateAll(complete))[0]
    const b = buildRanking(evaluateAll(withGaps))[0]
    expect(b.score).toBeGreaterThanOrEqual(a.score)
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

describe('scoring is per reading, so ghats with fewer readings compare fairly', () => {
  /** Same breach pattern; B simply has one festival fewer (like a missing report table). */
  const pattern = (site: string, festivals: ('Ganesh' | 'Durga')[]) =>
    festivals.flatMap((festival) => (['pre', 'during', 'after'] as const).flatMap((phase) => [
      reading({ parameter: 'Dissolved oxygen', site, festival, phase }, 2),
      reading({ parameter: 'BOD', site, festival, phase }, 6),
      reading({ parameter: 'pH', site, festival, phase }, 7),
    ]))
  test('fewer festivals with the same pattern give the same score', () => {
    const both = buildRanking(evaluateAll([...pattern('A', ['Ganesh', 'Durga']), ...pattern('B', ['Ganesh', 'Durga'])]))
    const mixed = buildRanking(evaluateAll([...pattern('A', ['Ganesh', 'Durga']), ...pattern('B', ['Ganesh'])]))
    const score = (list: ReturnType<typeof buildRanking>, site: string) => list.find((r) => r.site === site)!.score
    expect(score(mixed, 'B')).toBe(score(mixed, 'A'))
    expect(score(mixed, 'A')).toBe(score(both, 'A'))
  })
  test('a ghat with full coverage has the same score as the raw sum of its points', () => {
    const full = ranking.find((r) => r.site === 'Shahpura lake ghat')!
    const x = explainScore(full.site, results, contextFrom(results))
    expect(x.factor).toBe(1)
    expect(full.score).toBe(152.3)
  })
  test('ghats with fewer valid readings are scaled up, never down', () => {
    const bairagarh = explainScore('Bairagarh (Sant Hirdaram) kund', results, contextFrom(results))
    expect(bairagarh.validReadings).toBeLessThan(bairagarh.referenceReadings)
    expect(bairagarh.factor).toBeGreaterThan(1)
    expect(bairagarh.readingScore).toBeCloseTo(bairagarh.rawReadingPoints * bairagarh.factor, 9)
  })
  test('readingsUsed is shown with every score', () => {
    for (const r of ranking) expect(r.readingsUsed).toBeGreaterThan(0)
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

describe('overview stats', () => {
  const s = summarise(ranking, results)
  const o = overviewStats(ranking, results, s)
  test('are computed from the data', () => {
    expect(o.readingCount).toBe(1524)
    expect(o.years).toEqual({ from: 2023, to: 2025 })
    expect(o.validCoreTests).toBe(116 + 112 + 115)
    expect(o.breachPercent).toBeCloseTo((148 / 343) * 100, 0)
    expect(o.gapSites.sort()).toEqual(ranking.filter((r) => r.gaps.length > 0).map((r) => r.site).sort())
    expect(o.unsampledReadings).toBe(61)
  })
  test('every ghat is listed under exactly one label', () => {
    const all = Object.values(o.sitesByLabel).flat()
    expect(all.sort()).toEqual(ranking.map((r) => r.site).sort())
  })
})

describe('quality stats', () => {
  const q = qualityStats(results)
  test('status counts add up to every loaded reading', () => {
    expect(q.valid + q.bdl + q.nd + q.missing).toBe(q.total)
    expect([q.total, q.valid, q.bdl, q.nd, q.missing]).toEqual([1524, 1289, 174, 0, 61])
    expect(q.bySite.reduce((n, s) => n + s.total, 0)).toBe(q.total)
  })
  test('missing counts by parameter and stage add up', () => {
    expect(q.missingByParameter.reduce((n, p) => n + p.total, 0)).toBe(q.missing)
    for (const p of q.missingByParameter) expect(p.counts.pre + p.counts.during + p.counts.after).toBe(p.total)
  })
  test('parameters without a Class B limit are listed; DO, BOD and pH are not', () => {
    expect(q.noLimitParameters).toHaveLength(10)
    expect(q.noLimitParameters).not.toContain('pH')
    expect(q.noLimitParameters).toContain('Lead')
  })
  test('source reports and pages come per year, as text', () => {
    expect(q.sources.map((s) => s.year)).toEqual([2023, 2024, 2025])
    expect(q.sources[0].report).toMatch(/2023/)
    expect(q.sources.every((s) => s.pages.length > 0)).toBe(true)
  })
  test('the medium-confidence ghat has more than one printed name', () => {
    const rani = q.names.find((n) => n.site.startsWith('Rani Kamlapati'))!
    expect(rani.confidence).toBe('medium')
    expect(rani.printed.length).toBeGreaterThan(1)
  })
  test('coverage cells count blanks separately', () => {
    const cells = buildCoverage(real, 'Bairagarh (Sant Hirdaram) kund', listEvents(real))
    expect(cells.reduce((n, c) => n + c.missing, 0)).toBe(q.bySite.find((s) => s.site.startsWith('Bairagarh'))!.missing)
  })
})

describe('map groups', () => {
  test('every ghat appears once, grouped by base water body', () => {
    const groups = groupByWaterBody(ranking)
    expect(groups.flatMap((g) => g.sites.map((x) => x.site)).sort()).toEqual(ranking.map((r) => r.site).sort())
    expect(groups.map((g) => g.waterBody)).toContain('Lower Lake')
    expect(groups.some((g) => g.waterBody.includes('as printed'))).toBe(false)
    const lower = groups.find((g) => g.waterBody === 'Lower Lake')!
    expect(lower.sites.map((x) => x.site)).toEqual(expect.arrayContaining(['Khatlapura ghat', 'Rani Kamlapati ghat / Kamla Park kund']))
  })
})

describe('map heat', () => {
  const scale = heatScale(ranking)
  test('scale comes from ranked ghats; shade rises with the score', () => {
    expect(scale).not.toBeNull()
    const levels = ranking.map((r) => heatLevel(r, scale)!)
    const top = ranking.reduce((a, b) => (b.score > a.score ? b : a))
    const bottom = ranking.reduce((a, b) => (b.score < a.score ? b : a))
    expect(heatLevel(top, scale)).toBe(1)
    expect(heatLevel(bottom, scale)).toBeCloseTo(0.15)
    expect(levels.every((l) => l >= 0.15 && l <= 1)).toBe(true)
  })
  test('insufficient-data ghats are never shaded', () => {
    const insufficient = { ...ranking[0], label: 'Insufficient data' as const, score: 0 }
    expect(heatLevel(insufficient, scale)).toBeNull()
    expect(heatScale([insufficient])).toBeNull()
    expect(heatScale([insufficient, ranking[0]])).toEqual({ min: ranking[0].score, max: ranking[0].score })
  })
})

describe('score explanation', () => {
  const ctx = contextFrom(results)
  test('the explained total equals every ghat\'s score', () => {
    for (const r of ranking) {
      const x = explainScore(r.site, results, ctx)
      expect(Math.round(x.total * 10) / 10).toBe(r.score)
      expect(x.rows.length).toBe(r.breachCount)
      expect(x.label).toBe(r.label)
    }
  })
  test('parts add up and each row is weight × severity × recency', () => {
    const x = explainScore('Shahpura lake ghat', results, ctx)
    expect(x.byParameter.reduce((n, p) => n + p.points, 0) * x.factor + x.recurrencePoints).toBeCloseTo(x.total, 6)
    for (const row of x.rows) expect(row.points).toBeCloseTo(row.weight * row.severity * row.recency, 9)
    expect(x.recurrenceRaw).toBe(x.events.length * 2)
    expect(x.rows.every((row) => /^\d+$/.test(row.sourcePage))).toBe(true)
  })
  test('missing, BDL and ND readings are listed as not counted, never as points', () => {
    const x = explainScore('Bairagarh (Sant Hirdaram) kund', results, ctx)
    expect(x.notCounted.missing).toBeGreaterThan(0)
    expect(x.notCounted.bdl).toBeGreaterThan(0)
    expect(x.rows.every((row) => Number.isFinite(row.value))).toBe(true)
  })
})
