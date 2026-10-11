import { create } from 'zustand'
import { validateFieldReport, type FieldReport } from '../constants/fieldForm'
import type { Assignment, BriefSnapshot, FieldSubmission } from '../lib/apiTypes'
import { supabase } from '../lib/supabase'
import { useSession } from './session'

interface TasksState {
  tasks: Assignment[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  submit: (assignmentId: string, report: FieldReport) => Promise<FieldSubmission | null>
}

type Row = Record<string, unknown>

/** The signed-in field agent's own assigned briefs. Row Level Security returns only their rows. */
export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,
  error: null,
  load: async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('id,agent_id,site,brief,created_at,submissions(id,report,submitted_at)')
      .order('created_at', { ascending: false })
    if (error) return set({ error: error.message })
    set({
      tasks: (data as Row[]).map((a) => {
        const raw = a.submissions as Row | Row[] | null
        const s = Array.isArray(raw) ? raw[0] : raw
        return {
          id: a.id as string, agentId: a.agent_id as string, site: a.site as string, brief: a.brief as BriefSnapshot, createdAt: a.created_at as string,
          submission: s ? { id: s.id as string, report: s.report as FieldReport, submittedAt: s.submitted_at as string } : null,
        }
      }),
      loaded: true,
      error: null,
    })
  },
  submit: async (assignmentId, report) => {
    const task = get().tasks.find((t) => t.id === assignmentId)
    const userId = useSession.getState().userId
    if (!task || !userId) throw new Error('Brief not found')
    const problems = validateFieldReport(report)
    if (problems.length > 0) throw new Error(`Please check the form (${problems.join(', ')})`)
    const { error } = await supabase.from('submissions').insert({ assignment_id: assignmentId, agent_id: userId, site: task.site, report })
    if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'A field report was already submitted for this brief' : error.message)
    await get().load()
    return get().tasks.find((t) => t.id === assignmentId)?.submission ?? null
  },
}))
