import { t } from './constants/i18n'
import { LangToggle, LoginPage } from './features/login/LoginPage'
import { useUi } from './store/ui'

export default function App() {
  const { entered, lang, leave } = useUi()
  if (!entered) return <LoginPage />

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">NirmalGhat</h1>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button onClick={leave} className="min-h-11 rounded-full bg-surface px-5 text-sm font-semibold">
            {t('signOut', lang)}
          </button>
        </div>
      </div>
      <p className="mt-2 text-ink-2">{t('dataBadge', lang)}</p>
      <p className="mt-4">{t('dashboardSoon', lang)}</p>
    </main>
  )
}
