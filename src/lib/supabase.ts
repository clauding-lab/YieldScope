import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Reject the .env.example placeholder values (e.g. <your-anon-key-here>) — they're
// truthy strings but not real credentials, and would otherwise produce live 401s
// instead of the intended fixture fallback.
function isPlaceholder(v: string | undefined): boolean {
  return !v || (v.startsWith('<') && v.endsWith('>'))
}

const HAS_REAL_CREDENTIALS = !isPlaceholder(SUPABASE_URL) && !isPlaceholder(SUPABASE_ANON_KEY)

if (!HAS_REAL_CREDENTIALS) {
  console.warn(
    '[YieldScope] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing or still set to the .env.example placeholder. ' +
    'Live data disabled — falling back to fixtures. Set real credentials in .env.local.',
  )
}

let cached: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!HAS_REAL_CREDENTIALS) return null
  if (!cached) {
    cached = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    })
  }
  return cached
}

export function isLiveDataAvailable(): boolean {
  return HAS_REAL_CREDENTIALS
}
