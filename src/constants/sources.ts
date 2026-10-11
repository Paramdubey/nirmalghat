// Source report each reading comes from, by year. Shown as text only: no links to PDF pages are invented.
export function sourceReport(year: number): string {
  return year === 2023
    ? 'MPPCB Idol Immersion Report 2023 (CPCB format)'
    : `MPPCB Ganesh and Durga Visarjan Report ${year}`
}
