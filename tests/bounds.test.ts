import { describe, expect, test } from 'vitest'
import { BHOPAL_CENTER, isPlausibleLocation } from '../src/lib/map/bounds'

describe('map position sanity box', () => {
  test('the centre of Bhopal is plausible', () => expect(isPlausibleLocation(BHOPAL_CENTER.lat, BHOPAL_CENTER.lng)).toBe(true))
  test('places far away, NaN and swapped coordinates are rejected', () => {
    expect(isPlausibleLocation(28.61, 77.2)).toBe(false) // Delhi
    expect(isPlausibleLocation(Number.NaN, 77.4)).toBe(false)
    expect(isPlausibleLocation(77.4, 23.26)).toBe(false) // lat/lng swapped
  })
})
