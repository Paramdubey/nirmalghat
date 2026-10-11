import { create } from 'zustand'
import { api } from '../lib/api'
import type { AgentAccount, Assignment, BriefSnapshot } from '../lib/apiTypes'

interface OfficerState {
  agents: AgentAccount[]
  assignments: Assignment[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  createAgent: (name: string, pin: string, ghats: string[]) => Promise<void>
  removeAgent: (id: string) => Promise<void>
  assign: (site: string, agentIds: string[], brief: BriefSnapshot) => Promise<number>
}

/** Officer-side view of field agents and the briefs assigned to them. Lives on the server. */
export const useOfficerData = create<OfficerState>((set, get) => ({
  agents: [],
  assignments: [],
  loaded: false,
  error: null,
  load: async () => {
    try {
      const [agents, assignments] = await Promise.all([api<AgentAccount[]>('/api/agents'), api<Assignment[]>('/api/assignments')])
      set({ agents, assignments, loaded: true, error: null })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load field agents' })
    }
  },
  createAgent: async (name, pin, ghats) => {
    await api('/api/agents', { method: 'POST', body: { name, pin, ghats } })
    await get().load()
  },
  removeAgent: async (id) => {
    await api(`/api/agents/${id}`, { method: 'DELETE' })
    await get().load()
  },
  assign: async (site, agentIds, brief) => {
    const { created } = await api<{ created: string[] }>('/api/assignments', { method: 'POST', body: { site, agentIds, brief } })
    await get().load()
    return created.length
  },
}))

export const agentsForGhat = (agents: AgentAccount[], ghat: string) => agents.filter((a) => a.ghats.includes(ghat))
