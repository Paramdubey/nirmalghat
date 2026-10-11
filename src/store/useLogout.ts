import { api } from '../lib/api'
import { useSession } from './session'

/** Ends the server session, then forgets it locally. */
export function useLogout() {
  const setSession = useSession((s) => s.setSession)
  return () => {
    void api('/api/logout', { method: 'POST' }).catch(() => undefined).finally(() => setSession(null))
  }
}
