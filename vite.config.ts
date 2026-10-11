/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// NEXT_PUBLIC_ is also exposed so Vercel's Supabase integration (which uses those names) works without renaming.
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] },
})
