import { create } from 'zustand'

const KEY = 'nirmalghat.fieldAgents'

/** A field agent the officer typed in: a name or squad label plus the ghats they cover. Local to this browser. */
export interface FieldAgent {
  id: string
  name: string
  ghats: string[]
}

function read(): FieldAgent[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a): a is FieldAgent =>
      typeof a === 'object' && a !== null && typeof (a as FieldAgent).id === 'string' &&
      typeof (a as FieldAgent).name === 'string' && Array.isArray((a as FieldAgent).ghats))
  } catch {
    return []
  }
}

function save(agents: FieldAgent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(agents))
  } catch {
    // Storage blocked: the roster still works for this session.
  }
}

interface AgentsState {
  agents: FieldAgent[]
  add: (name: string, ghats: string[]) => void
  remove: (id: string) => void
}

export const useAgents = create<AgentsState>((set) => ({
  agents: read(),
  add: (name, ghats) =>
    set((s) => {
      const agents = [...s.agents, { id: crypto.randomUUID(), name: name.trim(), ghats }]
      save(agents)
      return { agents }
    }),
  remove: (id) =>
    set((s) => {
      const agents = s.agents.filter((a) => a.id !== id)
      save(agents)
      return { agents }
    }),
}))

/** Agents linked to one ghat — the only ones offered in that ghat's dropdown. */
export const agentsForGhat = (agents: FieldAgent[], ghat: string) => agents.filter((a) => a.ghats.includes(ghat))
