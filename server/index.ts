import { createServer } from 'node:http'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { createApi } from './api.ts'
import { openDb } from './db.ts'

export const DEFAULT_PASSCODE = 'nirmalghat-demo'
export const DB_PATH = process.env.NIRMALGHAT_DB ?? 'server/data/nirmalghat.db'

export function makeApi() {
  mkdirSync(join(DB_PATH, '..'), { recursive: true })
  return createApi({ db: openDb(DB_PATH), officerPasscode: process.env.OFFICER_PASSCODE ?? DEFAULT_PASSCODE })
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
}

/** Production server: the built app from dist/ plus the API, one process, one port. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const api = makeApi()
  const root = join(process.cwd(), 'dist')
  const port = Number(process.env.PORT ?? 8787)
  createServer(async (req, res) => {
    if (await api(req, res)) return
    const url = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
    let file = join(root, url === '/' ? 'index.html' : url)
    if (!file.startsWith(root) || !existsSync(file)) file = join(root, 'index.html') // single-page app fallback
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  }).listen(port, () => console.log(`NirmalGhat running at http://localhost:${port}`))
}
