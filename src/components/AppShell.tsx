import { Activity, ClipboardList, Database, Droplet, LayoutDashboard, ListOrdered } from 'lucide-react'
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
  { view: 'quality', label: 'navQuality', short: 'navShortQuality', icon: Database },
]

function countdown(lang: 'en' | 'hi'): string {
  const n = daysUntil(DURGA_VISARJAN_2026, new Date())
  if (n > 0) return t('daysToGo', lang, { n })
  return t(n === 0 ? 'visarjanToday' : 'visarjanPassed', lang)
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, view, setView, leave } = useUi()
  const { isSample, status, results } = useData()
  const years = results.map((r) => r.reading.year)
  const period = years.length > 0 ? { from: Math.min(...years), to: Math.max(...years) } : { from: 2023, to: 2025 }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="no-print sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Droplet className="size-6 text-info" aria-hidden />
            <p className="text-base font-semibold leading-5">
              NirmalGhat <span className="font-normal text-ink-3">निर्मल घाट</span>
            </p>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="caption-mono rounded-full border border-divider px-3 py-1.5 text-ink-2">{t('histBadge', lang)}</span>
            <span className="caption-mono flex items-center gap-2 rounded-full bg-black px-3 py-1.5 font-semibold text-white">
              <span className="size-2 rounded-full bg-white" aria-hidden />{countdown(lang)}
            </span>
            {isSample && status === 'ready' && <span className="caption-mono rounded-full bg-moderate px-3 py-1.5 font-semibold">{t('sampleData', lang)}</span>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <button onClick={leave} className="hidden min-h-11 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black sm:block">
              {t('signOut', lang)}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-black px-4 py-2 text-xs text-white sm:px-8">
          <span className="caption-mono rounded bg-high px-2 py-0.5 font-bold uppercase">{t('noticeTag', lang)}</span>
          <span>{t('noticeBody', lang, period)}</span>
          <span className="w-full text-[#c4c4c4] lg:hidden">{t('histBadge', lang)} · {countdown(lang)}</span>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label="Main" className="no-print sticky top-28 hidden w-64 shrink-0 self-start border-r border-divider p-4 lg:block">
          <div className="mb-4 rounded-lg border border-divider bg-surface p-3">
            <p className="caption-mono uppercase text-ink-3">{t('planCycle', lang)}</p>
            <p className="mt-1 text-sm font-bold">{t('planCycleValue', lang)}</p>
          </div>
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
          <p className="caption-mono mt-8 text-ink-3">{t('sidebarFoot', lang)}</p>
        </nav>
        <main className="min-w-0 flex-1 px-4 py-8 pb-28 sm:px-8 lg:pb-8">{children}</main>
      </div>

      <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-divider bg-white lg:hidden">
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
