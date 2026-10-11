import type { ReadingResult, SiteRisk } from '../../types'

export type ActionKind = 'resample' | 'zero-do' | 'missing-table' | 'identity' | 'missing-stages'
export type ActionPriority = 'high' | 'moderate' | 'data'

export interface SupportingReading {
  parameter: string
  /** Number and unit exactly as recorded, e.g. "0 mg/l". */
  valueText: string
  year: number
  festival: string
  phase: string
  sourcePage: string
}

/** A proposal derived from computed evidence. There is deliberately no status field: nothing is ever assigned or done. */
export interface ProposedAction {
  id: string
  kind: ActionKind
  site: string
  priority: ActionPriority
  /** Values for the text templates in constants/actionText.ts. */
  vars: Record<string, string | number>
  supporting: SupportingReading[]
}

const PRIORITY_ORDER: Record<ActionPriority, number> = { high: 0, moderate: 1, data: 2 }

function supportingFrom(r: ReadingResult): SupportingReading {
  const x = r.reading
  const value = x.status === 'valid' ? x.value : r.result
  return { parameter: x.parameter, valueText: `${value}${x.unit ? ` ${x.unit}` : ''}`, year: x.year, festival: x.festival, phase: x.phase, sourcePage: x.sourcePage }
}

/** Pure: ranking + readings in, proposed actions out. Same input always gives the same list. */
export function generateActions(ranking: SiteRisk[], results: ReadingResult[]): ProposedAction[] {
  const actions: ProposedAction[] = []
  const rankOf = new Map(ranking.map((r, i) => [r.site, i]))

  for (const risk of ranking) {
    const own = results.filter((r) => r.reading.site === risk.site)
    const add = (kind: ActionKind, priority: ActionPriority, vars: Record<string, string | number>, supporting: SupportingReading[], suffix = '') =>
      actions.push({ id: `${risk.site}|${kind}${suffix}`, kind, site: risk.site, priority, vars: { site: risk.site, ...vars }, supporting })

    const ranked = risk.label === 'High priority' || risk.label === 'Moderate priority'
    if (ranked && risk.doBreachCount + risk.bodBreachCount > 0) {
      const lowestDo = own.find((r) => r.reading.status === 'valid' && r.reading.parameter === 'Dissolved oxygen' && r.reading.value === risk.lowestDo?.value && r.reading.year === risk.lowestDo.year && r.reading.festival === risk.lowestDo.festival && r.reading.phase === risk.lowestDo.phase)
      const highestBod = own.find((r) => r.reading.status === 'valid' && r.reading.parameter === 'BOD' && r.reading.value === risk.highestBod?.value && r.reading.year === risk.highestBod.year && r.reading.festival === risk.highestBod.festival && r.reading.phase === risk.highestBod.phase)
      add('resample', risk.label === 'High priority' ? 'high' : 'moderate',
        { doBreach: risk.doBreachCount, validDo: risk.validDo, bodBreach: risk.bodBreachCount, validBod: risk.validBod },
        [lowestDo, highestBod].flatMap((r) => (r ? [supportingFrom(r)] : [])))
    }

    const zeros = own.filter((r) => r.reading.status === 'valid' && r.reading.parameter === 'Dissolved oxygen' && r.reading.value === 0)
    if (zeros.length > 0) add('zero-do', 'high', { n: zeros.length }, zeros.map(supportingFrom))

    for (const gap of risk.gaps) {
      if (gap.code === 'no-table') add('missing-table', 'data', { table: gap.detail ?? '' }, [], `|${gap.detail}`)
      if (gap.code === 'missing-phases') add('missing-stages', 'data', { n: gap.detail ?? '' }, [])
      if (gap.code === 'medium-match') {
        add('identity', 'data', { printed: [...new Set(own.map((r) => r.reading.siteAsPrinted))].join(' / ') }, [])
      }
    }
  }

  return actions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (rankOf.get(a.site) ?? 0) - (rankOf.get(b.site) ?? 0))
}
