import { create } from 'zustand'
import type { Lang } from '../constants/i18n'

const LANG_KEY = 'nirmalghat.lang'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be blocked (private mode); preferences are optional.
  }
}

export type View = 'overview' | 'ranking' | 'evidence' | 'actions' | 'agents' | 'quality'

export type BriefLang = 'en' | 'hi' | 'both'

interface UiState {
  briefLang: BriefLang
  setBriefLang: (l: BriefLang) => void
  view: View
  setView: (view: View) => void
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useUi = create<UiState>((set) => ({
  briefLang: 'both',
  setBriefLang: (briefLang) => set({ briefLang }),
  view: 'overview',
  setView: (view) => set({ view }),
  lang: read(LANG_KEY) === 'hi' ? 'hi' : 'en',
  setLang: (lang) => {
    write(LANG_KEY, lang)
    set({ lang })
  },
}))
