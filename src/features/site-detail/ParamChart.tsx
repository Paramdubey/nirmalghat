import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART } from '../../components/chartConfig'
import { RESULT_KEY, t } from '../../constants/i18n'
import { isBreach } from '../../lib/risk/evaluate'
import { axisTicks, type SeriesPoint } from '../../lib/risk/series'
import { useUi } from '../../store/ui'

type Reference = { kind: 'line'; y: number; label: string } | { kind: 'band'; low: number; high: number; label: string }

interface Row extends SeriesPoint {
  band: number | null
}

/** One shape per status, so status never depends on colour alone. */
function Marker({ cx, cy, status, breach }: { cx: number; cy: number; status: SeriesPoint['status']; breach: boolean }) {
  const stroke = CHART.line
  switch (status) {
    case 'valid':
      return breach
        ? <rect x={cx - 5} y={cy - 5} width={10} height={10} fill={CHART.breach} stroke={stroke} strokeWidth={1.5} />
        : <circle cx={cx} cy={cy} r={4.5} fill={stroke} />
    case 'BDL':
      return <path d={`M${cx} ${cy - 6}L${cx + 6} ${cy}L${cx} ${cy + 6}L${cx - 6} ${cy}Z`} fill="#fff" stroke={stroke} strokeWidth={1.5} />
    case 'ND':
      return <path d={`M${cx} ${cy - 6}L${cx + 6} ${cy + 5}L${cx - 6} ${cy + 5}Z`} fill="#fff" stroke={stroke} strokeWidth={1.5} />
    case 'not sampled':
      return <circle cx={cx} cy={cy} r={5} fill="#fff" stroke={stroke} strokeWidth={1.5} />
    case 'no table':
      return <path d={`M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx + 5} ${cy - 5}L${cx - 5} ${cy + 5}`} stroke={stroke} strokeWidth={1.5} />
  }
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const lang = useUi((s) => s.lang)
  const p = active ? payload?.[0]?.payload : undefined
  if (!p) return null
  const text =
    p.status === 'valid' ? `${p.value} ${p.unit}`.trim()
    : p.status === 'BDL' ? 'BDL — below detection limit (not zero)'
    : p.status === 'ND' ? 'ND — not detected'
    : p.status === 'not sampled' ? 'Not sampled (blank in report)'
    : 'No table for this festival in the report'
  return (
    <div className="rounded-lg border border-divider bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold">{text}</p>
      {p.result && p.status === 'valid' && <p>{t(RESULT_KEY[p.result], lang)}</p>}
      <p className="text-ink-2">{p.event.year} {p.event.festival}, {p.phase}</p>
      {p.sourcePage && <p className="text-ink-2">PDF page {p.sourcePage}</p>}
      {p.printed && p.status === 'valid' && <p className="text-ink-3">As printed: {p.printed}</p>}
    </div>
  )
}

export function ParamChart({ title, points, reference }: { title: string; points: SeriesPoint[]; reference: Reference }) {
  const lang = useUi((s) => s.lang)
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]))
  const isBand = reference.kind === 'band'
  const lowest = isBand ? Math.floor(Math.min(...values, reference.low) - 1) : 0
  const top = isBand
    ? Math.ceil(Math.max(...values, reference.high) + 1)
    : axisTicks(Math.max(reference.y * 1.6, ...values, 1)).max
  const span = top - lowest
  const bandBottom = lowest - span * 0.18
  const bandY = lowest - span * 0.09
  const rows: Row[] = points.map((p) => ({ ...p, band: p.value === null ? bandY : null }))
  const ticks = isBand
    ? Array.from({ length: top - lowest + 1 }, (_, i) => lowest + i)
    : axisTicks(top).ticks

  return (
    <figure className="rounded-lg border border-divider p-4">
      <figcaption className="text-lg font-bold">{title}</figcaption>
      <div role="img" aria-label={`${title}: ${values.length} recorded values out of ${points.length} stages`} style={{ height: CHART.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ ...CHART.margin, left: 16, bottom: 40 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" interval={0} angle={-55} textAnchor="end" tick={CHART.tick} height={64} tickLine={false} />
            <YAxis domain={[bandBottom, top]} ticks={ticks} tick={CHART.tick} width={36} allowDataOverflow />
            <ReferenceArea y1={bandBottom} y2={lowest - span * 0.02} fill={CHART.bandFill} label={{ value: t('noNumber', lang), position: 'insideLeft', fontSize: 10, fill: CHART.axis }} />
            {reference.kind === 'line'
              ? <ReferenceLine y={reference.y} stroke={CHART.reference} strokeDasharray="6 4" label={{ value: reference.label, position: 'insideTopRight', fontSize: 11, fill: CHART.reference }} />
              : <ReferenceArea y1={reference.low} y2={reference.high} fill={CHART.reference} fillOpacity={0.1} stroke={CHART.reference} strokeDasharray="6 4" label={{ value: reference.label, position: 'insideTopRight', fontSize: 11, fill: CHART.reference }} />}
            <Tooltip content={<PointTooltip />} />
            {/* connectNulls is false: a missing value breaks the line instead of being joined across */}
            <Line dataKey="value" stroke={CHART.line} strokeWidth={1.5} connectNulls={false} isAnimationActive={false}
              dot={(d: { cx?: number; cy?: number; payload?: Row; index?: number }) =>
                d.payload && d.payload.status === 'valid' && d.cx !== undefined && d.cy !== undefined
                  ? <Marker key={d.index} cx={d.cx} cy={d.cy} status="valid" breach={d.payload.result !== null && isBreach(d.payload.result)} />
                  : <g key={d.index} />}
              activeDot={false} />
            <Line dataKey="band" stroke="none" isAnimationActive={false} connectNulls={false}
              dot={(d: { cx?: number; cy?: number; payload?: Row; index?: number }) =>
                d.payload && d.payload.status !== 'valid' && d.cx !== undefined && d.cy !== undefined
                  ? <Marker key={d.index} cx={d.cx} cy={d.cy} status={d.payload.status} breach={false} />
                  : <g key={d.index} />}
              activeDot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
