import { ArrowRight, Eye, EyeOff, IdCard, Landmark, Microscope, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { t, type StringKey } from '../../constants/i18n'
import { Logo } from '../../components/Logo'
import { agentEmail, PIN_PATTERN, supabase } from '../../lib/supabase'
import { useUi } from '../../store/ui'

type Role = 'admin' | 'field'

// Public demo login for judges. This account only exists on the demo Supabase project.
const DEMO_EMAIL = 'officer@bmc.com'
const DEMO_PASSWORD = 'Test@123'

const ROLES: { id: Role; label: StringKey; title: StringKey; body: StringKey }[] = [
  { id: 'admin', label: 'roleAdmin', title: 'roleAdminTitle', body: 'roleAdminBody' },
  { id: 'field', label: 'roleField', title: 'roleFieldTitle', body: 'roleFieldBody' },
]

export function LoginPage() {
  const lang = useUi((s) => s.lang)
  const [role, setRole] = useState<Role>('admin')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const active = ROLES.find((r) => r.id === role) ?? ROLES[0]

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (role !== 'admin' && !PIN_PATTERN.test(pin)) throw new Error('PIN must be 6 digits')
      const credentials = role === 'admin'
        ? { email: email.trim(), password }
        : { email: await agentEmail(name), password: pin }
      const { error: authError } = await supabase.auth.signInWithPassword(credentials)
      if (authError) throw new Error(role === 'admin' ? 'Wrong email or password' : 'Wrong name or PIN')
      // The auth listener in store/session.ts takes it from here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-divider bg-white px-6 py-5 sm:px-20">
        <div className="flex items-center gap-4">
          <Logo className="h-11" />
          <div>
            <p className="text-lg font-semibold leading-6">
              NirmalGhat <span className="font-normal text-ink-3">| निर्मल घाट</span>
            </p>
            <p className="caption-mono text-ink-2">{t('orgLine', lang)}</p>
          </div>
        </div>
        <LangToggle />
      </header>

      <main className="flex flex-1 flex-col items-center gap-5 px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-[548px] rounded-3xl border border-divider bg-white p-6 sm:p-11">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold">
              <span className="size-2 rounded-full bg-[#E11900]" aria-hidden />
              {t('prepChip', lang)}
            </span>
            <span className="font-mono text-xs text-ink-3">20 Oct 2026</span>
          </div>

          <Logo className="mt-6 h-24" />
          <h1 className="mt-4 text-4xl font-bold leading-[48px] tracking-tight">NirmalGhat</h1>
          <p className="mt-1 text-base leading-6 text-ink-2">{t('loginSubtitle', lang)}</p>
          <p className="mt-1 text-sm text-ink-3">{t('loginSubtitleHi', lang)}</p>

          <p className="label-caps mt-8">{t('selectCredential', lang)}</p>
          <div role="radiogroup" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
            {ROLES.map((r) => {
              const Icon = r.id === 'admin' ? Landmark : Microscope
              const on = r.id === role
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => { setRole(r.id); setError(null) }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                    on ? 'bg-black text-white' : 'text-ink'
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(r.label, lang)}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-divider bg-surface p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{t(active.title, lang)}</p>
              <p className="mt-1 text-sm leading-5 text-ink-2">{t(active.body, lang)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-ink-3 px-4 py-3 text-sm">
            <p className="label-caps !text-black">{t('demoTitle', lang)}</p>
            {role === 'admin' ? (
              <>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-ink-2">{t('demoOfficerLabel', lang)}</dt>
                  <dd className="select-all font-mono font-semibold">{DEMO_EMAIL}</dd>
                  <dt className="text-ink-2">{t('demoPasswordLabel', lang)}</dt>
                  <dd className="select-all font-mono font-semibold">{DEMO_PASSWORD}</dd>
                </dl>
                <button type="button" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(null) }}
                  className="mt-3 min-h-11 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
                  {t('demoFill', lang)}
                </button>
              </>
            ) : (
              <p className="mt-2 text-ink-2">{t('demoAgentNote', lang)}</p>
            )}
          </div>

          <div className="my-6 flex items-center gap-4">
            <hr className="flex-1 border-divider" />
            <span className="label-caps">{t('orMunicipalId', lang)}</span>
            <hr className="flex-1 border-divider" />
          </div>

          {role === 'admin' ? (
            <>
              <label htmlFor="officer-email" className="text-sm font-medium">{t('emailLabel', lang)}</label>
              <div className="relative mt-2">
                <input id="officer-email" type="email" autoComplete="username" placeholder={t('emailPlaceholder', lang)} value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
                <IdCard className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
              </div>
              <label htmlFor="officer-password" className="mt-5 block text-sm font-medium">{t('loginPassword', lang)}</label>
              <div className="relative mt-2">
                <input id="officer-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
                <PassToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
              </div>
              <p className="mt-2 text-xs text-ink-3">{t('loginOfficerHint', lang)}</p>
            </>
          ) : (
            <>
              <label htmlFor="agent-name" className="text-sm font-medium">{t('loginName', lang)}</label>
              <div className="relative mt-2">
                <input id="agent-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className="field" />
                <IdCard className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
              </div>
              <label htmlFor="agent-pin" className="mt-5 block text-sm font-medium">{t('passLabel', lang)}</label>
              <div className="relative mt-2">
                <input id="agent-pin" type={showPass ? 'text' : 'password'} inputMode="numeric" maxLength={6} autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="field" />
                <PassToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
              </div>
            </>
          )}

          {error && <p role="alert" className="mt-4 rounded-lg bg-high-tint px-3 py-2 text-sm font-medium text-high">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-black text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-ink-3"
          >
            {busy ? t('loginBusy', lang) : <>{t('enter', lang)}<ArrowRight className="size-5" aria-hidden /></>}
          </button>
          <p className="mt-6 text-center text-sm text-ink-3">{t('enterHi', lang)}</p>
        </form>

        <section className="w-full max-w-[548px] rounded-2xl border border-divider bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="label-caps flex items-center gap-2 !text-black">
              <span className="size-2 rounded-full bg-black" aria-hidden />
              {t('noteTitle', lang)}
            </p>
            <span className="caption-mono text-ink-3">{t('noteTag', lang)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">{t('noteBody', lang)}</p>
          <p className="mt-3 text-sm font-medium">{t('dataBadge', lang)}</p>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-white px-6 py-5 text-sm text-ink-2 sm:px-20">
        <span>{t('footer', lang)}</span>
        <span>{t('footerLicense', lang)}</span>
      </footer>
    </div>
  )
}

function PassToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  const lang = useUi((s) => s.lang)
  return (
    <button type="button" onClick={onToggle} aria-label={t(show ? 'hidePass' : 'showPass', lang)}
      className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-ink-2 focus-visible:outline-2 focus-visible:outline-black">
      {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}

export function LangToggle() {
  const { lang, setLang } = useUi()
  return (
    <div role="radiogroup" aria-label="Language" className="flex gap-1 rounded-lg bg-surface p-1">
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-9 min-w-11 rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black ${
            lang === l ? 'bg-white shadow-sm' : 'text-ink-2'
          }`}
        >
          {l === 'en' ? 'EN' : 'हिं'}
        </button>
      ))}
    </div>
  )
}
