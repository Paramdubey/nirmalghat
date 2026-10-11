export type Festival = 'Ganesh' | 'Durga'
export type Phase = 'pre' | 'during' | 'after'
export type MatchConfidence = 'high' | 'medium'

interface ReadingBase {
  /** 1-based line in the CSV file (header = line 1), for tracing loader warnings. */
  csvLine: number
  year: number
  festival: Festival
  phase: Phase
  site: string
  waterBody: string
  parameter: string
  unit: string
  flag: string
  valueAsPrinted: string
  parameterAsPrinted: string
  siteAsPrinted: string
  siteMatchConfidence: MatchConfidence
  sourcePage: string
}

/**
 * A reading is either a real number or a status. Only `valid` carries a number,
 * so missing / BDL / ND can never be used as a value by accident.
 */
export type Reading = ReadingBase &
  (
    | { status: 'valid'; value: number }
    | { status: 'BDL' }
    | { status: 'ND' }
    | { status: 'missing' }
  )

export type Criterion =
  | { kind: 'min'; parameter: string; limit: number; unit: string; label: string }
  | { kind: 'max'; parameter: string; limit: number; unit: string; label: string }
  | { kind: 'range'; parameter: string; low: number; high: number; unit: string; label: string }

export type ResultKind =
  | 'below criterion'
  | 'within'
  | 'above criterion'
  | 'outside range'
  | 'no threshold'
  | 'not sampled'
  | 'BDL'
  | 'ND'

export interface ReadingResult {
  reading: Reading
  criterion: Criterion | null
  result: ResultKind
  /** Plain-language caveats for this reading (e.g. medium site-match). */
  notes: string[]
}

export type RiskLabel =
  | 'High priority'
  | 'Moderate priority'
  | 'Lower observed concern'
  | 'Insufficient data'

export interface ObservationRef {
  year: number
  festival: Festival
  phase: Phase
  sourcePage: string
}

export interface GapFlag {
  code: 'no-table' | 'medium-match' | 'missing-phases' | 'few-readings'
  text: string
  /** Machine-readable detail: the missing festival ("2025 Durga") or the count of unsampled stages. */
  detail?: string
}

export interface SiteRisk {
  site: string
  waterBody: string
  matchConfidence: MatchConfidence
  label: RiskLabel
  /** Observed-evidence score only. Data gaps never change it. */
  score: number
  /** Where the score comes from, so the ranking can be explained. */
  breakdown: { doPoints: number; bodPoints: number; phPoints: number; recurrencePoints: number }
  /** Valid DO/BOD/pH readings the score is based on. */
  readingsUsed: number
  breachCount: number
  doBreachCount: number
  bodBreachCount: number
  phBreachCount: number
  validDo: number
  validBod: number
  lowestDo: (ObservationRef & { value: number }) | null
  highestBod: (ObservationRef & { value: number }) | null
  latestObservation: ObservationRef | null
  gaps: GapFlag[]
  /** Share of expected DO/BOD/pH readings that are real numbers (0–1). */
  completeness: number
  explanation: string
}

export interface Filters {
  /** Empty array = no restriction. */
  sites: string[]
  festivals: Festival[]
  years: number[]
  phases: Phase[]
  parameters: string[]
  labels: RiskLabel[]
  uncertainOnly: boolean
}

export type SortKey = 'priority' | 'latest' | 'breaches'

export interface LoadIssue {
  severity: 'error' | 'warning'
  message: string
  csvLine?: number
}
