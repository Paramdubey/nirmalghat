import { parseBhopalCsv, type ParseResult } from './parse'

export const PRIMARY_FILE = 'data/bhopal_ghats_2023_2025.csv'
export const SAMPLE_FILE = 'data/sample_bhopal_2025.csv'

export class DataLoadError extends Error {
  readonly file: string
  constructor(file: string, detail: string) {
    super(`Could not load ${file}: ${detail}`)
    this.file = file
  }
}

export interface LoadedData extends ParseResult {
  file: string
  isSample: boolean
}

/** Loads one CSV. On failure it throws an error naming the file — it never falls back to another file. */
export async function loadBhopalData(file: string = PRIMARY_FILE): Promise<LoadedData> {
  let response: Response
  try {
    response = await fetch(`${import.meta.env.BASE_URL}${file}`)
  } catch {
    throw new DataLoadError(file, 'network error')
  }
  if (!response.ok) throw new DataLoadError(file, `HTTP ${response.status}`)
  const result = parseBhopalCsv(await response.text())
  if (result.readings.length === 0) throw new DataLoadError(file, 'no readings found in file')
  return { ...result, file, isSample: file === SAMPLE_FILE }
}
