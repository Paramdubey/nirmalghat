export function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-lg border border-divider bg-white p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tabular mt-2 text-[40px] font-bold leading-[48px]">{value}</p>
      <p className="mt-1 text-sm text-ink-3">{sub}</p>
    </div>
  )
}
