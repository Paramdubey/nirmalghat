import { Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { t } from '../../constants/i18n'
import { useAgents } from '../../store/agents'
import { useUi } from '../../store/ui'

/** Officer-entered roster. Names are typed by the officer, never invented, and stay in this browser. */
export function FieldAgentsPanel({ ghats }: { ghats: string[] }) {
  const lang = useUi((s) => s.lang)
  const { agents, add, remove } = useAgents()
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() === '' || picked.length === 0) return setError(true)
    add(name, picked)
    setName('')
    setPicked([])
    setError(false)
  }

  return (
    <details className="rounded-lg border border-divider p-5">
      <summary className="flex cursor-pointer items-center gap-2 text-base font-bold">
        <Users className="size-5" aria-hidden />{t('agMenu', lang)}
        <span className="tabular rounded-full bg-surface px-2 text-sm font-medium">{agents.length}</span>
      </summary>
      <p className="mt-3 text-sm text-ink-2">{t('agNote', lang)}</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium">
          {t('agName', lang)}
          <input value={name} onChange={(e) => setName(e.target.value)} className="field mt-1 max-w-md pr-4" autoComplete="off" />
        </label>
        <fieldset>
          <legend className="label-caps mb-2">{t('agGhats', lang)}</legend>
          <div className="flex flex-wrap gap-2">
            {ghats.map((g) => {
              const on = picked.includes(g)
              return (
                <button key={g} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== g) : [...p, g]))}
                  className={`min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${on ? 'bg-black text-white' : 'bg-surface hover:bg-divider'}`}>
                  {g}
                </button>
              )
            })}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm font-medium text-high">{t('agNeed', lang)}</p>}
        <button type="submit" className="min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">{t('agAdd', lang)}</button>
      </form>
      {agents.length === 0 ? <p className="mt-4 text-sm text-ink-3">{t('agNone', lang)}</p> : (
        <ul className="mt-4 divide-y divide-divider">
          {agents.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-xs text-ink-3">{a.ghats.join(' · ')}</p>
              </div>
              <button onClick={() => remove(a.id)} aria-label={t('agRemove', lang, { name: a.name })} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-black">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
