import {
  DO_ZERO_SEVERITY, HIGH_PRIORITY_MIN, MIN_VALID_CORE_READINGS, MODERATE_PRIORITY_MIN,
  PARAMETER_WEIGHT, RECENCY_STEP, RECURRENCE_PER_EVENT, SEVERITY_CAP,
} from '../../constants/weights'
import type { GapFlag, ObservationRef, ReadingResult, RiskLabel, SiteRisk } from '../../types'
import { CHECKED_PARAMETERS } from '../../constants/cpcb'
import { compareObservations, describeRef, eventKey, listEvents, PHASES, toRef, type FestivalEvent } from './events'
import { isBreach } from './evaluate'

/** Severity 1 (just past the limit) to SEVERITY_CAP (far past), from valid numbers only. */
export function severity(parameter: string, value: number): number {
  const scale = (distance: number, unit: number) => 1 + Math.min(distance / unit, SEVERITY_CAP - 1)
  switch (parameter) {
    case 'Dissolved oxygen':
      return value === 0 ? DO_ZERO_SEVERITY : scale(5 - value, 2.5)
    case 'BOD':
      return scale(value - 3, 3)
    case 'pH':
      return scale(value < 6.5 ? 6.5 - value : value - 8.5, 1)
    default:
      return 0
  }
}

export function recency(year: number, newestYear: number): number {
  return Math.max(0, 1 - RECENCY_STEP * (newestYear - year))
}

export function labelFromScore(score: number): RiskLabel {
  if (score >= HIGH_PRIORITY_MIN) return 'High priority'
  if (score >= MODERATE_PRIORITY_MIN) return 'Moderate priority'
  return 'Lower observed concern'
}

export interface RankingContext {
  /** Every festival in the full dataset; a site missing one has "no table" for it. */
  events: FestivalEvent[]
  newestYear: number
}

export function contextFrom(all: ReadingResult[]): RankingContext {
  const events = listEvents(all.map((r) => r.reading))
  return { events, newestYear: Math.max(...events.map((e) => e.year)) }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function explain(risk: Pick<SiteRisk, 'label' | 'doBreachCount' | 'validDo' | 'bodBreachCount' | 'validBod' | 'phBreachCount' | 'lowestDo' | 'highestBod' | 'gaps'>): string {
  const parts: string[] = []
  if (risk.doBreachCount > 0 && risk.lowestDo) {
    parts.push(`Dissolved oxygen was below the CPCB Class B reference value (5 mg/l) in ${risk.doBreachCount} of ${risk.validDo} recorded samples, lowest ${risk.lowestDo.value} mg/l (${describeRef(risk.lowestDo)}).`)
  }
  if (risk.bodBreachCount > 0 && risk.highestBod) {
    parts.push(`BOD was above the Class B reference value (3 mg/l) in ${risk.bodBreachCount} of ${risk.validBod} recorded samples, highest ${risk.highestBod.value} mg/l (${describeRef(risk.highestBod)}).`)
  }
  if (risk.phBreachCount > 0) parts.push(`pH was outside 6.5–8.5 in ${risk.phBreachCount} recorded samples.`)
  if (parts.length === 0) {
    parts.push(risk.label === 'Insufficient data' ? 'Too little recorded evidence to rank this ghat.' : 'No Class B breaches in the recorded DO, BOD or pH readings.')
  }
  parts.push(risk.label === 'High priority' || risk.label === 'Moderate priority'
    ? 'Additional assessment is recommended; current water conditions are unknown.'
    : 'This says nothing about current water conditions.')
  return parts.join(' ')
}

const isCore = (r: ReadingResult) => (CHECKED_PARAMETERS as readonly string[]).includes(r.reading.parameter)

/**
 * Readings are scored per reading, not summed, so a ghat with fewer valid readings (for example a
 * missing 2025 Durga table) is not ranked lower just for having fewer chances to collect points.
 * Raw points are averaged over the ghat's valid readings and scaled to the reading count of a ghat
 * with full coverage. For a ghat with full coverage the factor is 1 and nothing changes.
 */
export function scaleFactor(validReadings: number, referenceReadings: number): number {
  return validReadings === 0 ? 0 : referenceReadings / validReadings
}

/** Recurrence bonus per festival-year with data, scaled to the number of festival-years in the whole dataset. */
export function recurrenceScaled(breachEvents: number, eventsWithData: number, eventsAll: number): number {
  return eventsWithData === 0 ? 0 : ((RECURRENCE_PER_EVENT * breachEvents) / eventsWithData) * eventsAll
}

export const referenceReadings = (ctx: RankingContext) => ctx.events.length * PHASES.length * CHECKED_PARAMETERS.length

/**
 * `results` is what the user is looking at (possibly filtered): it drives score and breach counts.
 * `all` is the site's full data: it drives data-gap flags and completeness, which describe the
 * site's records, not the current view.
 */
export function scoreSite(site: string, results: ReadingResult[], ctx: RankingContext, all: ReadingResult[]): SiteRisk {
  const own = results.filter((r) => r.reading.site === site)
  const first = own[0]?.reading
  const core = own.filter(isCore)
  const allOwn = all.filter((r) => r.reading.site === site)
  const allCore = allOwn.filter(isCore)

  const points = { 'Dissolved oxygen': 0, BOD: 0, pH: 0 }
  const breachEvents = new Set<string>()
  const counts = { 'Dissolved oxygen': 0, BOD: 0, pH: 0 }
  let validDo = 0
  let validBod = 0
  let lowestDo: SiteRisk['lowestDo'] = null
  let highestBod: SiteRisk['highestBod'] = null
  let latest: ObservationRef | null = null

  for (const r of core) {
    const reading = r.reading
    if (reading.status !== 'valid') continue
    if (reading.parameter === 'Dissolved oxygen') {
      validDo++
      if (!lowestDo || reading.value < lowestDo.value) lowestDo = { ...toRef(reading), value: reading.value }
    }
    if (reading.parameter === 'BOD') {
      validBod++
      if (!highestBod || reading.value > highestBod.value) highestBod = { ...toRef(reading), value: reading.value }
    }
    const ref = toRef(reading)
    if (!latest || compareObservations(ref, latest) > 0) latest = ref
    if (!isBreach(r.result)) continue
    const key = reading.parameter as keyof typeof counts
    counts[key]++
    points[key] += PARAMETER_WEIGHT[key] * severity(reading.parameter, reading.value) * recency(reading.year, ctx.newestYear)
    if (reading.parameter !== 'pH') breachEvents.add(eventKey(reading))
  }
  const scoredValid = core.filter((r) => r.reading.status === 'valid').length
  const factor = scaleFactor(scoredValid, referenceReadings(ctx))
  const eventsWithData = new Set(own.map((r) => eventKey(r.reading))).size
  const recurrencePoints = recurrenceScaled(breachEvents.size, eventsWithData, ctx.events.length)
  const score = (points['Dissolved oxygen'] + points.BOD + points.pH) * factor + recurrencePoints

  // Data confidence: kept separate from the score. Gaps can only flag, never lower risk.
  const gaps: GapFlag[] = []
  const siteEvents = new Set(allOwn.map((r) => eventKey(r.reading)))
  for (const e of ctx.events.filter((e) => !siteEvents.has(eventKey(e)))) {
    gaps.push({ code: 'no-table', text: `no ${e.year} ${e.festival} table in the report`, detail: eventKey(e) })
  }
  if (first?.siteMatchConfidence === 'medium') {
    gaps.push({ code: 'medium-match', text: 'site name matched with medium confidence (may cover two places)' })
  }
  const validCore = allCore.filter((r) => r.reading.status === 'valid').length
  const missingPhases = [...siteEvents].flatMap((key) =>
    PHASES.filter((p) => !allCore.some((r) => eventKey(r.reading) === key && r.reading.phase === p && r.reading.status === 'valid')).map((p) => `${key} ${p}`))
  if (missingPhases.length > 0) {
    gaps.push({ code: 'missing-phases', text: `no valid DO/BOD/pH reading for ${missingPhases.length} sampling stage(s)`, detail: String(missingPhases.length) })
  }
  if (validCore < MIN_VALID_CORE_READINGS) {
    gaps.push({ code: 'few-readings', text: `only ${validCore} valid DO/BOD/pH readings` })
  }

  const evidenceLabel = labelFromScore(score)
  const tooFew = validCore < MIN_VALID_CORE_READINGS
  // A low score only means "lower observed concern" when the evidence is solid; otherwise it is "Insufficient data", never "low".
  const label: RiskLabel = tooFew || (evidenceLabel === 'Lower observed concern' && gaps.length > 0) ? 'Insufficient data' : evidenceLabel

  const totalExpected = ctx.events.length * PHASES.length * CHECKED_PARAMETERS.length
  const risk: SiteRisk = {
    site,
    waterBody: first?.waterBody ?? '',
    matchConfidence: first?.siteMatchConfidence ?? 'high',
    label,
    score: round1(score),
    breakdown: { doPoints: round1(points['Dissolved oxygen'] * factor), bodPoints: round1(points.BOD * factor), phPoints: round1(points.pH * factor), recurrencePoints: round1(recurrencePoints) },
    readingsUsed: scoredValid,
    breachCount: counts['Dissolved oxygen'] + counts.BOD + counts.pH,
    doBreachCount: counts['Dissolved oxygen'],
    bodBreachCount: counts.BOD,
    phBreachCount: counts.pH,
    validDo, validBod, lowestDo, highestBod,
    latestObservation: latest,
    gaps,
    completeness: totalExpected === 0 ? 0 : Math.round((validCore / totalExpected) * 100) / 100,
    explanation: '',
  }
  return { ...risk, explanation: explain(risk) }
}

export interface ScoreRow {
  parameter: 'Dissolved oxygen' | 'BOD' | 'pH'
  value: number
  unit: string
  year: number
  festival: string
  phase: string
  sourcePage: string
  weight: number
  severity: number
  recency: number
  points: number
}

export interface ScoreExplanation {
  site: string
  rows: ScoreRow[]
  byParameter: { parameter: ScoreRow['parameter']; count: number; points: number }[]
  /** Festival-years with a DO or BOD breach, each worth RECURRENCE_PER_EVENT before scaling. */
  events: string[]
  /** Sum of the row points, before scaling. */
  rawReadingPoints: number
  /** Valid DO/BOD/pH readings behind the score, and the reading count of a full-coverage ghat. */
  validReadings: number
  referenceReadings: number
  /** referenceReadings / validReadings. */
  factor: number
  readingScore: number
  recurrenceRaw: number
  eventsWithData: number
  eventsAll: number
  /** Recurrence after scaling to the number of festival-years in the whole dataset. */
  recurrencePoints: number
  total: number
  label: RiskLabel
  newestYear: number
  /** Readings that could not count, by kind. */
  notCounted: { missing: number; bdl: number; nd: number; noLimit: number }
}

/**
 * Every step of a ghat's score, row by row, so it can be shown and checked.
 * The total matches SiteRisk.score (same rules, same unrounded sum).
 */
export function explainScore(site: string, results: ReadingResult[], ctx: RankingContext): ScoreExplanation {
  const own = results.filter((r) => r.reading.site === site)
  const rows: ScoreRow[] = []
  const events = new Set<string>()
  for (const r of own) {
    const d = r.reading
    if (d.status !== 'valid' || !isBreach(r.result) || !(d.parameter in PARAMETER_WEIGHT)) continue
    const parameter = d.parameter as ScoreRow['parameter']
    const weight = PARAMETER_WEIGHT[parameter]
    const sev = severity(parameter, d.value)
    const rec = recency(d.year, ctx.newestYear)
    rows.push({
      parameter, value: d.value, unit: d.unit, year: d.year, festival: d.festival, phase: d.phase, sourcePage: d.sourcePage,
      weight, severity: sev, recency: rec, points: weight * sev * rec,
    })
    if (parameter !== 'pH') events.add(eventKey(d))
  }
  rows.sort((a, b) => b.points - a.points)
  const parameters = ['Dissolved oxygen', 'BOD', 'pH'] as const
  const rawReadingPoints = rows.reduce((n, r) => n + r.points, 0)
  const validReadings = own.filter((r) => isCore(r) && r.reading.status === 'valid').length
  const reference = referenceReadings(ctx)
  const factor = scaleFactor(validReadings, reference)
  const eventsWithData = new Set(own.map((r) => eventKey(r.reading))).size
  const recurrencePoints = recurrenceScaled(events.size, eventsWithData, ctx.events.length)
  const readingScore = rawReadingPoints * factor
  const total = readingScore + recurrencePoints
  const risk = scoreSite(site, results, ctx, results)
  const countStatus = (status: string) => own.filter((r) => r.reading.status === status).length
  return {
    site,
    rows,
    byParameter: parameters.map((parameter) => {
      const mine = rows.filter((r) => r.parameter === parameter)
      return { parameter, count: mine.length, points: mine.reduce((n, r) => n + r.points, 0) }
    }),
    events: [...events].sort(),
    rawReadingPoints, validReadings, referenceReadings: reference, factor, readingScore,
    recurrenceRaw: RECURRENCE_PER_EVENT * events.size, eventsWithData, eventsAll: ctx.events.length,
    recurrencePoints,
    total,
    label: risk.label,
    newestYear: ctx.newestYear,
    notCounted: {
      missing: countStatus('missing'), bdl: countStatus('BDL'), nd: countStatus('ND'),
      noLimit: own.filter((r) => r.result === 'no threshold').length,
    },
  }
}
