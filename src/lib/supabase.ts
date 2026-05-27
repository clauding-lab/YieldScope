import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[YieldScope] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. ' +
    'Live data disabled — falling back to fixtures. Copy .env.example to .env.local.',
  )
}

let cached: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  }
  return cached
}

export function isLiveDataAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
