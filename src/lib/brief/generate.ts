import { actionText } from '../../constants/actionText'
import { BRIEF, pick } from '../../constants/briefText'
import { fill, LABEL_KEY, t, type Lang } from '../../constants/i18n'
import type { ObservationRef, SiteRisk } from '../../types'
import type { ProposedAction } from '../actions/generate'
import { formatDate } from '../format'

export interface FieldBriefInput {
  /** The ghat's risk record (full history, not filtered). */
  risk: SiteRisk
  /** Only the actions the officer ticked for this ghat. */
  actions: ProposedAction[]
  /** Name or squad label from the officer's local roster, if one was chosen. */
  agent: string | null
  today: Date
  visarjan: Date
  daysToGo: number
}

export interface BriefSection {
  id: 'why' | 'tasks' | 'limits' | 'bring'
  heading: string
  paragraphs: string[]
  bullets: string[]
}

export interface Brief {
  lang: Lang
  title: string
  forLine: string
  dateLine: string
  draftLine: string
  sections: BriefSection[]
  closing: string
}

const f = (key: keyof typeof BRIEF, lang: Lang, vars: Record<string, string | number> = {}) =>
  fill(pick(BRIEF[key] as { en: string; hi: string }, lang), vars)

const festivalWord = (festival: string, lang: Lang) => BRIEF.festival[festival]?.[lang] ?? festival
const phaseWord = (phase: string, lang: Lang) => BRIEF.phase[phase]?.[lang] ?? phase

/** "2025 Durga, during, p. 64" — year and page stay as data, only the words are localised. */
function ref(o: ObservationRef, lang: Lang): string {
  return `${o.year} ${festivalWord(o.festival, lang)}, ${phaseWord(o.phase, lang)}, ${pick(BRIEF.page, lang)} ${o.sourcePage}`
}

const tableName = (detail: string, lang: Lang) => detail.replace(/Ganesh|Durga/, (m) => festivalWord(m, lang))

function whyParagraph(r: SiteRisk, lang: Lang): string {
  const parts = [f('fieldItem', lang, { site: r.site, waterBody: r.waterBody, label: t(LABEL_KEY[r.label], lang) })]
  if (r.doBreachCount > 0 && r.lowestDo) parts.push(f('doPart', lang, { a: r.doBreachCount, b: r.validDo, v: r.lowestDo.value, ref: ref(r.lowestDo, lang) }))
  if (r.bodBreachCount > 0 && r.highestBod) parts.push(f('bodPart', lang, { a: r.bodBreachCount, b: r.validBod, v: r.highestBod.value, ref: ref(r.highestBod, lang) }))
  if (r.phBreachCount > 0) parts.push(f('phPart', lang, { a: r.phBreachCount }))
  if (r.breachCount === 0) parts.push(f('noBreach', lang))
  return parts.join(' ')
}

/** Pure and deterministic: one ghat's evidence + the ticked actions in, a field brief in one language out. No AI. */
export function generateFieldBrief(input: FieldBriefInput, lang: Lang): Brief {
  const { risk, actions } = input

  const limits = risk.gaps.map((g) => {
    if (g.code === 'no-table') return f('noTable', lang, { site: risk.site, table: tableName(g.detail ?? '', lang) })
    if (g.code === 'medium-match') return f('mediumMatch', lang, { site: risk.site })
    if (g.code === 'missing-phases') return f('missingStages', lang, { site: risk.site, n: g.detail ?? '' })
    return f('missingStages', lang, { site: risk.site, n: '' })
  })
  limits.push(f('units', lang))

  return {
    lang,
    title: f('fieldTitle', lang, { site: risk.site }),
    forLine: input.agent ? f('fieldFor', lang, { agent: input.agent }) : f('fieldForNone', lang),
    dateLine: input.daysToGo > 0
      ? f('dateLine', lang, { date: formatDate(input.today, lang), visarjan: formatDate(input.visarjan, lang), n: input.daysToGo })
      : f('dateLineNoCount', lang, { date: formatDate(input.today, lang), visarjan: formatDate(input.visarjan, lang) }),
    draftLine: f('fieldDraft', lang),
    sections: [
      { id: 'why', heading: f('whyHeading', lang), paragraphs: [whyParagraph(risk, lang)], bullets: [] },
      {
        id: 'tasks', heading: f('tasksHeading', lang),
        paragraphs: actions.length === 0 ? [f('noTasks', lang)] : [],
        bullets: actions.map((a) => `${actionText(a.kind, 'title', lang, a.vars)} — ${actionText(a.kind, 'reason', lang, a.vars)}${
          a.supporting.length > 0 ? ` (${a.supporting.map((s) => `${s.parameter} ${s.valueText}, ${s.year} ${festivalWord(s.festival, lang)}, ${phaseWord(s.phase, lang)}, ${pick(BRIEF.page, lang)} ${s.sourcePage}`).join('; ')})` : ''}`),
      },
      { id: 'limits', heading: f('limitsHeading', lang), paragraphs: [], bullets: limits },
      { id: 'bring', heading: f('bringHeading', lang), paragraphs: [], bullets: actions.map((a) => actionText(a.kind, 'verify', lang, a.vars)) },
    ],
    closing: f('fieldClosing', lang),
  }
}

export function briefToText(b: Brief): string {
  const blocks = b.sections.map((sec) => [sec.heading.toUpperCase(), ...sec.paragraphs, ...sec.bullets.map((x) => `• ${x}`)].join('\n'))
  return [b.title, b.forLine, b.dateLine, b.draftLine, '', ...blocks.flatMap((x) => [x, '']), b.closing].join('\n')
}

export function briefsToText(briefs: Brief[]): string {
  return briefs.map(briefToText).join('\n\n----------\n\n')
}
