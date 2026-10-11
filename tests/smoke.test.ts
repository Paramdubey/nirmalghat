import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { expect, test } from 'vitest'

test('real Bhopal CSV loads and yields seven ghats', () => {
  const text = readFileSync('public/data/bhopal_ghats_2023_2025.csv', 'utf8')
  const { data } = Papa.parse<{ site: string }>(text, { header: true, skipEmptyLines: true })
  expect(data).toHaveLength(1524)
  expect(new Set(data.map((r) => r.site)).size).toBe(7)
})
