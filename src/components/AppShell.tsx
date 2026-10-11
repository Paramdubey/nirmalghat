import { Activity, ClipboardList, Database, FileText, LayoutDashboard, ListOrdered } from 'lucide-react'
import type { ReactNode } from 'react'
import { t, type StringKey } from '../constants/i18n'
import { LangToggle } from '../features/login/LoginPage'
import { daysUntil, DURGA_VISARJAN_2026 } from '../lib/format'
import { useData } from '../store/data'
import { useUi, type View } from '../store/ui'

const NAV: { view: View; label: StringKey; short: StringKey; icon: typeof Activity }[] = [
  { view: 'overview', label: 'navOverview', short: 'navShortOverview', icon: LayoutDashboard },
  { view: 'ranking', label: 'navRanking', short: 'navShortRanking', icon: ListOrdered },
  { view: 'evidence', label: 'navEvidence', short: 'navShortEvidence', icon: Activity },
  { view: 'actions', label: 'navActions', short: 'navShortActions', icon: ClipboardList },
  { view: 'brief', label: 'navBrief', short: 'navShortBrief', icon: FileText },
  { view: 'quality', label: 'navQuality', short: 'navShortQuality', icon: Database },
]

function countdown(lang: 'en' | 'hi'): string {
  const n = daysUntil(DURGA_VISARJAN_2026, new Date())
  if (n > 0) return t('daysToGo', lang, { n })
  return t(n === 0 ? 'visarjanToday' : 'visarjanPassed', lang)
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, view, setView, leave } = useUi()
  const { isSample, status } = useData()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-divider bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-black text-lg font-bold text-white">N</div>
            <div>
              <p className="text-base font-semibold leading-5">
                NirmalGhat <span className="font-normal text-ink-3">| निर्मल घाट</span>
              </p>
              <p className="caption-mono text-ink-2">{t('orgLine', lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-surface px-3 py-1.5 text-sm font-medium xl:inline">{countdown(lang)}</span>
            <LangToggle />
            <button onClick={leave} className="hidden min-h-11 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black sm:block">
              {t('signOut', lang)}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-divider bg-surface px-4 py-2 text-sm sm:px-8">
          <span className="font-semibold">{t('dataBadge', lang)}</span>
          {isSample && status === 'ready' && <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">{t('sampleData', lang)}</span>}
          <span className="text-ink-2">{t('disclaimer', lang)}</span>
          <span className="w-full text-ink-2 xl:hidden">{countdown(lang)}</span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label="Main" className="sticky top-28 hidden w-64 shrink-0 self-start border-r border-divider p-4 lg:block">
          <ul className="space-y-1">
            {NAV.map(({ view: v, label, icon: Icon }) => (
              <li key={v}>
                <button
                  onClick={() => setView(v)}
                  aria-current={view === v ? 'page' : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-black ${view === v ? 'bg-black text-white' : 'hover:bg-surface'}`}
                >
                  <Icon className="size-5" aria-hidden />
                  {t(label, lang)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 px-4 py-8 pb-28 sm:px-8 lg:pb-8">{children}</main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-divider bg-white lg:hidden">
        {NAV.map(({ view: v, short, icon: Icon }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-current={view === v ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-black ${view === v ? 'text-black' : 'text-ink-3'}`}
          >
            <Icon className={`size-5 ${view === v ? '' : 'opacity-70'}`} aria-hidden />
            {t(short, lang)}
          </button>
        ))}
      </nav>
    </div>
  )
}
