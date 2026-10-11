import { create } from 'zustand'

const KEY = 'nirmalghat.session'

export type Role = 'officer' | 'agent'

interface Stored {
  role: Role
  token: string
  agent: { id: string; name: string } | null
}

function read(): Stored | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (parsed && typeof parsed === 'object' && 'token' in parsed && 'role' in parsed) return parsed as Stored
  } catch {
    // ignore unreadable storage
  }
  return null
}

function write(value: Stored | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the session lasts until the page is closed.
  }
}

interface SessionState {
  session: Stored | null
  setSession: (s: Stored | null) => void
}

/** Sign-in state. The server checks the token on every request; this only remembers it. */
export const useSession = create<SessionState>((set) => ({
  session: read(),
  setSession: (session) => {
    write(session)
    set({ session })
  },
}))
