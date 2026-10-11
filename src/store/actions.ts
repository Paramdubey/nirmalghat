import { create } from 'zustand'

const KEY = 'nirmalghat.briefActions'

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

interface ActionsState {
  /** Ids of proposed actions the officer chose to include in the brief. Draft selection only, stored locally. */
  included: string[]
  toggle: (id: string) => void
}

export const useActions = create<ActionsState>((set) => ({
  included: read(),
  toggle: (id) =>
    set((s) => {
      const included = s.included.includes(id) ? s.included.filter((x) => x !== id) : [...s.included, id]
      try {
        localStorage.setItem(KEY, JSON.stringify(included))
      } catch {
        // Storage blocked: the choice still works for this session.
      }
      return { included }
    }),
}))
