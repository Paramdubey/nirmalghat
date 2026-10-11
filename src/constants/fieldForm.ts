// The parameters a field agent records after a brief is carried out. Names match the MPPCB data.
// Units are the standard assumptions (the reports print none).
export interface FieldParameter {
  name: string
  unit: string
  /** DO, BOD and pH have a Class B limit, so the form insists on an answer for them. */
  core: boolean
  /** Upper sanity limit for a typed value. */
  max: number
}

export const FIELD_PARAMETERS: FieldParameter[] = [
  { name: 'pH', unit: '', core: true, max: 14 },
  { name: 'Dissolved oxygen', unit: 'mg/l', core: true, max: 30 },
  { name: 'BOD', unit: 'mg/l', core: true, max: 100000 },
  { name: 'COD', unit: 'mg/l', core: false, max: 1000000 },
  { name: 'Total solids', unit: 'mg/l', core: false, max: 1000000 },
  { name: 'Dissolved solids', unit: 'mg/l', core: false, max: 1000000 },
  { name: 'Suspended solids', unit: 'mg/l', core: false, max: 1000000 },
  { name: 'Turbidity', unit: 'NTU', core: false, max: 100000 },
  { name: 'Conductivity', unit: 'µS/cm', core: false, max: 1000000 },
  { name: 'Chromium', unit: 'mg/l', core: false, max: 10000 },
  { name: 'Lead', unit: 'mg/l', core: false, max: 10000 },
  { name: 'Zinc', unit: 'mg/l', core: false, max: 10000 },
  { name: 'Copper', unit: 'mg/l', core: false, max: 10000 },
]

export const FIELD_STAGES = ['pre', 'during', 'after'] as const
export type FieldStage = (typeof FIELD_STAGES)[number]

export type FieldReadingStatus = 'valid' | 'BDL' | 'ND' | 'not measured'

/** One answered row of the field form. `value` exists only when status is "valid". */
export interface FieldReading {
  parameter: string
  status: FieldReadingStatus
  value?: number
}

export interface FieldReport {
  /** Date the agent sampled (YYYY-MM-DD), typed by the agent. */
  sampledOn: string
  stage: FieldStage
  readings: FieldReading[]
  notes: string
}

/** Pure validation shared by the form and the server. Returns plain error codes, or an empty list if valid. */
export function validateFieldReport(r: unknown): string[] {
  const errors: string[] = []
  if (typeof r !== 'object' || r === null) return ['invalid']
  const x = r as Partial<FieldReport>
  if (typeof x.sampledOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.sampledOn) || Number.isNaN(Date.parse(x.sampledOn))) errors.push('date')
  if (!FIELD_STAGES.includes(x.stage as FieldStage)) errors.push('stage')
  if (typeof x.notes !== 'string' || x.notes.length > 1000) errors.push('notes')
  if (!Array.isArray(x.readings)) return [...errors, 'readings']
  for (const p of FIELD_PARAMETERS) {
    const row = x.readings.find((rd) => rd?.parameter === p.name)
    if (!row) { errors.push(`missing:${p.name}`); continue }
    if (!['valid', 'BDL', 'ND', 'not measured'].includes(row.status)) { errors.push(`status:${p.name}`); continue }
    if (row.status === 'valid') {
      if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > p.max) errors.push(`value:${p.name}`)
    } else if (row.value !== undefined) errors.push(`value:${p.name}`)
    if (p.core && row.status === 'not measured') errors.push(`core:${p.name}`)
  }
  if (x.readings.length !== FIELD_PARAMETERS.length) errors.push('readings')
  return errors
}
