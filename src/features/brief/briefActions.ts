import { briefsToText, type Brief } from '../../lib/brief/generate'

/** Copies the brief as plain text. Returns false if the browser blocks the clipboard. */
export async function copyBrief(briefs: Brief[]): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(briefsToText(briefs))
    return true
  } catch {
    return false
  }
}

export function printBrief() {
  window.print()
}
