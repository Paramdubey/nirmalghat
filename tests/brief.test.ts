import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { generateActions } from '../src/lib/actions/generate'
import { briefToText, briefsToText, generateFieldBrief } from '../src/lib/brief/generate'
import { formatDate } from '../src/lib/format'
import { parseBhopalCsv } from '../src/lib/data/parse'
import { evaluateAll } from '../src/lib/risk/evaluate'
import { buildRanking } from '../src/lib/risk/rank'
import { agentsForGhat } from '../src/store/agents'

const results = evaluateAll(parseBhopalCsv(readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')).readings)
const ranking = buildRanking(results)
const actions = generateActions(ranking, results)
const bairagarh = ranking.find((r) => r.site.startsWith('Bairagarh'))!
const own = actions.filter((a) => a.site === bairagarh.site)
const input = (agent: string | null = 'Squad A', picked = own) => ({
  risk: bairagarh, actions: picked, agent, today: new Date(2026, 9, 11), visarjan: new Date(2026, 9, 20), daysToGo: 9,
})
const en = generateFieldBrief(input(), 'en')
const hi = generateFieldBrief(input(), 'hi')

describe('field brief', () => {
  test('has every section in both languages and is deterministic', () => {
    for (const b of [en, hi]) expect(b.sections.map((s) => s.id)).toEqual(['why', 'tasks', 'limits', 'bring'])
    expect(briefToText(generateFieldBrief(input(), 'hi'))).toBe(briefToText(hi))
  })
  test('is about one ghat: its name, numbers and source pages are preserved in Hindi', () => {
    const text = briefToText(hi)
    expect(hi.title).toContain(bairagarh.site)
    expect(text).toContain(`${bairagarh.lowestDo?.value} mg/l`)
    expect(text).toContain(`पृ. ${bairagarh.lowestDo?.sourcePage}`)
    expect(briefToText(en)).toContain(`p. ${bairagarh.lowestDo?.sourcePage}`)
    expect(text).toMatch(/[ऀ-ॿ]{10}/)
  })
  test('names the chosen field agent, or says none was specified', () => {
    expect(en.forLine).toContain('Squad A')
    expect(hi.forLine).toContain('Squad A')
    expect(generateFieldBrief(input(null), 'en').forLine).toMatch(/not specified/)
  })
  test('lists only the selected actions and their evidence-to-bring-back', () => {
    const one = generateFieldBrief(input('A', own.slice(0, 1)), 'en')
    expect(one.sections.find((s) => s.id === 'tasks')!.bullets).toHaveLength(1)
    expect(one.sections.find((s) => s.id === 'bring')!.bullets).toHaveLength(1)
    const none = generateFieldBrief(input('A', []), 'en')
    expect(none.sections.find((s) => s.id === 'tasks')!.paragraphs[0]).toMatch(/No tasks were selected/)
  })
  test('data limits are this ghat only: missing Durga 2025 table, not other ghats', () => {
    const limits = en.sections.find((s) => s.id === 'limits')!.bullets.join('\n')
    expect(limits).toContain('2025 Durga')
    expect(limits).toMatch(/unknown, not clean/)
    expect(limits).not.toContain('Rani Kamlapati')
    expect(limits).not.toContain('Malikhedi')
  })
  test('says it is a draft and that historical is not current; no health or safety wording', () => {
    expect(en.draftLine).toMatch(/Nothing has been sent or recorded as an assignment/)
    expect(en.closing).toMatch(/do not establish current water conditions/)
    for (const text of [briefToText(en), briefToText(hi)]) {
      expect(text).not.toMatch(/\{\w+\}/)
      expect(text).not.toMatch(/\b(safe|unsafe|harmful|disease|illness|assigned to)\b/i)
    }
  })
  test('bilingual text contains both and dates are formatted', () => {
    const both = briefsToText([en, hi])
    expect(both).toContain(en.title)
    expect(both).toContain(hi.title)
    expect(en.dateLine).toContain('9 days to go')
    expect(formatDate(new Date(2026, 9, 20), 'hi')).toBe('20 अक्टूबर 2026')
  })
})

describe('field agent roster', () => {
  test('only agents linked to a ghat are offered for it', () => {
    const agents = [
      { id: '1', name: 'Squad A', ghats: ['Khatlapura ghat', 'Prempura ghat'] },
      { id: '2', name: 'Squad B', ghats: ['Malikhedi kund'] },
    ]
    expect(agentsForGhat(agents, 'Khatlapura ghat').map((a) => a.name)).toEqual(['Squad A'])
    expect(agentsForGhat(agents, 'Malikhedi kund').map((a) => a.name)).toEqual(['Squad B'])
    expect(agentsForGhat(agents, 'Shahpura lake ghat')).toEqual([])
  })
})
