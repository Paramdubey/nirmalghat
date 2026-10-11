import { TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RiskBadge } from '../../components/RiskBadge'
import { actionText } from '../../constants/actionText'
import { t } from '../../constants/i18n'
import { WEIGHT_RATIONALE } from '../../constants/weights'
import { generateActions, type ProposedAction } from '../../lib/actions/generate'
import { daysUntil, DURGA_VISARJAN_2026 } from '../../lib/format'
import { buildRanking } from '../../lib/risk/rank'
import { useActions } from '../../store/actions'
import { agentsForGhat, useAgents } from '../../store/agents'
import { useData } from '../../store/data'
import { useRanking } from '../../store/ranking'
import { useUi } from '../../store/ui'
import type { SiteRisk } from '../../types'
import { FieldAgentsPanel } from './FieldAgentsPanel'
import { FieldBriefModal } from './FieldBriefModal'

export function RankingPage() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const results = useData((s) => s.results)
  const selectSite = useRanking((s) => s.selectSite)

  const ranking = useMemo(() => buildRanking(results), [results])
  const actions = useMemo(() => generateActions(ranking, results), [ranking, results])
  const years = results.map((r) => r.reading.year)
  const [days] = useState(() => daysUntil(DURGA_VISARJAN_2026, new Date()))

  function viewEvidence(site: string) {
    selectSite(site)
    setView('evidence')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('rankTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">
          {t(days > 0 ? 'rkLead2' : 'rkLead2Passed', lang, { n: days, from: Math.min(...years), to: Math.max(...years) })}
        </p>
      </div>

      <FieldAgentsPanel ghats={ranking.map((r) => r.site)} />

      <ol className="space-y-3">
        {ranking.map((r, i) => (
          <RankRow key={r.site} risk={r} rank={i + 1} onView={() => viewEvidence(r.site)} actions={actions.filter((a) => a.site === r.site)} />
        ))}
      </ol>

      <details className="rounded-lg border border-divider p-5">
        <summary className="cursor-pointer text-lg font-bold">{t('howTitle', lang)}</summary>
        <p className="mt-3 text-sm text-ink-2">{t('howIntro', lang)}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-divider"><th className="py-2 pr-4">&nbsp;</th><th className="py-2 pr-4">{t('howWeight', lang)}</th><th className="py-2">{t('howWhy', lang)}</th></tr></thead>
            <tbody>
              {WEIGHT_RATIONALE.map((w) => (
                <tr key={w.name} className="border-b border-divider align-top">
                  <th scope="row" className="py-2 pr-4 font-semibold">{w.name}</th>
                  <td className="py-2 pr-4">{w.value}</td>
                  <td className="py-2 text-ink-2">{w.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 font-bold">{t('howBreakdown', lang)}</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="tabular w-full text-left text-sm">
            <thead><tr className="border-b border-divider">
              <th className="py-2 pr-4">{t('fSite', lang)}</th>
              {(['bkDo', 'bkBod', 'bkPh', 'bkRecurrence', 'bkTotal'] as const).map((k) => <th key={k} className="py-2 pr-4 text-right">{t(k, lang)}</th>)}
            </tr></thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.site} className="border-b border-divider">
                  <th scope="row" className="py-2 pr-4 font-medium">{r.site}</th>
                  <td className="py-2 pr-4 text-right">{r.breakdown.doPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.bodPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.phPoints}</td>
                  <td className="py-2 pr-4 text-right">{r.breakdown.recurrencePoints}</td>
                  <td className="py-2 pr-4 text-right font-bold">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-2">{t('howLabelsNote', lang)}</p>
      </details>
    </div>
  )
}

function RankRow({ risk: r, rank, onView, actions }: { risk: SiteRisk; rank: number; onView: () => void; actions: ProposedAction[] }) {
  const lang = useUi((s) => s.lang)
  const latest = r.latestObservation
  return (
    <li className="rounded-lg border border-divider p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">{rank}</span>
          <div>
            <p className="text-lg font-semibold leading-6">{r.site}</p>
            <p className="text-sm text-ink-3">{r.waterBody}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular text-sm text-ink-2">{t('scoreLabel', lang, { n: r.score })}</span>
          <RiskBadge label={r.label} />
        </div>
      </div>

      <dl className="tabular mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <Stat term={t('colDo', lang)}>
          {r.validDo === 0 ? t('noValid', lang) : <>{t('doCell', lang, { a: r.doBreachCount, b: r.validDo })}{r.lowestDo && <><br /><span className="text-ink-3">{t('lowest', lang, { v: r.lowestDo.value })}</span></>}</>}
        </Stat>
        <Stat term={t('colBod', lang)}>
          {r.validBod === 0 ? t('noValid', lang) : <>{t('bodCell', lang, { a: r.bodBreachCount, b: r.validBod })}{r.highestBod && <><br /><span className="text-ink-3">{t('highest', lang, { v: r.highestBod.value })}</span></>}</>}
        </Stat>
        <Stat term={t('colBreaches', lang)}><span className="text-lg font-bold">{r.breachCount}</span></Stat>
        <Stat term={t('colLatest', lang)}>{latest ? `${latest.year} ${latest.festival}, ${latest.phase}` : '—'}{latest && <><br /><span className="text-ink-3">p. {latest.sourcePage}</span></>}</Stat>
        <Stat term={t('colComplete', lang)}>
          <span className="text-lg font-bold">{Math.round(r.completeness * 100)}%</span>
          <br /><span className="text-ink-3">{t('completenessNote', lang)}</span>
        </Stat>
      </dl>

      <p className="mt-4 text-sm leading-5 text-ink-2">{r.explanation}</p>
      {r.gaps.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {r.gaps.map((g) => (
            <li key={g.code + g.text} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{g.text}</span>
            </li>
          ))}
        </ul>
      )}
      <FieldBriefPanel risk={r} actions={actions} />
      <button onClick={onView} className="mt-4 min-h-11 rounded-full bg-surface px-6 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
        {t('viewEvidence', lang)}
      </button>
    </li>
  )
}

function Stat({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps !text-[11px]">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

/** Per-ghat field brief: tick recommended actions, optionally pick a linked field agent, then preview/copy/print. */
function FieldBriefPanel({ risk, actions }: { risk: SiteRisk; actions: ProposedAction[] }) {
  const lang = useUi((s) => s.lang)
  const { included, toggle } = useActions()
  const agents = agentsForGhat(useAgents((s) => s.agents), risk.site)
  const [agentId, setAgentId] = useState('')
  const [open, setOpen] = useState(false)
  const selected = actions.filter((a) => included.includes(a.id))
  const agent = agents.find((a) => a.id === agentId)?.name ?? null

  return (
    <div className="mt-4 rounded-lg bg-surface p-4">
      <h3 className="text-base font-bold">{t('fbTitle', lang)}</h3>
      {actions.length === 0 ? <p className="mt-2 text-sm text-ink-2">{t('fbNoActions', lang)}</p> : (
        <fieldset className="mt-2">
          <legend className="label-caps !text-[11px]">{t('fbPick', lang)}</legend>
          <ul className="mt-1">
            {actions.map((a) => (
              <li key={a.id}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm">
                  <input type="checkbox" checked={included.includes(a.id)} onChange={() => toggle(a.id)} className="mt-0.5 size-5 shrink-0 accent-black" />
                  {actionText(a.kind, 'title', lang, a.vars)}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium">
          {t('fbAgent', lang)}
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} disabled={agents.length === 0}
            className="mt-1 block min-h-11 w-64 max-w-full rounded-lg border border-divider bg-white px-3 text-sm disabled:text-ink-3">
            <option value="">{t('fbAgentNone', lang)}</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <button onClick={() => setOpen(true)} disabled={selected.length === 0}
          className="min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-divider disabled:text-ink-3">
          {t('fbCreate', lang)}
        </button>
        <span className="tabular pb-3 text-sm text-ink-2">{t('fbSelected', lang, { a: selected.length, b: actions.length })}</span>
      </div>
      {agents.length === 0 && <p className="mt-2 text-xs text-ink-3">{t('fbNoAgents', lang)}</p>}
      {open && <FieldBriefModal risk={risk} actions={selected} agent={agent} onClose={() => setOpen(false)} />}
    </div>
  )
}
