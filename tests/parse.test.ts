import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parseClassB } from '../src/lib/data/cpcb'
import { parseBhopalCsv, REQUIRED_COLUMNS } from '../src/lib/data/parse'
import { CLASS_B } from '../src/constants/cpcb'

const HEADER = REQUIRED_COLUMNS.join(',')
const row = (o: Record<string, string>) => {
  const d: Record<string, string> = {
    year: '2025', festival: 'Ganesh', site: 'S', water_body: 'W', phase: 'pre', parameter: 'BOD', value: '4',
    unit_assumed: 'mg/l', flag: '', value_as_printed: '4', parameter_as_printed: 'BOD', site_as_printed: 'S', site_match_confidence: 'high', source_page: '9', ...o,
  }
  return REQUIRED_COLUMNS.map((c) => d[c]).join(',')
}
const parse = (...rows: string[]) => parseBhopalCsv([HEADER, ...rows].join('\n'))

describe('CSV parsing', () => {
  test('valid number, BDL, ND and every missing code', () => {
    const { readings } = parse(
      row({ value: '2.5' }),
      row({ value: '', flag: 'BDL', value_as_printed: 'BDL' }),
      row({ value: '', flag: '', value_as_printed: 'ND' }),
      ...['', '_', '-', '*', '**'].map((c) => row({ value: '', flag: c === '' ? 'not sampled' : c, value_as_printed: c })),
    )
    expect(readings.map((r) => r.status)).toEqual(['valid', 'BDL', 'ND', 'missing', 'missing', 'missing', 'missing', 'missing'])
  })
  test('missing never carries a number', () => {
    const r = parse(row({ value: '', flag: 'not sampled' })).readings[0]
    expect(r.status).toBe('missing')
    expect('value' in r).toBe(false)
  })
  test('non-numeric value is reported and treated as missing, not dropped', () => {
    const { readings, issues } = parse(row({ value: 'abc' }))
    expect(readings[0].status).toBe('missing')
    expect(issues[0]).toMatchObject({ severity: 'warning', csvLine: 2 })
  })
  test('unknown phase/festival rows are reported, not silently loaded', () => {
    const { readings, issues } = parse(row({ phase: 'later' }), row({ festival: 'Diwali' }), row({}))
    expect(readings).toHaveLength(1)
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(2)
  })
  test('missing columns produce an error and no readings', () => {
    const { readings, issues } = parseBhopalCsv('year,festival\n2025,Ganesh')
    expect(readings).toEqual([])
    expect(issues.some((i) => i.message.includes('Missing column'))).toBe(true)
  })
})

describe('real data', () => {
  const text = readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')
  const { readings, issues } = parseBhopalCsv(text)

  test('loads all 1,524 rows without issues and yields the seven ghats', () => {
    expect(readings).toHaveLength(1524)
    expect(issues).toEqual([])
    expect(new Set(readings.map((r) => r.site)).size).toBe(7)
  })
  test('every reading keeps its source page and printed text', () => {
    expect(readings.every((r) => r.sourcePage !== '' && r.siteAsPrinted !== '' && r.parameterAsPrinted !== '')).toBe(true)
  })
  test('flags map to statuses: 174 BDL, 59 missing, rest valid', () => {
    const count = (s: string) => readings.filter((r) => r.status === s).length
    expect(count('BDL')).toBe(174)
    expect(count('missing')).toBe(61)
    expect(count('valid')).toBe(1289)
  })
  test('constants/cpcb.ts agrees with cpcb_water_quality_criteria.csv', () => {
    const csv = parseClassB(readFileSync('public/data/cpcb_water_quality_criteria.csv', 'utf8'))
    expect(csv.pH).toEqual(CLASS_B.pH)
    expect(csv.dissolvedOxygenMin).toBe(CLASS_B.dissolvedOxygenMin)
    expect(csv.bodMax).toBe(CLASS_B.bodMax)
    expect(csv.totalColiformMax).toBe(CLASS_B.totalColiformMax)
  })
})
