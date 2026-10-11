import { useMemo, useState } from 'react'
import type { Lang } from '../../constants/i18n'
import { generateActions } from '../../lib/actions/generate'
import { generateBrief, type Brief } from '../../lib/brief/generate'
import { daysUntil, DURGA_VISARJAN_2026 } from '../../lib/format'
import { buildRanking } from '../../lib/risk/rank'
import { summarise } from '../../lib/risk/summary'
import { useActions } from '../../store/actions'
import { useData } from '../../store/data'
import { useUi } from '../../store/ui'

/** All briefs for the chosen brief language (one, or English + Hindi). Empty until data is loaded. */
export function useBriefs(): Brief[] {
  const results = useData((s) => s.results)
  const included = useActions((s) => s.included)
  const briefLang = useUi((s) => s.briefLang)
  const [today] = useState(() => new Date()) // date the brief is prepared

  return useMemo(() => {
    if (results.length === 0) return []
    const ranking = buildRanking(results)
    const years = results.map((r) => r.reading.year)
    const input = {
      ranking,
      summary: summarise(ranking, results),
      actions: generateActions(ranking, results).filter((a) => included.includes(a.id)),
      years: { from: Math.min(...years), to: Math.max(...years) },
      today,
      visarjan: DURGA_VISARJAN_2026,
      daysToGo: daysUntil(DURGA_VISARJAN_2026, today),
    }
    const langs: Lang[] = briefLang === 'both' ? ['en', 'hi'] : [briefLang]
    return langs.map((l) => generateBrief(input, l))
  }, [results, included, briefLang, today])
}
