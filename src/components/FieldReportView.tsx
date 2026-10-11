import { FIELD_PARAMETERS, type FieldReport } from '../constants/fieldForm'
import { t, type StringKey } from '../constants/i18n'
import { useUi } from '../store/ui'

const STAGE_KEY: Record<string, StringKey> = { pre: 'ffStagePre', during: 'ffStageDuring', after: 'ffStageAfter' }

/** Read-only table of what a field agent recorded. Every status keeps its own wording; none becomes a number. */
export function FieldReportView({ report }: { report: FieldReport }) {
  const lang = useUi((s) => s.lang)
  return (
    <div className="mt-2 text-sm">
      <p className="font-medium">{report.sampledOn} · {t(STAGE_KEY[report.stage], lang)}</p>
      <table className="tabular mt-2 w-full text-left">
        <tbody>
          {FIELD_PARAMETERS.map((p) => {
            const r = report.readings.find((x) => x.parameter === p.name)
            const text = !r ? '—' : r.status === 'valid' ? `${r.value}${p.unit ? ` ${p.unit}` : ''}` : r.status === 'not measured' ? t('ffModeNone', lang) : r.status
            return (
              <tr key={p.name} className="border-t border-divider">
                <th scope="row" className="py-1 pr-3 font-medium">{p.name}</th>
                <td className="py-1">{text}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {report.notes && <p className="mt-2 text-ink-2">{report.notes}</p>}
    </div>
  )
}
