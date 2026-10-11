import Papa from 'papaparse'
import type { Festival, LoadIssue, MatchConfidence, Phase, Reading } from '../../types'

export const REQUIRED_COLUMNS = [
  'year', 'festival', 'site', 'water_body', 'phase', 'parameter', 'value', 'unit_assumed',
  'flag', 'value_as_printed', 'parameter_as_printed', 'site_as_printed', 'site_match_confidence', 'source_page',
] as const

const FESTIVALS: Festival[] = ['Ganesh', 'Durga']
const PHASES: Phase[] = ['pre', 'during', 'after']
const CONFIDENCES: MatchConfidence[] = ['high', 'medium']

type Row = Record<string, string | undefined>

export interface ParseResult {
  readings: Reading[]
  issues: LoadIssue[]
}

function isMissingCode(raw: string): boolean {
  return ['', '_', '-', '*', '**', 'not sampled'].includes(raw.trim().toLowerCase())
}

/** BDL / ND can come from `flag` or, when `value` is empty, from the printed text. */
function statusFromText(...texts: string[]): 'BDL' | 'ND' | null {
  for (const text of texts) {
    const upper = text.trim().toUpperCase()
    if (upper === 'BDL') return 'BDL'
    if (upper === 'ND') return 'ND'
  }
  return null
}

/** Pure: CSV text in, typed readings + validation issues out. Never throws on bad rows and never drops them silently. */
export function parseBhopalCsv(text: string): ParseResult {
  const issues: LoadIssue[] = []
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true })

  const columns = parsed.meta.fields ?? []
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !columns.includes(c))
  for (const c of missingColumns) issues.push({ severity: 'error', message: `Missing column: ${c}` })
  for (const c of columns.filter((c) => !(REQUIRED_COLUMNS as readonly string[]).includes(c))) {
    issues.push({ severity: 'warning', message: `Unexpected column ignored: ${c}` })
  }
  if (missingColumns.length > 0) return { readings: [], issues }

  const readings: Reading[] = []
  parsed.data.forEach((row, index) => {
    const csvLine = index + 2
    const skip = (message: string) => issues.push({ severity: 'error', message: `${message} — row not loaded`, csvLine })

    const year = Number(row.year)
    const festival = FESTIVALS.find((f) => f === row.festival)
    const phase = PHASES.find((p) => p === row.phase)
    const confidence = CONFIDENCES.find((c) => c === row.site_match_confidence)
    if (!Number.isInteger(year)) return skip(`Invalid year "${row.year}"`)
    if (!festival) return skip(`Unknown festival "${row.festival}"`)
    if (!phase) return skip(`Unknown phase "${row.phase}"`)
    if (!confidence) return skip(`Unknown site_match_confidence "${row.site_match_confidence}"`)
    if (!row.site || !row.parameter) return skip('Missing site or parameter')

    const base = {
      csvLine, year, festival, phase,
      site: row.site,
      waterBody: row.water_body ?? '',
      parameter: row.parameter,
      unit: row.unit_assumed ?? '',
      flag: row.flag ?? '',
      valueAsPrinted: row.value_as_printed ?? '',
      parameterAsPrinted: row.parameter_as_printed ?? '',
      siteAsPrinted: row.site_as_printed ?? '',
      siteMatchConfidence: confidence,
      sourcePage: row.source_page ?? '',
    }
    if (base.sourcePage === '') {
      issues.push({ severity: 'warning', message: 'Reading has no source page', csvLine })
    }

    const rawValue = (row.value ?? '').trim()
    if (rawValue !== '') {
      const value = Number(rawValue)
      if (Number.isFinite(value)) {
        readings.push({ ...base, status: 'valid', value })
      } else {
        issues.push({ severity: 'warning', message: `Non-numeric value "${rawValue}" treated as missing`, csvLine })
        readings.push({ ...base, status: 'missing' })
      }
      return
    }

    const coded = statusFromText(base.flag, base.valueAsPrinted)
    if (coded) {
      readings.push({ ...base, status: coded })
      return
    }
    if (!isMissingCode(base.flag) && !isMissingCode(base.valueAsPrinted)) {
      issues.push({ severity: 'warning', message: `Unrecognised code "${base.flag || base.valueAsPrinted}" treated as missing`, csvLine })
    }
    readings.push({ ...base, status: 'missing' })
  })

  return { readings, issues }
}
