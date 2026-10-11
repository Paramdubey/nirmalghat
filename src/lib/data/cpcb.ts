import Papa from 'papaparse'

export interface ClassBFromCsv {
  pH: { low: number; high: number } | null
  dissolvedOxygenMin: number | null
  bodMax: number | null
  totalColiformMax: number | null
}

/** Reads the Class B rows of cpcb_water_quality_criteria.csv (used to verify constants/cpcb.ts). */
export function parseClassB(text: string): ClassBFromCsv {
  const rows = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data
  const b = rows.filter((r) => r.class === 'B')
  const find = (name: string) => b.find((r) => r.parameter === name)
  const num = (name: string) => {
    const r = find(name)
    return r ? Number(r.limit) : null
  }
  const ph = find('pH')
  const [low, high] = ph ? ph.limit.split('-').map(Number) : []
  return {
    pH: low !== undefined && high !== undefined ? { low, high } : null,
    dissolvedOxygenMin: num('Dissolved oxygen'),
    bodMax: num('BOD (5 days 20C)'),
    totalColiformMax: num('Total coliform'),
  }
}
