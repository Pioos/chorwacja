import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const SUPABASE_CONFIGURED =
  !!supabaseUrl &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseUrl.startsWith('https://')

// Lazy singleton – only created when Supabase is properly configured
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_CONFIGURED) {
      throw new Error('Supabase nie jest skonfigurowane. Uzupełnij .env.local')
    }
    _client = createClient(supabaseUrl!, supabaseAnonKey!)
  }
  return _client
}

// Convenience export – use only when SUPABASE_CONFIGURED is true
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  },
})

export interface Photo {
  id: string
  url: string
  author_name: string
  lat: number | null
  lng: number | null
  taken_at: string | null
  created_at: string
  matched_distance_m: number | null
}
