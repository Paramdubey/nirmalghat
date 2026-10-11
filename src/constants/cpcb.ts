import type { Criterion } from '../types'

// CPCB Class B (outdoor bathing). A test checks these against cpcb_water_quality_criteria.csv.
export const CLASS_B = {
  pH: { low: 6.5, high: 8.5 },
  dissolvedOxygenMin: 5,
  bodMax: 3,
  totalColiformMax: 500,
} as const

export const CRITERIA: Record<string, Criterion> = {
  pH: { kind: 'range', parameter: 'pH', low: CLASS_B.pH.low, high: CLASS_B.pH.high, unit: '', label: 'CPCB Class B: 6.5–8.5' },
  'Dissolved oxygen': { kind: 'min', parameter: 'Dissolved oxygen', limit: CLASS_B.dissolvedOxygenMin, unit: 'mg/l', label: 'CPCB Class B: 5 mg/l or more' },
  BOD: { kind: 'max', parameter: 'BOD', limit: CLASS_B.bodMax, unit: 'mg/l', label: 'CPCB Class B: 3 mg/l or less' },
}

export const NO_LIMIT_TEXT = 'No Class B limit set'

// Parameters with a Class B limit that this dataset can be checked against.
export const CHECKED_PARAMETERS = ['pH', 'Dissolved oxygen', 'BOD'] as const
