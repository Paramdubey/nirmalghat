import { Check, Copy, Printer } from 'lucide-react'
import { useState } from 'react'
import { t } from '../../constants/i18n'
import type { Brief } from '../../lib/brief/generate'
import { useActions } from '../../store/actions'
import { useUi, type BriefLang } from '../../store/ui'
import { copyBrief, printBrief } from './briefActions'
import { useBriefs } from './useBrief'

const OPTIONS: { value: BriefLang; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'both', label: 'Bilingual / द्विभाषी' },
]

export function BriefPage() {
  const lang = useUi((s) => s.lang)
  const { briefLang, setBriefLang, setView } = useUi()
  const included = useActions((s) => s.included)
  const briefs = useBriefs()
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    setStatus((await copyBrief(briefs)) ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="no-print">
        <h1 className="text-[32px] font-bold leading-10">{t('briefTitle', lang)}</h1>
        <p className="mt-1 text-base text-ink-2">{t('briefLead', lang)}</p>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={t('briefLanguage', lang)} className="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
          {OPTIONS.map((o) => (
            <button key={o.value} role="radio" aria-checked={briefLang === o.value} onClick={() => setBriefLang(o.value)}
              className={`min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-black ${briefLang === o.value ? 'bg-black text-white' : ''}`}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
            {status === 'copied' ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {status === 'copied' ? t('copied', lang) : status === 'failed' ? t('copyFailed', lang) : t('copyBrief', lang)}
          </button>
          <button onClick={printBrief} className="flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
            <Printer className="size-4" aria-hidden />
            {t('printBrief', lang)}
          </button>
        </div>
      </div>

      <p className="no-print text-sm text-ink-2">
        {included.length === 0 ? t('briefNoActions', lang) : t('briefActionsIncluded', lang, { n: included.length })}{' '}
        <button onClick={() => setView('actions')} className="font-semibold underline">{t('navActions', lang)}</button>
      </p>

      <div className="brief-print space-y-6">
        {briefs.map((b) => <BriefSheet key={b.lang} brief={b} />)}
      </div>
    </div>
  )
}

function BriefSheet({ brief: b }: { brief: Brief }) {
  return (
    <article lang={b.lang} className="brief-sheet rounded-lg border border-divider bg-white p-6 sm:p-10">
      <h2 className="text-2xl font-bold leading-8">{b.title}</h2>
      <p className="mt-1 text-sm text-ink-2">{b.dateLine}</p>
      {b.sections.map((s) => (
        <section key={s.id} className="mt-5">
          <h3 className="label-caps !text-black">{s.heading}</h3>
          {s.paragraphs.map((p) => <p key={p} className="mt-2 text-sm leading-6">{p}</p>)}
          {s.bullets.length > 0 && (
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
              {s.bullets.map((x) => <li key={x}>{x}</li>)}
            </ul>
          )}
        </section>
      ))}
      <p className="mt-6 border-t border-divider pt-4 text-sm font-medium">{b.closing}</p>
    </article>
  )
}
