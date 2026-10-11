const DAY_MS = 24 * 60 * 60 * 1000

/** Whole calendar days from `today` to `target` (negative once the date has passed). */
export function daysUntil(target: Date, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  return Math.round((end - start) / DAY_MS)
}

export const DURGA_VISARJAN_2026 = new Date(2026, 9, 20)
