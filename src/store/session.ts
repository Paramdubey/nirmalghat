import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase, supabaseConfigured } from '../lib/supabase'

export type Role = 'officer' | 'agent'

interface SessionState {
  /** loading until Supabase has told us whether anyone is signed in. */
  status: 'loading' | 'out' | 'in'
  role: Role | null
  agent: { id: string; name: string } | null
  userId: string | null
}

export const useSession = create<SessionState>(() => ({ status: 'loading', role: null, agent: null, userId: null }))

const out = { status: 'out', role: null, agent: null, userId: null } as const

/** Officer = Supabase user with app_metadata.role "officer". Agent = a user with a row in public.agents. Anyone else is signed out. */
async function resolve(session: Session | null) {
  if (!session) return useSession.setState(out)
  if (session.user.app_metadata?.role === 'officer') {
    return useSession.setState({ status: 'in', role: 'officer', agent: null, userId: session.user.id })
  }
  const { data } = await supabase.from('agents').select('id,name').eq('id', session.user.id).maybeSingle()
  if (!data) {
    await supabase.auth.signOut()
    return useSession.setState(out)
  }
  useSession.setState({ status: 'in', role: 'agent', agent: { id: data.id as string, name: data.name as string }, userId: session.user.id })
}

let started = false
/** Call once at startup. */
export function initAuth() {
  if (started) return
  started = true
  if (!supabaseConfigured) return useSession.setState(out)
  void supabase.auth.getSession().then(({ data }) => resolve(data.session))
  // Avoid awaiting Supabase calls inside this callback; defer them.
  supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => void resolve(session), 0) })
}
