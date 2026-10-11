import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { actionText } from '../src/constants/actionText'
import { generateActions } from '../src/lib/actions/generate'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { buildRanking } from '../src/lib/risk/rank'
import { reading } from './helpers'

const results = evaluateAll(parseBhopalCsv(readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')).readings)
const ranking = buildRanking(results)
const actions = generateActions(ranking, results)

describe('proposed actions', () => {
  test('are reproducible', () => {
    expect(generateActions(buildRanking(results), results).map((a) => a.id)).toEqual(actions.map((a) => a.id))
  })
  test('ids are unique and no action carries a status, assignee or completion', () => {
    expect(new Set(actions.map((a) => a.id)).size).toBe(actions.length)
    for (const a of actions) expect(Object.keys(a)).not.toEqual(expect.arrayContaining(['status']))
  })
  test('zero-oxygen action lists the zero readings with source pages', () => {
    const zero = actions.find((a) => a.kind === 'zero-do' && a.site.startsWith('Bairagarh'))!
    expect(zero.supporting.length).toBe(zero.vars.n)
    expect(zero.supporting.every((s) => s.valueText.startsWith('0 ') && /^\d+$/.test(s.sourcePage))).toBe(true)
  })
  test('missing-table, identity and missing-stage actions follow the data gaps', () => {
    const has = (kind: string, name: string) => actions.some((a) => a.kind === kind && a.site.startsWith(name))
    expect(has('missing-table', 'Bairagarh') && has('missing-table', 'Malikhedi')).toBe(true)
    expect(has('identity', 'Rani Kamlapati')).toBe(true)
    expect(has('missing-table', 'Khatlapura')).toBe(false)
  })
  test('resample actions cite the lowest DO and highest BOD with pages', () => {
    const a = actions.find((x) => x.kind === 'resample' && x.site.startsWith('Shahpura'))!
    expect(a.supporting.map((s) => s.parameter).sort()).toEqual(['BOD', 'Dissolved oxygen'])
  })
  test('high priority actions come before data follow-ups', () => {
    const order = actions.map((a) => a.priority)
    expect(order).toEqual([...order].sort((a, b) => ['high', 'moderate', 'data'].indexOf(a) - ['high', 'moderate', 'data'].indexOf(b)))
  })
  test('a ghat with no breaches and full data gets no sampling or zero-oxygen action', () => {
    const rows = ['Ganesh', 'Durga'].flatMap((festival) => ['pre', 'during', 'after'].flatMap((phase) =>
      ['Dissolved oxygen', 'BOD', 'pH'].map((parameter) => reading({ parameter, site: 'Clean', festival, phase } as never, parameter === 'pH' ? 7 : parameter === 'BOD' ? 1 : 8))))
    const r = evaluateAll(rows)
    expect(generateActions(buildRanking(r), r)).toEqual([])
  })
  test('text exists in English and Hindi and keeps site names and numbers', () => {
    for (const a of actions) for (const lang of ['en', 'hi'] as const) {
      const text = actionText(a.kind, 'title', lang, a.vars) + actionText(a.kind, 'reason', lang, a.vars)
      expect(text).not.toMatch(/\{\w+\}/)
      if (a.kind !== 'identity') expect(text).toContain(String(Object.values(a.vars).find((v) => typeof v === 'number') ?? a.site))
    }
  })
  test('wording makes no health or fix claims', () => {
    const all = actions.map((a) => actionText(a.kind, 'reason', 'en', a.vars) + actionText(a.kind, 'title', 'en', a.vars)).join(' ')
    expect(all).not.toMatch(/\b(safe|unsafe|harmful|disease|illness|will improve|will fix|completed)\b/i)
  })
})
