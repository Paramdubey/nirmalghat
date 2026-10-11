// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { FIELD_PARAMETERS, validateFieldReport, type FieldReport } from '../src/constants/fieldForm'
import { createApi } from '../server/api.ts'
import { openDb } from '../server/db.ts'

let server: Server
let base = ''
const db = openDb(':memory:')

beforeAll(async () => {
  const api = createApi({ db, officerPasscode: 'test-pass' })
  server = createServer((req, res) => void api(req, res).then((done) => { if (!done) { res.writeHead(404); res.end() } }))
  await new Promise<void>((r) => server.listen(0, r))
  base = `http://localhost:${(server.address() as AddressInfo).port}`
})
afterAll(() => void server.close())

async function call(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, body: (await res.json()) as Record<string, any> } // eslint-disable-line
}

const login = async (body: object) => (await call('POST', '/api/login', undefined, body)).body.token as string
const brief = (site: string) => ({ risk: { site }, actions: [{ id: `${site}|resample`, kind: 'resample', vars: { site } }] })
const goodReport = (): FieldReport => ({
  sampledOn: '2026-10-18', stage: 'pre', notes: '',
  readings: FIELD_PARAMETERS.map((p) => (p.core ? { parameter: p.name, status: 'valid' as const, value: 4.2 } : { parameter: p.name, status: 'not measured' as const })),
})

describe('login and permissions', () => {
  test('officer passcode: wrong rejected, right accepted', async () => {
    expect((await call('POST', '/api/login', undefined, { role: 'officer', passcode: 'nope' })).status).toBe(401)
    expect(await login({ role: 'officer', passcode: 'test-pass' })).toBeTruthy()
  })
  test('endpoints need a session; agents cannot use officer endpoints', async () => {
    expect((await call('GET', '/api/agents')).status).toBe(401)
    const officer = await login({ role: 'officer', passcode: 'test-pass' })
    await call('POST', '/api/agents', officer, { name: 'Perm Squad', pin: '1234', ghats: ['Khatlapura ghat'] })
    const agent = await login({ role: 'agent', name: 'perm squad', pin: '1234' })
    expect((await call('GET', '/api/agents', agent)).status).toBe(403)
    expect((await call('GET', '/api/my/assignments', officer)).status).toBe(403)
  })
})

describe('field agents', () => {
  test('validation: name, 4-digit PIN, at least one ghat, unique name', async () => {
    const officer = await login({ role: 'officer', passcode: 'test-pass' })
    const post = (b: object) => call('POST', '/api/agents', officer, b)
    expect((await post({ name: '', pin: '1234', ghats: ['A'] })).status).toBe(400)
    expect((await post({ name: 'X', pin: '12', ghats: ['A'] })).status).toBe(400)
    expect((await post({ name: 'X', pin: '12ab', ghats: ['A'] })).status).toBe(400)
    expect((await post({ name: 'X', pin: '1234', ghats: [] })).status).toBe(400)
    expect((await post({ name: 'Unique One', pin: '1234', ghats: ['A'] })).status).toBe(201)
    expect((await post({ name: 'unique one', pin: '5678', ghats: ['A'] })).status).toBe(409)
  })
  test('PINs are stored hashed and never returned', async () => {
    const officer = await login({ role: 'officer', passcode: 'test-pass' })
    const created = await call('POST', '/api/agents', officer, { name: 'Hash Check', pin: '9137', ghats: ['A'] })
    expect(JSON.stringify(created.body)).not.toContain('9137')
    const row = db.prepare("SELECT pin_hash, pin_salt FROM agents WHERE name_key = 'hash check'").get() as { pin_hash: string }
    expect(row.pin_hash).not.toContain('9137')
    expect(JSON.stringify((await call('GET', '/api/agents', officer)).body)).not.toMatch(/pin/i)
  })
  test('wrong PIN is rejected and repeated failures lock out', async () => {
    const officer = await login({ role: 'officer', passcode: 'test-pass' })
    await call('POST', '/api/agents', officer, { name: 'Lock Test', pin: '1111', ghats: ['A'] })
    for (let i = 0; i < 5; i++) expect((await call('POST', '/api/login', undefined, { role: 'agent', name: 'Lock Test', pin: '0000' })).status).toBe(401)
    expect((await call('POST', '/api/login', undefined, { role: 'agent', name: 'Lock Test', pin: '1111' })).status).toBe(429)
  })
})

describe('assignments and field reports', () => {
  test('full flow: assign to several agents, agent sees only theirs, submits once, officer sees it', async () => {
    const officer = await login({ role: 'officer', passcode: 'test-pass' })
    const a1 = (await call('POST', '/api/agents', officer, { name: 'Flow One', pin: '2222', ghats: ['Khatlapura ghat', 'Prempura ghat'] })).body.id as string
    const a2 = (await call('POST', '/api/agents', officer, { name: 'Flow Two', pin: '3333', ghats: ['Khatlapura ghat'] })).body.id as string
    const a3 = (await call('POST', '/api/agents', officer, { name: 'Flow Three', pin: '4444', ghats: ['Prempura ghat'] })).body.id as string

    expect((await call('POST', '/api/assignments', officer, { agentIds: [a3], site: 'Khatlapura ghat', brief: brief('Khatlapura ghat') })).status).toBe(400) // not linked
    expect((await call('POST', '/api/assignments', officer, { agentIds: [a1], site: 'Khatlapura ghat', brief: { risk: { site: 'Khatlapura ghat' }, actions: [] } })).status).toBe(400) // no actions
    const made = await call('POST', '/api/assignments', officer, { agentIds: [a1, a2], site: 'Khatlapura ghat', brief: brief('Khatlapura ghat') })
    expect(made.status).toBe(201)
    expect(made.body.created).toHaveLength(2)

    const t1 = await login({ role: 'agent', name: 'Flow One', pin: '2222' })
    const t2 = await login({ role: 'agent', name: 'Flow Two', pin: '3333' })
    const mine1 = (await call('GET', '/api/my/assignments', t1)).body as unknown as { id: string; site: string; submission: unknown }[]
    const mine2 = (await call('GET', '/api/my/assignments', t2)).body as unknown as { id: string }[]
    expect(mine1).toHaveLength(1)
    expect(mine1[0].site).toBe('Khatlapura ghat')
    expect(mine1[0].submission).toBeNull()
    expect(mine2[0].id).not.toBe(mine1[0].id)
    expect((await call('GET', '/api/my/assignments', await login({ role: 'agent', name: 'Flow Three', pin: '4444' }))).body).toHaveLength(0)

    // another agent cannot submit for this brief
    expect((await call('POST', `/api/my/assignments/${mine1[0].id}/submission`, t2, goodReport())).status).toBe(404)
    // invalid forms are rejected
    const bad = goodReport()
    bad.readings[1] = { parameter: 'Dissolved oxygen', status: 'not measured' }
    expect((await call('POST', `/api/my/assignments/${mine1[0].id}/submission`, t1, bad)).status).toBe(400)
    // valid submit, then no second submit
    expect((await call('POST', `/api/my/assignments/${mine1[0].id}/submission`, t1, goodReport())).status).toBe(201)
    expect((await call('POST', `/api/my/assignments/${mine1[0].id}/submission`, t1, goodReport())).status).toBe(409)

    const all = (await call('GET', '/api/assignments', officer)).body as unknown as { agentName: string; submission: { report: FieldReport } | null }[]
    const done = all.find((x) => x.agentName === 'Flow One')!
    expect(done.submission?.report.readings.find((r) => r.parameter === 'Dissolved oxygen')).toMatchObject({ status: 'valid', value: 4.2 })
    expect(all.find((x) => x.agentName === 'Flow Two')!.submission).toBeNull()
    // agents with briefs cannot be removed
    expect((await call('DELETE', `/api/agents/${a1}`, officer)).status).toBe(409)
    expect((await call('DELETE', `/api/agents/${a3}`, officer)).status).toBe(200)
  })
})

describe('field report validation (shared with the form)', () => {
  test('accepts a complete report', () => expect(validateFieldReport(goodReport())).toEqual([]))
  test('BDL / ND / not measured never carry a number', () => {
    const r = goodReport()
    r.readings[3] = { parameter: 'COD', status: 'BDL', value: 0 }
    expect(validateFieldReport(r)).toContain('value:COD')
  })
  test('core parameters need an answer; values are range-checked; date and stage required', () => {
    const r = goodReport()
    r.readings[0] = { parameter: 'pH', status: 'valid', value: 19 }
    r.readings[2] = { parameter: 'BOD', status: 'not measured' }
    r.sampledOn = 'tomorrow'
    expect(validateFieldReport(r)).toEqual(expect.arrayContaining(['value:pH', 'core:BOD', 'date']))
    expect(validateFieldReport({ ...goodReport(), stage: 'later' })).toContain('stage')
  })
})
