import { AlertTriangle, CircleHelp, Info, TriangleAlert } from 'lucide-react'
import type { StringKey } from '../constants/i18n'
import { t } from '../constants/i18n'
import { useUi } from '../store/ui'
import type { RiskLabel } from '../types'

const STYLE: Record<RiskLabel, { key: StringKey; icon: typeof Info; className: string }> = {
  'High priority': { key: 'labelHigh', icon: TriangleAlert, className: 'bg-high-tint text-high' },
  'Moderate priority': { key: 'labelModerate', icon: AlertTriangle, className: 'bg-moderate-tint text-[#7a5300]' },
  'Lower observed concern': { key: 'labelLower', icon: Info, className: 'bg-info-tint text-info' },
  'Insufficient data': { key: 'labelInsufficient', icon: CircleHelp, className: 'hatch text-ink' },
}

/** Status is always icon + text, never colour alone. */
export function RiskBadge({ label }: { label: RiskLabel }) {
  const lang = useUi((s) => s.lang)
  const { key, icon: Icon, className } = STYLE[label]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      <Icon className="size-4" aria-hidden />
      {t(key, lang)}
    </span>
  )
}
