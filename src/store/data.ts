import { create } from 'zustand'
import { DataLoadError, loadBhopalData } from '../lib/data/load'
import { evaluateAll } from '../lib/risk/evaluate'
import type { LoadIssue, ReadingResult } from '../types'

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  results: ReadingResult[]
  issues: LoadIssue[]
  file: string
  isSample: boolean
  error: string | null
  load: () => Promise<void>
}

export const useData = create<DataState>((set, get) => ({
  status: 'idle',
  results: [],
  issues: [],
  file: '',
  isSample: false,
  error: null,
  load: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading', error: null })
    try {
      const data = await loadBhopalData()
      set({ status: 'ready', results: evaluateAll(data.readings), issues: data.issues, file: data.file, isSample: data.isSample })
    } catch (e) {
      const message = e instanceof DataLoadError ? e.message : `Could not load data: ${e instanceof Error ? e.message : 'unknown error'}`
      set({ status: 'error', error: message })
    }
  },
}))
