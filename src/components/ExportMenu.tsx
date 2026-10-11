import { ChevronDown, Copy, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { t } from '../constants/i18n'
import { copyBrief, printBrief } from '../features/brief/briefActions'
import { useBriefs } from '../features/brief/useBrief'
import { useData } from '../store/data'
import { useUi } from '../store/ui'

/** Header menu: copy the brief or print it. Only shown once data is loaded, because the brief needs it. */
export function ExportMenu() {
  const lang = useUi((s) => s.lang)
  const setView = useUi((s) => s.setView)
  const ready = useData((s) => s.status === 'ready')
  const briefs = useBriefs()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!ready) return null

  async function copy() {
    setNote((await copyBrief(briefs)) ? t('copied', lang) : t('copyFailed', lang))
    setTimeout(() => setNote(''), 2000)
    setOpen(false)
  }
  function print() {
    setOpen(false)
    setView('brief')
    setTimeout(printBrief, 300) // let the brief render first
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full bg-black px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
        {note || t('exportMenu', lang)}
        <ChevronDown className="size-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-20 w-56 rounded-lg border border-divider bg-white p-1 shadow-sm">
          <button role="menuitem" onClick={copy} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-surface"><Copy className="size-4" aria-hidden />{t('copyBrief', lang)}</button>
          <button role="menuitem" onClick={print} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-surface"><Printer className="size-4" aria-hidden />{t('printBrief', lang)}</button>
        </div>
      )}
    </div>
  )
}
