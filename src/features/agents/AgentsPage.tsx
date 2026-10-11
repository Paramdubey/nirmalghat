import { Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { FieldReportView } from '../../components/FieldReportView'
import { actionText } from '../../constants/actionText'
import { t } from '../../constants/i18n'
import { useOfficerData } from '../../store/agents'
import { useData } from '../../store/data'
import { useUi } from '../../store/ui'

/** Officer section: create field agent accounts, see their briefs and the reports they submit. */
export function AgentsPage() {
  const lang = useUi((s) => s.lang)
  const ghats = [...new Set(useData((s) => s.results).map((r) => r.reading.site))].sort()
  const { agents, assignments, error, createAgent, removeAgent } = useOfficerData()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() === '' || !/^\d{4}$/.test(pin) || picked.length === 0) return setMessage(t('agNeed', lang))
    setBusy(true)
    try {
      await createAgent(name, pin, picked)
      setName(''); setPin(''); setPicked([]); setMessage(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create the account')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    try {
      await removeAgent(id)
      setMessage(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('agRemoveBlocked', lang))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-[32px] font-bold leading-10">{t('agentsTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('agentsLead', lang)}</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-high-tint p-3 text-sm font-medium text-high">{error}</p>}

      <section className="rounded-lg border border-divider p-5">
        <h2 className="text-xl font-bold leading-7">{t('agCreate', lang)}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('agNote', lang)}</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {t('agName', lang)}
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" className="field mt-1 pr-4" />
            </label>
            <label className="block text-sm font-medium">
              {t('agPin', lang)}
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={4} autoComplete="off" className="field mt-1 pr-4" />
              <span className="mt-1 block text-xs font-normal text-ink-3">{t('agPinNote', lang)}</span>
            </label>
          </div>
          <fieldset>
            <legend className="label-caps mb-2">{t('agGhats', lang)}</legend>
            <div className="flex flex-wrap gap-2">
              {ghats.map((g) => {
                const on = picked.includes(g)
                return (
                  <button key={g} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== g) : [...p, g]))}
                    className={`min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${on ? 'bg-black text-white' : 'bg-surface hover:bg-divider'}`}>
                    {g}
                  </button>
                )
              })}
            </div>
          </fieldset>
          {message && <p role="alert" className="text-sm font-medium text-high">{message}</p>}
          <button type="submit" disabled={busy} className="min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-ink-3">{t('agAdd', lang)}</button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('agList', lang, { n: agents.length })}</h2>
        {agents.length === 0 ? <p className="mt-2 text-sm text-ink-3">{t('agNone', lang)}</p> : (
          <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider">
            {agents.map((a) => {
              const count = assignments.filter((x) => x.agentId === a.id).length
              return (
                <li key={a.id} className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-ink-3">{a.ghats.join(' · ')}</p>
                    <p className="tabular mt-1 text-xs text-ink-2">{t('agBriefs', lang, { n: count })}</p>
                  </div>
                  <button onClick={() => remove(a.id)} aria-label={t('agRemove', lang, { name: a.name })} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-black">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold leading-7">{t('asgTitle', lang)}</h2>
        {assignments.length === 0 ? <p className="mt-2 text-sm text-ink-3">{t('asgNone', lang)}</p> : (
          <ul className="mt-3 space-y-3">
            {assignments.map((a) => (
              <li key={a.id} className="rounded-lg border border-divider p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.site}</p>
                    <p className="text-sm text-ink-2">{a.agentName} · {new Date(a.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${a.submission ? 'bg-info-tint text-info' : 'hatch'}`}>
                    {a.submission ? t('asgSubmitted', lang) : t('asgAssigned', lang)}
                  </span>
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-ink-2">
                  {a.brief.actions.map((x) => <li key={x.id}>{actionText(x.kind, 'title', lang, x.vars)}</li>)}
                </ul>
                {a.submission && (
                  <div className="mt-3 rounded-lg bg-surface p-3">
                    <p className="flex items-start gap-2 text-xs text-ink-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{t('fieldUnverified', lang)}</p>
                    <FieldReportView report={a.submission.report} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
