import { Check, Copy, Printer, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { t, type Lang } from '../../constants/i18n'
import type { ProposedAction } from '../../lib/actions/generate'
import { generateFieldBrief } from '../../lib/brief/generate'
import { daysUntil, DURGA_VISARJAN_2026 } from '../../lib/format'
import { useUi, type BriefLang } from '../../store/ui'
import type { SiteRisk } from '../../types'
import { BriefSheet } from '../../components/BriefSheet'
import { copyBrief } from './briefActions'

const OPTIONS: { value: BriefLang; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'both', label: 'Bilingual / द्विभाषी' },
]

interface Props {
  risk: SiteRisk
  actions: ProposedAction[]
  agent: string | null
  onClose: () => void
}

/** Preview of one ghat's field brief with copy and print. Rendered in a portal so printing shows only the brief. */
export function FieldBriefModal({ risk, actions, agent, onClose }: Props) {
  const lang = useUi((s) => s.lang)
  const { briefLang, setBriefLang } = useUi()
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [today] = useState(() => new Date())

  const briefs = useMemo(() => {
    const input = { risk, actions, agent, today, visarjan: DURGA_VISARJAN_2026, daysToGo: daysUntil(DURGA_VISARJAN_2026, today) }
    const langs: Lang[] = briefLang === 'both' ? ['en', 'hi'] : [briefLang]
    return langs.map((l) => generateFieldBrief(input, l))
  }, [risk, actions, agent, today, briefLang])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copy() {
    setStatus((await copyBrief(briefs)) ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return createPortal(
    <div className="brief-modal fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={t('fbTitle', lang)}>
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-4 sm:p-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label={t('briefLanguage', lang)} className="flex flex-wrap gap-1 rounded-xl bg-surface p-1">
            {OPTIONS.map((o) => (
              <button key={o.value} role="radio" aria-checked={briefLang === o.value} onClick={() => setBriefLang(o.value)}
                className={`min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-black ${briefLang === o.value ? 'bg-black text-white' : ''}`}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copy} className="flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-black">
              {status === 'copied' ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {status === 'copied' ? t('copied', lang) : status === 'failed' ? t('copyFailed', lang) : t('copyBrief', lang)}
            </button>
            <button onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              <Printer className="size-4" aria-hidden />{t('printBrief', lang)}
            </button>
            <button onClick={onClose} aria-label={t('fbClose', lang)} className="grid size-11 place-items-center rounded-full bg-surface focus-visible:outline-2 focus-visible:outline-black">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <p className="no-print mt-3 text-sm text-ink-2">{t('fbDraftNote', lang)}</p>
        <div className="brief-print mt-4 space-y-6">
          {briefs.map((b) => <BriefSheet key={b.lang} brief={b} />)}
        </div>
      </div>
    </div>,
    document.body,
  )
}
