import type { Festival, Phase, Reading } from '../src/types'

export function reading(over: Partial<Reading> & { parameter: string }, value: number | 'BDL' | 'ND' | null): Reading {
  const base = {
    csvLine: 2, year: 2025, festival: 'Ganesh' as Festival, phase: 'pre' as Phase,
    site: 'Test ghat', waterBody: 'Test Lake', unit: '', flag: '', valueAsPrinted: String(value ?? ''),
    parameterAsPrinted: over.parameter, siteAsPrinted: 'Test ghat, Bhopal',
    siteMatchConfidence: 'high' as const, sourcePage: '12',
  }
  if (value === null) return { ...base, ...over, status: 'missing' } as Reading
  if (value === 'BDL' || value === 'ND') return { ...base, ...over, status: value } as Reading
  return { ...base, ...over, status: 'valid', value } as Reading
}
