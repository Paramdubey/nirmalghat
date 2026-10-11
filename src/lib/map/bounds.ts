// Same rough box as the database check in supabase/migrations/0002_ghat_locations.sql.
export const BHOPAL_CENTER = { lat: 23.2599, lng: 77.4126 } as const
export const BOUNDS = { latMin: 22.5, latMax: 24.0, lngMin: 76.5, lngMax: 78.0 } as const

export function isPlausibleLocation(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= BOUNDS.latMin && lat <= BOUNDS.latMax && lng >= BOUNDS.lngMin && lng <= BOUNDS.lngMax
}
