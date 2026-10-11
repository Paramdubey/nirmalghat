const DAY_MS = 24 * 60 * 60 * 1000

/** Whole calendar days from `today` to `target` (negative once the date has passed). */
export function daysUntil(target: Date, today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  return Math.round((end - start) / DAY_MS)
}

export const DURGA_VISARJAN_2026 = new Date(2026, 9, 20)

const HI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'] // TODO: native review
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "11 Oct 2026" / "11 अक्टूबर 2026". Digits stay Western so numbers match the data. */
export function formatDate(d: Date, lang: 'en' | 'hi'): string {
  return `${d.getDate()} ${(lang === 'hi' ? HI_MONTHS : EN_MONTHS)[d.getMonth()]} ${d.getFullYear()}`
}
