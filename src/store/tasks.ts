import { create } from 'zustand'
import type { FieldReport } from '../constants/fieldForm'
import { api } from '../lib/api'
import type { Assignment, FieldSubmission } from '../lib/apiTypes'

interface TasksState {
  tasks: Assignment[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  submit: (assignmentId: string, report: FieldReport) => Promise<FieldSubmission>
}

/** The signed-in field agent's own assigned briefs. */
export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,
  error: null,
  load: async () => {
    try {
      set({ tasks: await api<Assignment[]>('/api/my/assignments'), loaded: true, error: null })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load your briefs' })
    }
  },
  submit: async (assignmentId, report) => {
    const submission = await api<FieldSubmission>(`/api/my/assignments/${assignmentId}/submission`, { method: 'POST', body: report })
    await get().load()
    return submission
  },
}))
