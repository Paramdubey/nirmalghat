import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DatabaseSync } from 'node:sqlite'
import { validateFieldReport } from '../src/constants/fieldForm.ts'

export interface ApiOptions {
  db: DatabaseSync
  /** Officer passcode. Set OFFICER_PASSCODE in the environment to change the demo default. */
  officerPasscode: string
}

type Session = { role: 'officer' } | { role: 'agent'; agentId: string }

const SESSION_HOURS = 12
const MAX_BODY = 200_000
const MAX_FAILS = 5
const LOCKOUT_MS = 15 * 60 * 1000

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const hashPin = (pin: string, salt: string) => scryptSync(pin, salt, 32).toString('hex')
const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY) throw new HttpError(413, 'Request too large')
    chunks.push(chunk as Buffer)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}

/** Builds the request handler for everything under /api. No external services, no keys. */
export function createApi({ db, officerPasscode }: ApiOptions) {
  const fails = new Map<string, { count: number; since: number }>()

  const agentRow = (id: string) => db.prepare('SELECT id, name, ghats, created_at FROM agents WHERE id = ?').get(id) as { id: string; name: string; ghats: string; created_at: string } | undefined
  const publicAgent = (a: { id: string; name: string; ghats: string; created_at: string }) => ({ id: a.id, name: a.name, ghats: JSON.parse(a.ghats) as string[], createdAt: a.created_at })

  function newSession(session: Session): string {
    const token = randomBytes(32).toString('hex')
    db.prepare('INSERT INTO sessions (token_hash, role, agent_id, expires_at) VALUES (?, ?, ?, ?)')
      .run(sha(token), session.role, session.role === 'agent' ? session.agentId : null, Date.now() + SESSION_HOURS * 3600_000)
    return token
  }

  function auth(req: IncomingMessage): Session {
    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const row = token ? db.prepare('SELECT role, agent_id, expires_at FROM sessions WHERE token_hash = ?').get(sha(token)) as { role: string; agent_id: string | null; expires_at: number } | undefined : undefined
    if (!row || row.expires_at < Date.now()) throw new HttpError(401, 'Please sign in')
    if (row.role === 'officer') return { role: 'officer' }
    if (row.agent_id && agentRow(row.agent_id)) return { role: 'agent', agentId: row.agent_id }
    throw new HttpError(401, 'Please sign in')
  }
  const officerOnly = (req: IncomingMessage) => {
    if (auth(req).role !== 'officer') throw new HttpError(403, 'Officer access only')
  }
  const agentOnly = (req: IncomingMessage) => {
    const s = auth(req)
    if (s.role !== 'agent') throw new HttpError(403, 'Field agent access only')
    return s.agentId
  }

  function checkLock(key: string) {
    const f = fails.get(key)
    if (f && f.count >= MAX_FAILS && Date.now() - f.since < LOCKOUT_MS) throw new HttpError(429, 'Too many wrong attempts. Try again in 15 minutes.')
  }
  function recordFail(key: string) {
    const f = fails.get(key)
    if (!f || Date.now() - f.since >= LOCKOUT_MS) fails.set(key, { count: 1, since: Date.now() })
    else f.count++
  }

  async function route(req: IncomingMessage, res: ServerResponse, path: string) {
    const method = req.method ?? 'GET'
    const ip = req.socket.remoteAddress ?? 'unknown'

    if (method === 'POST' && path === '/api/login') {
      const body = (await readBody(req)) as Record<string, unknown>
      if (body.role === 'officer') {
        const key = `officer|${ip}`
        checkLock(key)
        if (typeof body.passcode !== 'string' || !safeEqual(sha(body.passcode), sha(officerPasscode))) {
          recordFail(key)
          throw new HttpError(401, 'Wrong passcode')
        }
        fails.delete(key)
        return send(res, 200, { token: newSession({ role: 'officer' }), role: 'officer' })
      }
      if (body.role === 'agent') {
        if (!isStr(body.name, 80) || typeof body.pin !== 'string') throw new HttpError(400, 'Enter your name and PIN')
        const nameKey = body.name.trim().toLowerCase()
        const key = `agent|${ip}|${nameKey}`
        checkLock(key)
        const row = db.prepare('SELECT id, name, pin_salt, pin_hash FROM agents WHERE name_key = ?').get(nameKey) as { id: string; name: string; pin_salt: string; pin_hash: string } | undefined
        // Same message and similar work whether or not the name exists, so names cannot be probed.
        const ok = row ? safeEqual(hashPin(body.pin, row.pin_salt), row.pin_hash) : (hashPin(body.pin, 'x'.repeat(32)), false)
        if (!row || !ok) {
          recordFail(key)
          throw new HttpError(401, 'Wrong name or PIN')
        }
        fails.delete(key)
        return send(res, 200, { token: newSession({ role: 'agent', agentId: row.id }), role: 'agent', agent: { id: row.id, name: row.name } })
      }
      throw new HttpError(400, 'Unknown role')
    }

    if (method === 'POST' && path === '/api/logout') {
      const header = req.headers.authorization ?? ''
      if (header.startsWith('Bearer ')) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(header.slice(7)))
      return send(res, 200, { ok: true })
    }

    if (method === 'GET' && path === '/api/me') {
      const s = auth(req)
      if (s.role === 'officer') return send(res, 200, { role: 'officer' })
      const a = agentRow(s.agentId)
      return send(res, 200, { role: 'agent', agent: a ? { id: a.id, name: a.name } : null })
    }

    if (path === '/api/agents' && method === 'GET') {
      officerOnly(req)
      const rows = db.prepare('SELECT id, name, ghats, created_at FROM agents ORDER BY created_at').all() as { id: string; name: string; ghats: string; created_at: string }[]
      return send(res, 200, rows.map(publicAgent))
    }

    if (path === '/api/agents' && method === 'POST') {
      officerOnly(req)
      const b = (await readBody(req)) as Record<string, unknown>
      if (!isStr(b.name, 80)) throw new HttpError(400, 'Enter a name or squad label (up to 80 characters)')
      if (typeof b.pin !== 'string' || !/^\d{4}$/.test(b.pin)) throw new HttpError(400, 'PIN must be exactly 4 digits')
      if (!Array.isArray(b.ghats) || b.ghats.length === 0 || b.ghats.length > 50 || !b.ghats.every((g) => isStr(g, 120))) throw new HttpError(400, 'Choose at least one ghat')
      const nameKey = b.name.trim().toLowerCase()
      if (db.prepare('SELECT 1 FROM agents WHERE name_key = ?').get(nameKey)) throw new HttpError(409, 'A field agent with this name already exists')
      const id = randomUUID()
      const salt = randomBytes(16).toString('hex')
      db.prepare('INSERT INTO agents (id, name, name_key, pin_salt, pin_hash, ghats, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, b.name.trim(), nameKey, salt, hashPin(b.pin, salt), JSON.stringify([...new Set(b.ghats as string[])]), new Date().toISOString())
      return send(res, 201, publicAgent(agentRow(id)!))
    }

    const agentMatch = path.match(/^\/api\/agents\/([\w-]+)$/)
    if (agentMatch && method === 'DELETE') {
      officerOnly(req)
      const id = agentMatch[1]
      if (db.prepare('SELECT 1 FROM assignments WHERE agent_id = ?').get(id)) throw new HttpError(409, 'This agent has assigned briefs and cannot be removed')
      db.prepare('DELETE FROM sessions WHERE agent_id = ?').run(id)
      db.prepare('DELETE FROM agents WHERE id = ?').run(id)
      return send(res, 200, { ok: true })
    }

    if (path === '/api/assignments' && method === 'POST') {
      officerOnly(req)
      const b = (await readBody(req)) as Record<string, unknown>
      if (!Array.isArray(b.agentIds) || b.agentIds.length === 0 || b.agentIds.length > 50 || !b.agentIds.every((x) => typeof x === 'string')) throw new HttpError(400, 'Choose at least one field agent')
      if (!isStr(b.site, 120)) throw new HttpError(400, 'Missing ghat')
      const brief = b.brief as { risk?: { site?: unknown }; actions?: unknown } | undefined
      if (!brief || typeof brief !== 'object' || brief.risk?.site !== b.site || !Array.isArray(brief.actions) || brief.actions.length === 0) throw new HttpError(400, 'Select at least one recommended action for the brief')
      const created: string[] = []
      for (const agentId of new Set(b.agentIds as string[])) {
        const a = agentRow(agentId)
        if (!a) throw new HttpError(400, 'Unknown field agent')
        if (!(JSON.parse(a.ghats) as string[]).includes(b.site)) throw new HttpError(400, `${a.name} is not linked to ${b.site}`)
      }
      for (const agentId of new Set(b.agentIds as string[])) {
        const id = randomUUID()
        db.prepare('INSERT INTO assignments (id, agent_id, site, brief, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(id, agentId, b.site, JSON.stringify(brief), new Date().toISOString())
        created.push(id)
      }
      return send(res, 201, { created })
    }

    const submissionOf = (assignmentId: string) => {
      const s = db.prepare('SELECT id, report, submitted_at FROM submissions WHERE assignment_id = ?').get(assignmentId) as { id: string; report: string; submitted_at: string } | undefined
      return s ? { id: s.id, report: JSON.parse(s.report), submittedAt: s.submitted_at } : null
    }
    const shapeAssignment = (r: { id: string; agent_id: string; site: string; brief: string; created_at: string; agent_name?: string }) => ({
      id: r.id, agentId: r.agent_id, agentName: r.agent_name, site: r.site, brief: JSON.parse(r.brief), createdAt: r.created_at, submission: submissionOf(r.id),
    })

    if (path === '/api/assignments' && method === 'GET') {
      officerOnly(req)
      const rows = db.prepare('SELECT a.id, a.agent_id, a.site, a.brief, a.created_at, g.name AS agent_name FROM assignments a JOIN agents g ON g.id = a.agent_id ORDER BY a.created_at DESC').all() as Parameters<typeof shapeAssignment>[0][]
      return send(res, 200, rows.map(shapeAssignment))
    }

    if (path === '/api/my/assignments' && method === 'GET') {
      const agentId = agentOnly(req)
      const rows = db.prepare('SELECT id, agent_id, site, brief, created_at FROM assignments WHERE agent_id = ? ORDER BY created_at DESC').all(agentId) as Parameters<typeof shapeAssignment>[0][]
      return send(res, 200, rows.map(shapeAssignment))
    }

    const subMatch = path.match(/^\/api\/my\/assignments\/([\w-]+)\/submission$/)
    if (subMatch && method === 'POST') {
      const agentId = agentOnly(req)
      const a = db.prepare('SELECT id, site FROM assignments WHERE id = ? AND agent_id = ?').get(subMatch[1], agentId) as { id: string; site: string } | undefined
      if (!a) throw new HttpError(404, 'Brief not found')
      if (submissionOf(a.id)) throw new HttpError(409, 'A field report was already submitted for this brief')
      const report = await readBody(req)
      const errors = validateFieldReport(report)
      if (errors.length > 0) throw new HttpError(400, `Please check the form (${errors.join(', ')})`)
      db.prepare('INSERT INTO submissions (id, assignment_id, agent_id, site, report, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), a.id, agentId, a.site, JSON.stringify(report), new Date().toISOString())
      return send(res, 201, submissionOf(a.id))
    }

    throw new HttpError(404, 'Not found')
  }

  /** Express/Vite-style handler: returns false if the URL is not an API path so the caller can continue. */
  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const path = (req.url ?? '').split('?')[0]
    if (!path.startsWith('/api/')) return false
    try {
      await route(req, res, path)
    } catch (e) {
      if (e instanceof HttpError) send(res, e.status, { error: e.message })
      else {
        console.error(e)
        send(res, 500, { error: 'Server error' })
      }
    }
    return true
  }
}
