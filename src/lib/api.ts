import { useSession } from '../store/session'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Calls the NirmalGhat server. A 401 on a signed-in call clears the session so the sign-in page returns. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { session, setSession } = useSession.getState()
  let res: Response
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is it running?')
  }
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && session && path !== '/api/login') setSession(null)
    const message = typeof data === 'object' && data !== null && 'error' in data ? String((data as { error: unknown }).error) : `Error ${res.status}`
    throw new ApiError(res.status, message)
  }
  return data as T
}
