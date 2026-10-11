import { create } from 'zustand'
import { EMPTY_FILTERS } from '../lib/risk/rank'
import type { Filters, SortKey } from '../types'

interface RankingState {
  filters: Filters
  sort: SortKey
  /** Ghat chosen with "View evidence"; used by the evidence screen. */
  selectedSite: string | null
  toggle: <K extends 'sites' | 'festivals' | 'years' | 'phases' | 'parameters' | 'labels'>(key: K, value: Filters[K][number]) => void
  setUncertainOnly: (on: boolean) => void
  setSort: (sort: SortKey) => void
  clearFilters: () => void
  selectSite: (site: string | null) => void
}

export const useRanking = create<RankingState>((set) => ({
  filters: EMPTY_FILTERS,
  sort: 'priority',
  selectedSite: null,
  toggle: (key, value) =>
    set((s) => {
      const current = s.filters[key] as (typeof value)[]
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { filters: { ...s.filters, [key]: next } }
    }),
  setUncertainOnly: (on) => set((s) => ({ filters: { ...s.filters, uncertainOnly: on } })),
  setSort: (sort) => set({ sort }),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),
  selectSite: (selectedSite) => set({ selectedSite }),
}))

export function hasActiveFilters(f: Filters): boolean {
  return f.uncertainOnly || [f.sites, f.festivals, f.years, f.phases, f.parameters, f.labels].some((a) => a.length > 0)
}
