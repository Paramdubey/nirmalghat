import { BRIEF, pick } from '../../constants/briefText'
import { actionText } from '../../constants/actionText'
import { fill, LABEL_KEY, t, type Lang } from '../../constants/i18n'
import { formatDate } from '../format'
import type { ProposedAction } from '../actions/generate'
import type { Summary } from '../risk/summary'
import type { ObservationRef, SiteRisk } from '../../types'

export interface BriefInput {
  /** Full ranking (not filtered). */
  ranking: SiteRisk[]
  summary: Summary
  /** Only the actions the officer chose to include. */
  actions: ProposedAction[]
  years: { from: number; to: number }
  today: Date
  visarjan: Date
  daysToGo: number
}

export interface BriefSection {
  id: 'purpose' | 'top' | 'readings' | 'caveats' | 'actions'
  heading: string
  paragraphs: string[]
  bullets: string[]
}

export interface Brief {
  lang: Lang
  title: string
  dateLine: string
  sections: BriefSection[]
  closing: string
}

const f = (key: keyof typeof BRIEF, lang: Lang, vars: Record<string, string | number> = {}) => {
  const entry = BRIEF[key] as { en: string; hi: string }
  return fill(pick(entry, lang), vars)
}

const festivalWord = (festival: string, lang: Lang) => BRIEF.festival[festival]?.[lang] ?? festival
const phaseWord = (phase: string, lang: Lang) => BRIEF.phase[phase]?.[lang] ?? phase

/** "2025 Durga, during, p. 64" — year and page stay as data, only the words are localised. */
function ref(o: ObservationRef, lang: Lang): string {
  return `${o.year} ${festivalWord(o.festival, lang)}, ${phaseWord(o.phase, lang)}, ${pick(BRIEF.page, lang)} ${o.sourcePage}`
}

/** "2025 Durga" → localised, for missing-table lines. */
const tableName = (detail: string, lang: Lang) => detail.replace(/Ganesh|Durga/, (m) => festivalWord(m, lang))

function siteSummary(r: SiteRisk, rank: number, lang: Lang): string {
  const parts = [f('topItem', lang, { rank, site: r.site, waterBody: r.waterBody, label: t(LABEL_KEY[r.label], lang) })]
  if (r.doBreachCount > 0 && r.lowestDo) parts.push(f('doPart', lang, { a: r.doBreachCount, b: r.validDo, v: r.lowestDo.value, ref: ref(r.lowestDo, lang) }))
  if (r.bodBreachCount > 0 && r.highestBod) parts.push(f('bodPart', lang, { a: r.bodBreachCount, b: r.validBod, v: r.highestBod.value, ref: ref(r.highestBod, lang) }))
  if (r.phBreachCount > 0) parts.push(f('phPart', lang, { a: r.phBreachCount }))
  if (r.breachCount === 0) parts.push(f('noBreach', lang))
  return parts.join(' ')
}

/** Pure and deterministic: structured data in, a brief in one language out. Works with no AI. */
export function generateBrief(input: BriefInput, lang: Lang): Brief {
  const { ranking, summary: s, actions } = input

  const readings = [
    f('classBRef', lang),
    t('findDo', lang, { a: s.doBelow, b: s.doValid }),
    t('findBod', lang, { a: s.bodAbove, b: s.bodValid }),
    f('phLine', lang, { a: s.phOut, b: s.phValid }),
    ...(s.zeroDoCount > 0 ? [t('findZero', lang, { a: s.zeroDoCount, b: s.zeroDoSites.join(', ') })] : []),
  ]

  const caveats = ranking.flatMap((r) =>
    r.gaps.map((g) => {
      if (g.code === 'no-table') return f('noTable', lang, { site: r.site, table: tableName(g.detail ?? '', lang) })
      if (g.code === 'medium-match') return f('mediumMatch', lang, { site: r.site })
      if (g.code === 'missing-phases') return f('missingStages', lang, { site: r.site, n: g.detail ?? '' })
      return null
    }).filter((x): x is string => x !== null))
  caveats.push(f('units', lang))

  return {
    lang,
    title: f('title', lang),
    dateLine: input.daysToGo > 0
      ? f('dateLine', lang, { date: formatDate(input.today, lang), visarjan: formatDate(input.visarjan, lang), n: input.daysToGo })
      : f('dateLineNoCount', lang, { date: formatDate(input.today, lang), visarjan: formatDate(input.visarjan, lang) }),
    sections: [
      { id: 'purpose', heading: f('purposeHeading', lang), paragraphs: [f('purpose', lang, { from: input.years.from, to: input.years.to })], bullets: [] },
      { id: 'top', heading: f('topHeading', lang), paragraphs: [], bullets: ranking.slice(0, 3).map((r, i) => siteSummary(r, i + 1, lang)) },
      { id: 'readings', heading: f('readingsHeading', lang), paragraphs: [], bullets: readings },
      { id: 'caveats', heading: f('caveatsHeading', lang), paragraphs: [], bullets: caveats },
      {
        id: 'actions', heading: f('actionsHeading', lang),
        paragraphs: actions.length === 0 ? [f('noActions', lang)] : [],
        bullets: actions.map((a) => `${actionText(a.kind, 'title', lang, a.vars)} — ${actionText(a.kind, 'reason', lang, a.vars)}`),
      },
    ],
    closing: f('closing', lang),
  }
}

export function briefToText(b: Brief): string {
  const blocks = b.sections.map((sec) =>
    [sec.heading.toUpperCase(), ...sec.paragraphs, ...sec.bullets.map((x) => `• ${x}`)].join('\n'))
  return [b.title, b.dateLine, '', ...blocks.flatMap((x) => [x, '']), b.closing].join('\n')
}

export function briefsToText(briefs: Brief[]): string {
  return briefs.map(briefToText).join('\n\n----------\n\n')
}
