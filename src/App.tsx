import { useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { t, type StringKey } from './constants/i18n'
import { LoginPage } from './features/login/LoginPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { RankingPage } from './features/ranking/RankingPage'
import { useData } from './store/data'
import { useUi, type View } from './store/ui'

const VIEW_TITLE: Record<Exclude<View, 'overview' | 'ranking'>, StringKey> = {
  evidence: 'navEvidence', actions: 'navActions', brief: 'navBrief', quality: 'navQuality',
}

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
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[32px] font-bold leading-10">{t(VIEW_TITLE[view], lang)}</h1>
      <p className="mt-2 text-ink-2">{t('comingNext', lang)}</p>
    </div>
  )
}

export default function App() {
  const entered = useUi((s) => s.entered)
  const load = useData((s) => s.load)
  useEffect(() => {
    if (entered) void load()
  }, [entered, load])

  if (!entered) return <LoginPage />
  return (
    <AppShell>
      <Content />
    </AppShell>
  )
}
