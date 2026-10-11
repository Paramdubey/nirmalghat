import { create } from 'zustand'
import type { FieldReport } from '../constants/fieldForm'
import type { AgentAccount, Assignment, BriefSnapshot } from '../lib/apiTypes'
import { agentEmail, agentNameKey, PIN_PATTERN, signupClient, supabase } from '../lib/supabase'

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

type Row = Record<string, unknown>

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

/** Officer-side view of field agents and the briefs assigned to them. Stored in Supabase, protected by RLS. */
export const useOfficerData = create<OfficerState>((set, get) => ({
  agents: [],
  assignments: [],
  loaded: false,
  error: null,
  load: async () => {
    try {
      const [agentRows, assignmentRows, submissionRows] = await Promise.all([
        supabase.from('agents').select('id,name,ghats,created_at').order('created_at'),
        supabase.from('assignments').select('id,agent_id,site,brief,created_at,agents(name)').order('created_at', { ascending: false }),
        supabase.from('submissions').select('id,assignment_id,report,submitted_at'),
      ])
      const subs = new Map((check<Row[]>(submissionRows)).map((s) => [s.assignment_id as string, s]))
      set({
        agents: check<Row[]>(agentRows).map((a) => ({ id: a.id as string, name: a.name as string, ghats: a.ghats as string[], createdAt: a.created_at as string })),
        assignments: check<Row[]>(assignmentRows).map((a) => {
          const s = subs.get(a.id as string)
          const joined = a.agents as { name?: string } | { name?: string }[] | null
          return {
            id: a.id as string, agentId: a.agent_id as string, agentName: (Array.isArray(joined) ? joined[0]?.name : joined?.name) ?? '',
            site: a.site as string, brief: a.brief as BriefSnapshot, createdAt: a.created_at as string,
            submission: s ? { id: s.id as string, report: s.report as FieldReport, submittedAt: s.submitted_at as string } : null,
          }
        }),
        loaded: true,
        error: null,
      })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load field agents' })
    }
  },
  createAgent: async (name, pin, ghats) => {
    if (name.trim() === '' || name.length > 80) throw new Error('Enter a name or squad label (up to 80 characters)')
    if (!PIN_PATTERN.test(pin)) throw new Error('PIN must be exactly 6 digits')
    if (ghats.length === 0) throw new Error('Choose at least one ghat')
    const { data, error } = await signupClient().auth.signUp({ email: await agentEmail(name), password: pin })
    if (error) throw new Error(/already registered/i.test(error.message) ? 'A field agent with this name already exists' : error.message)
    if (!data.user || (data.user.identities?.length ?? 1) === 0) throw new Error('A field agent with this name already exists')
    const inserted = await supabase.from('agents').insert({ id: data.user.id, name: name.trim(), name_key: agentNameKey(name), ghats: [...new Set(ghats)] })
    if (inserted.error) {
      throw new Error(/duplicate|unique/i.test(inserted.error.message) ? 'A field agent with this name already exists' : inserted.error.message)
    }
    await get().load()
  },
  removeAgent: async (id) => {
    check(await supabase.rpc('officer_delete_agent', { agent: id }))
    await get().load()
  },
  assign: async (site, agentIds, brief) => {
    const ids = [...new Set(agentIds)]
    if (ids.length === 0) throw new Error('Choose at least one field agent')
    if (brief.actions.length === 0) throw new Error('Select at least one recommended action for the brief')
    check(await supabase.from('assignments').insert(ids.map((agent_id) => ({ agent_id, site, brief }))))
    await get().load()
    return ids.length
  },
}))

export const agentsForGhat = (agents: AgentAccount[], ghat: string) => agents.filter((a) => a.ghats.includes(ghat))

