import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const env = import.meta.env
const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
// Supabase calls this the "anon" key (older projects) or the "publishable" key (newer projects). Both are public.
const anonKey = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** False until .env has the project URL and the public anon key. The app then shows setup steps instead of failing quietly. */
export const supabaseConfigured = Boolean(url && anonKey)

/**
 * The browser talks to Supabase directly with the public anon key. Row Level Security
 * (supabase/migrations) is what protects the data. The service_role key must never be used here.
 */
export const supabase: SupabaseClient = createClient(url ?? 'http://localhost:54321', anonKey ?? 'not-configured')

/** A throw-away client that never stores a session, used so an officer creating an agent account stays signed in as the officer. */
export function signupClient(): SupabaseClient {
  return createClient(url ?? 'http://localhost:54321', anonKey ?? 'not-configured', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'nirmalghat-signup' },
  })
}

/**
 * Agents sign in with a name and PIN, but Supabase Auth wants an email. We derive a stable,
 * non-deliverable address from the name (no email is ever sent: "Confirm email" must be off).
 */
export async function agentEmail(name: string): Promise<string> {
  const key = name.trim().toLowerCase()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `agent-${hex.slice(0, 24)}@agents.example.com`
}

export const agentNameKey = (name: string) => name.trim().toLowerCase()

/** Agent PINs are 6 digits because Supabase Auth requires passwords of at least 6 characters. */
export const PIN_PATTERN = /^\d{6}$/
