import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { generateActions } from '../src/lib/actions/generate'
import { briefToText, briefsToText, generateBrief } from '../src/lib/brief/generate'
import { formatDate } from '../src/lib/format'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { buildRanking } from '../src/lib/risk/rank'
import { summarise } from '../src/lib/risk/summary'

const results = evaluateAll(parseBhopalCsv(readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')).readings)
const ranking = buildRanking(results)
const actions = generateActions(ranking, results)
const input = (included = actions.slice(0, 2)) => ({
  ranking, summary: summarise(ranking, results), actions: included,
  years: { from: 2023, to: 2025 }, today: new Date(2026, 9, 11), visarjan: new Date(2026, 9, 20), daysToGo: 9,
})
const en = generateBrief(input(), 'en')
const hi = generateBrief(input(), 'hi')

describe('officer brief', () => {
  test('has every required section in both languages', () => {
    for (const b of [en, hi]) expect(b.sections.map((s) => s.id)).toEqual(['purpose', 'top', 'readings', 'caveats', 'actions'])
  })
  test('is deterministic', () => {
    expect(briefToText(generateBrief(input(), 'hi'))).toBe(briefToText(hi))
  })
  test('names the top three ghats exactly as in the data, in both languages', () => {
    for (const b of [en, hi]) {
      const text = briefToText(b)
      for (const r of ranking.slice(0, 3)) expect(text).toContain(r.site)
    }
  })
  test('numbers, units and source pages are preserved in Hindi', () => {
    const top = ranking[0]
    const text = briefToText(hi)
    expect(text).toContain(`${top.lowestDo?.value} mg/l`)
    expect(text).toContain(`${top.highestBod?.value} mg/l`)
    expect(text).toContain(`पृ. ${top.lowestDo?.sourcePage}`)
    expect(briefToText(en)).toContain(`p. ${top.lowestDo?.sourcePage}`)
    expect(text).toContain('5 mg/l')
    expect(text).toContain('6.5–8.5')
  })
  test('Hindi brief is actually Hindi', () => {
    expect(hi.title).toMatch(/[ऀ-ॿ]/)
    expect(briefToText(hi)).toMatch(/[ऀ-ॿ]{10}/)
  })
  test('missing Durga 2025 tables and site identity appear as caveats', () => {
    for (const b of [en, hi]) {
      const caveats = b.sections.find((s) => s.id === 'caveats')!.bullets.join('\n')
      expect(caveats).toContain('Bairagarh')
      expect(caveats).toContain('Malikhedi')
      expect(caveats).toContain('Rani Kamlapati')
      expect(caveats).toContain('2025')
    }
    expect(briefToText(en)).toMatch(/not clean/)
  })
  test('carries the "historical is not current" note and the decision-support statement', () => {
    expect(en.closing).toMatch(/do not establish current water conditions/)
    expect(en.sections[0].paragraphs[0]).toMatch(/not an official regulatory determination/)
    expect(hi.closing).toContain('वर्तमान जल स्थिति सिद्ध नहीं करते')
  })
  test('only the included actions appear; none selected says so', () => {
    expect(en.sections.find((s) => s.id === 'actions')!.bullets).toHaveLength(2)
    const none = generateBrief(input([]), 'en')
    expect(none.sections.find((s) => s.id === 'actions')!.paragraphs[0]).toMatch(/No actions were selected/)
  })
  test('no unfilled placeholders and no safety or health wording', () => {
    for (const text of [briefToText(en), briefToText(hi)]) {
      expect(text).not.toMatch(/\{\w+\}/)
      expect(text).not.toMatch(/\b(safe|unsafe|harmful|disease|illness)\b/i)
    }
  })
  test('bilingual text contains both briefs', () => {
    const both = briefsToText([en, hi])
    expect(both).toContain(en.title)
    expect(both).toContain(hi.title)
  })
  test('countdown and dates', () => {
    expect(en.dateLine).toContain('11 Oct 2026')
    expect(en.dateLine).toContain('9 days to go')
    expect(generateBrief({ ...input(), daysToGo: 0 }, 'en').dateLine).not.toContain('days to go')
    expect(formatDate(new Date(2026, 9, 20), 'hi')).toBe('20 अक्टूबर 2026')
  })
})
