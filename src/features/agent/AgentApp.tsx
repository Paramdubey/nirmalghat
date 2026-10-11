import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BriefSheet } from '../../components/BriefSheet'
import { FieldReportView } from '../../components/FieldReportView'
import { t } from '../../constants/i18n'
import type { Assignment } from '../../lib/apiTypes'
import { generateFieldBrief } from '../../lib/brief/generate'
import { daysUntil, DURGA_VISARJAN_2026 } from '../../lib/format'
import { useSession } from '../../store/session'
import { useTasks } from '../../store/tasks'
import { useLogout } from '../../store/useLogout'
import { useUi } from '../../store/ui'
import { LangToggle } from '../login/LoginPage'
import { FieldForm } from './FieldForm'

/** The field agent's side: their own briefs, and the form to record readings after the visit. */
export function AgentApp() {
  const lang = useUi((s) => s.lang)
  const agent = useSession((s) => s.agent)
  const logout = useLogout()
  const { tasks, loaded, error, load } = useTasks()
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => { void load() }, [load])
  const open = tasks.find((x) => x.id === openId)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-divider bg-white px-4 py-3 sm:px-8">
        <div>
          <p className="text-base font-semibold leading-5">NirmalGhat <span className="font-normal text-ink-3">निर्मल घाट</span></p>
          <p className="caption-mono text-ink-2">{agent?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <button onClick={logout} className="min-h-11 rounded-full bg-surface px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">{t('signOut', lang)}</button>
        </div>
      </header>
      <div className="bg-black px-4 py-2 text-xs text-white sm:px-8">{t('disclaimer', lang)}</div>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {open ? <TaskDetail task={open} onBack={() => setOpenId(null)} /> : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[28px] font-bold leading-9">{t('agAppTitle', lang)}</h1>
                <p className="mt-1 text-sm text-ink-2">{t('agAppLead', lang)}</p>
              </div>
              <button onClick={() => void load()} className="flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
                <RefreshCw className="size-4" aria-hidden />{t('agAppRefresh', lang)}
              </button>
            </div>
            {error && <p role="alert" className="rounded-lg bg-high-tint p-3 text-sm font-medium text-high">{error}</p>}
            {loaded && tasks.length === 0 && <p className="rounded-lg border border-divider p-6 text-center text-ink-2">{t('agAppNone', lang)}</p>}
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-lg border border-divider p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold leading-6">{task.site}</p>
                      <p className="text-sm text-ink-3">{t('agAssignedOn', lang, { when: new Date(task.createdAt).toLocaleDateString('en-IN') })}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${task.submission ? 'bg-info-tint text-info' : 'hatch'}`}>
                      {task.submission ? t('asgSubmitted', lang) : t('asgAssigned', lang)}
                    </span>
                  </div>
                  <button onClick={() => setOpenId(task.id)} className="mt-3 min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">{t('agOpen', lang)}</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}

function TaskDetail({ task, onBack }: { task: Assignment; onBack: () => void }) {
  const lang = useUi((s) => s.lang)
  const agent = useSession((s) => s.agent)
  const submit = useTasks((s) => s.submit)
  const [today] = useState(() => new Date())
  const brief = useMemo(() => generateFieldBrief({
    risk: task.brief.risk, actions: task.brief.actions, agent: agent?.name ?? null,
    today, visarjan: DURGA_VISARJAN_2026, daysToGo: daysUntil(DURGA_VISARJAN_2026, today),
  }, lang), [task, agent, today, lang])

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
        <ArrowLeft className="size-4" aria-hidden />{t('agBack', lang)}
      </button>
      <BriefSheet brief={brief} />
      {task.submission ? (
        <section className="rounded-lg border border-divider p-4 sm:p-6">
          <h2 className="text-xl font-bold leading-7">{t('ffSubmittedHeading', lang)}</h2>
          <p className="mt-1 text-sm text-ink-2">{t('ffDone', lang)}</p>
          <p className="tabular mt-1 text-xs text-ink-3">{t('asgSubmittedAt', lang, { when: new Date(task.submission.submittedAt).toLocaleString('en-IN') })}</p>
          <FieldReportView report={task.submission.report} />
        </section>
      ) : (
        <FieldForm onSubmit={async (report) => { await submit(task.id, report) }} />
      )}
    </div>
  )
}
