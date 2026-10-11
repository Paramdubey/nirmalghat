import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { t } from './constants/i18n'
import { ActionsPage } from './features/actions/ActionsPage'
import { AgentApp } from './features/agent/AgentApp'
import { AgentsPage } from './features/agents/AgentsPage'
import { DataQualityPage } from './features/data-quality/DataQualityPage'
import { LoginPage } from './features/login/LoginPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { RankingPage } from './features/ranking/RankingPage'
import { EvidencePage } from './features/site-detail/EvidencePage'
import { useOfficerData } from './store/agents'
import { useData } from './store/data'
import { useSession } from './store/session'
import { useUi } from './store/ui'

function Content() {
  const { view, lang } = useUi()
  const { status, error, load } = useData()

  if (status === 'error') {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-lg border border-high bg-high-tint p-6">
        <h1 className="text-xl font-bold">{t('loadError', lang)}</h1>
        <p className="mt-2 text-sm">{error}</p>
        <button onClick={load} className="mt-4 min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white">{t('retry', lang)}</button>
      </div>
    )
  }
  if (status !== 'ready') {
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-busy="true" aria-label={t('loading', lang)}>
        <div className="h-10 w-48 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-surface" />)}
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-surface" />
      </div>
    )
  }
  if (view === 'overview') return <OverviewPage />
  if (view === 'ranking') return <RankingPage />
  if (view === 'evidence') return <EvidencePage />
  if (view === 'actions') return <ActionsPage />
  if (view === 'agents') return <AgentsPage />
  return <DataQualityPage />
}

export default function App() {
  const role = useSession((s) => s.session?.role)
  const loadData = useData((s) => s.load)
  const loadOfficer = useOfficerData((s) => s.load)

  useEffect(() => {
    if (role === 'officer') {
      void loadData()
      void loadOfficer()
    }
  }, [role, loadData, loadOfficer])

  if (role === 'agent') return <AgentApp />
  if (role !== 'officer') return <LoginPage />
  return (
    <AppShell>
      <Content />
    </AppShell>
  )
}
