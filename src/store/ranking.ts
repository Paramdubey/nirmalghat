import { create } from 'zustand'

interface RankingState {
  /** Ghat chosen with "View evidence"; used by the evidence screen. */
  selectedSite: string | null
  selectSite: (site: string | null) => void
  /** Ghat to scroll to and highlight when the ranking page opens (set by the map). */
  focusSite: string | null
  setFocusSite: (site: string | null) => void
}

export const useRanking = create<RankingState>((set) => ({
  selectedSite: null,
  selectSite: (selectedSite) => set({ selectedSite }),
  focusSite: null,
  setFocusSite: (focusSite) => set({ focusSite }),
}))
