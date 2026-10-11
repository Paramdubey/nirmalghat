import { useState } from 'react'
import { FIELD_PARAMETERS, validateFieldReport, type FieldReading, type FieldReadingStatus, type FieldReport, type FieldStage } from '../../constants/fieldForm'
import { t, type StringKey } from '../../constants/i18n'
import { useUi } from '../../store/ui'

interface Row {
  status: FieldReadingStatus
  text: string
}

const MODES: { value: FieldReadingStatus; label: StringKey }[] = [
  { value: 'valid', label: 'ffModeValue' }, { value: 'BDL', label: 'ffModeBdl' },
  { value: 'ND', label: 'ffModeNd' }, { value: 'not measured', label: 'ffModeNone' },
]
const STAGES: { value: FieldStage; label: StringKey }[] = [
  { value: 'pre', label: 'ffStagePre' }, { value: 'during', label: 'ffStageDuring' }, { value: 'after', label: 'ffStageAfter' },
]

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Simple form for the readings recorded after a brief is carried out. Large controls, works in English and Hindi. */
export function FieldForm({ onSubmit }: { onSubmit: (report: FieldReport) => Promise<void> }) {
  const lang = useUi((s) => s.lang)
  const [sampledOn, setSampledOn] = useState(today())
  const [stage, setStage] = useState<FieldStage | ''>('')
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(FIELD_PARAMETERS.map((p) => [p.name, { status: p.core ? 'valid' : 'not measured', text: '' } as Row])))
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setRow = (name: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [name]: { ...r[name], ...patch } }))

  function buildReport(): FieldReport {
    const readings: FieldReading[] = FIELD_PARAMETERS.map((p) => {
      const row = rows[p.name]
      if (row.status !== 'valid') return { parameter: p.name, status: row.status }
      const text = row.text.trim()
      return { parameter: p.name, status: 'valid', value: text === '' ? Number.NaN : Number(text) }
    })
    return { sampledOn, stage: (stage || 'pre') as FieldStage, readings, notes: notes.trim() }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const report = buildReport()
    const problems = validateFieldReport(report)
    if (stage === '') problems.push('stage')
    setErrors(problems)
    setServerError(null)
    if (problems.length > 0) return
    setBusy(true)
    try {
      await onSubmit(report)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not submit')
    } finally {
      setBusy(false)
    }
  }

  const has = (code: string) => errors.includes(code)

  return (
    <form onSubmit={submit} noValidate className="rounded-lg border border-divider p-4 sm:p-6">
      <h2 className="text-xl font-bold leading-7">{t('ffTitle', lang)}</h2>
      <p className="mt-1 text-sm text-ink-2">{t('ffLead', lang)}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t('ffDate', lang)}
          <input type="date" value={sampledOn} onChange={(e) => setSampledOn(e.target.value)} className="field mt-1 pr-4" aria-invalid={has('date')} />
          {has('date') && <span role="alert" className="mt-1 block text-sm text-high">{t('ffPickDate', lang)}</span>}
        </label>
        <fieldset>
          <legend className="text-sm font-medium">{t('ffStage', lang)}</legend>
          <div role="radiogroup" className="mt-1 grid gap-1 rounded-xl bg-surface p-1">
            {STAGES.map((s) => (
              <button key={s.value} type="button" role="radio" aria-checked={stage === s.value} onClick={() => setStage(s.value)}
                className={`min-h-11 rounded-lg px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-black ${stage === s.value ? 'bg-black text-white' : ''}`}>
                {t(s.label, lang)}
              </button>
            ))}
          </div>
          {has('stage') && <span role="alert" className="mt-1 block text-sm text-high">{t('ffPickStage', lang)}</span>}
        </fieldset>
      </div>

      <div className="mt-6 space-y-3">
        {FIELD_PARAMETERS.map((p) => {
          const row = rows[p.name]
          const bad = errors.some((e) => e.endsWith(`:${p.name}`))
          return (
            <div key={p.name} className={`rounded-lg border p-3 ${bad ? 'border-high bg-high-tint' : 'border-divider'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{p.name}{p.unit && <span className="font-normal text-ink-3"> ({p.unit})</span>}</p>
                {p.core && <span className="caption-mono rounded-full bg-black px-2 py-0.5 font-semibold uppercase text-white">{t('ffRequired', lang)}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <select aria-label={p.name} value={row.status} onChange={(e) => setRow(p.name, { status: e.target.value as FieldReadingStatus })}
                  className="min-h-11 min-w-0 flex-1 basis-48 rounded-lg border border-divider bg-white px-3 text-sm">
                  {MODES.map((m) => <option key={m.value} value={m.value}>{t(m.label, lang)}</option>)}
                </select>
                {row.status === 'valid' && (
                  <input aria-label={`${p.name} ${t('ffValue', lang)}`} inputMode="decimal" value={row.text} onChange={(e) => setRow(p.name, { text: e.target.value.replace(',', '.') })}
                    className="min-h-11 w-32 rounded-lg border border-divider bg-white px-3 text-sm" aria-invalid={bad} />
                )}
              </div>
              {bad && <p role="alert" className="mt-1 text-sm text-high">{p.core && row.status === 'not measured' ? t('ffNeedAnswer', lang) : t('ffAskDo', lang, { max: p.max })}</p>}
            </div>
          )
        })}
      </div>

      <label className="mt-5 block text-sm font-medium">
        {t('ffNotes', lang)}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-divider bg-white p-3 text-sm" />
      </label>
      <p className="mt-2 text-xs text-ink-3">{t('ffSyncNote', lang)}</p>

      {errors.length > 0 && <p role="alert" className="mt-4 text-sm font-semibold text-high">{t('ffFixErrors', lang)}</p>}
      {serverError && <p role="alert" className="mt-4 rounded-lg bg-high-tint p-3 text-sm font-medium text-high">{serverError}</p>}
      <button type="submit" disabled={busy} className="mt-4 min-h-14 w-full rounded-full bg-black text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-ink-3">
        {busy ? t('ffSubmitting', lang) : t('ffSubmit', lang)}
      </button>
    </form>
  )
}
