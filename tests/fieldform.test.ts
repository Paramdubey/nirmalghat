import { describe, expect, test } from 'vitest'
import { FIELD_PARAMETERS, validateFieldReport, type FieldReport } from '../src/constants/fieldForm'
import { agentEmail, agentNameKey, PIN_PATTERN } from '../src/lib/supabase'

const goodReport = (): FieldReport => ({
  sampledOn: '2026-10-18', stage: 'pre', notes: '',
  readings: FIELD_PARAMETERS.map((p) => (p.core ? { parameter: p.name, status: 'valid' as const, value: 4.2 } : { parameter: p.name, status: 'not measured' as const })),
})

describe('field report validation', () => {
  test('accepts a complete report', () => expect(validateFieldReport(goodReport())).toEqual([]))
  test('BDL / ND / not measured never carry a number', () => {
    const r = goodReport()
    r.readings[3] = { parameter: 'COD', status: 'BDL', value: 0 }
    expect(validateFieldReport(r)).toContain('value:COD')
  })
  test('core parameters need an answer; values are range-checked; date and stage required', () => {
    const r = goodReport()
    r.readings[0] = { parameter: 'pH', status: 'valid', value: 19 }
    r.readings[2] = { parameter: 'BOD', status: 'not measured' }
    r.sampledOn = 'tomorrow'
    expect(validateFieldReport(r)).toEqual(expect.arrayContaining(['value:pH', 'core:BOD', 'date']))
    expect(validateFieldReport({ ...goodReport(), stage: 'later' })).toContain('stage')
  })
  test('a missing parameter row is rejected and a blank typed value is not a number', () => {
    const r = goodReport()
    r.readings = r.readings.slice(1)
    expect(validateFieldReport(r)).toEqual(expect.arrayContaining(['missing:pH', 'readings']))
    const blank = goodReport()
    blank.readings[1] = { parameter: 'Dissolved oxygen', status: 'valid', value: Number.NaN }
    expect(validateFieldReport(blank)).toContain('value:Dissolved oxygen')
  })
})

describe('agent sign-in identity', () => {
  test('the derived email is stable, case-insensitive and non-reversible', async () => {
    const a = await agentEmail('Squad A')
    expect(await agentEmail('  squad a ')).toBe(a)
    expect(await agentEmail('Squad B')).not.toBe(a)
    expect(a).toMatch(/^agent-[0-9a-f]{24}@agents\.example\.com$/)
    expect(a).not.toMatch(/squad/i)
  })
  test('works for Devanagari names', async () => {
    expect(await agentEmail('दल अ')).toMatch(/^agent-[0-9a-f]{24}@/)
    expect(agentNameKey(' Squad A ')).toBe('squad a')
  })
  test('PIN must be exactly six digits', () => {
    for (const ok of ['123456', '000000']) expect(PIN_PATTERN.test(ok)).toBe(true)
    for (const bad of ['1234', '1234567', '12345a', '', '12 456']) expect(PIN_PATTERN.test(bad)).toBe(false)
  })
})
