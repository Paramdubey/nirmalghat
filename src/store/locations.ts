import { create } from 'zustand'
import { isPlausibleLocation } from '../lib/map/bounds'
import { supabase } from '../lib/supabase'
import { useSession } from './session'

export interface GhatLocation {
  site: string
  lat: number
  lng: number
  setAt: string
}

interface LocationsState {
  locations: GhatLocation[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  save: (site: string, lat: number, lng: number) => Promise<void>
}

const MISSING_TABLE = 'Map positions are not set up yet. Run supabase/migrations/0002_ghat_locations.sql in the Supabase SQL editor.'

/** Ghat positions, set by an officer on the map. There are none until an officer sets them. */
export const useLocations = create<LocationsState>((set, get) => ({
  locations: [],
  loaded: false,
  error: null,
  load: async () => {
    const { data, error } = await supabase.from('ghat_locations').select('site,lat,lng,set_at')
    if (error) return set({ error: /does not exist|schema cache|relation/i.test(error.message) ? MISSING_TABLE : error.message, loaded: true })
    set({
      locations: (data as { site: string; lat: number; lng: number; set_at: string }[]).map((r) => ({ site: r.site, lat: r.lat, lng: r.lng, setAt: r.set_at })),
      loaded: true,
      error: null,
    })
  },
  save: async (site, lat, lng) => {
    if (!isPlausibleLocation(lat, lng)) throw new Error('That spot is outside the Bhopal area. Click on the map near Bhopal.')
    const userId = useSession.getState().userId
    const { error } = await supabase.from('ghat_locations').upsert({ site, lat, lng, set_by: userId, set_at: new Date().toISOString() }, { onConflict: 'site' })
    if (error) throw new Error(/does not exist|schema cache|relation/i.test(error.message) ? MISSING_TABLE : error.message)
    await get().load()
  },
}))
