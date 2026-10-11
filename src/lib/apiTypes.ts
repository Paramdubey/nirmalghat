import type { FieldReport } from '../constants/fieldForm'
import type { ProposedAction } from './actions/generate'
import type { SiteRisk } from '../types'

export interface AgentAccount {
  id: string
  name: string
  ghats: string[]
  createdAt: string
}

/** What the officer's browser sends and the field app later turns back into a brief. */
export interface BriefSnapshot {
  risk: SiteRisk
  actions: ProposedAction[]
}

export interface FieldSubmission {
  id: string
  report: FieldReport
  submittedAt: string
}

export interface Assignment {
  id: string
  agentId: string
  agentName?: string
  site: string
  brief: BriefSnapshot
  createdAt: string
  submission: FieldSubmission | null
}
