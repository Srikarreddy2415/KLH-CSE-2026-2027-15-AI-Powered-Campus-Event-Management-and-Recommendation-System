import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// In dev, show a helpful warning if credentials aren't set yet
if (import.meta.env.DEV && (!supabaseUrl || supabaseUrl.includes('PASTE_YOUR'))) {
  console.warn(
    '[CampusConnect] Supabase credentials not configured.\n' +
    'Edit frontend/.env and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Get these from: https://supabase.com → Your Project → Settings → API'
  )
}

// Use a placeholder URL so Supabase client doesn't throw at import time
const resolvedUrl = (supabaseUrl && !supabaseUrl.includes('PASTE')) ? supabaseUrl : 'https://placeholder.supabase.co'
const resolvedKey = (supabaseAnonKey && !supabaseAnonKey.includes('PASTE')) ? supabaseAnonKey : 'placeholder-key'

export const supabase = createClient(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const isSupabaseConfigured = !supabaseUrl.includes('PASTE') && !!supabaseUrl && !!supabaseAnonKey
