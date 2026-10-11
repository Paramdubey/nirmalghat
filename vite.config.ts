/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { makeApi } from './server/index.ts'

/** Runs the API inside the dev server, so `npm run dev` is the only command needed. */
function api(): Plugin {
  return {
    name: 'nirmalghat-api',
    configureServer(server) {
      const handle = makeApi()
      server.middlewares.use((req, res, next) => {
        handle(req, res).then((done) => done || next(), next)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), api()],
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] },
})
