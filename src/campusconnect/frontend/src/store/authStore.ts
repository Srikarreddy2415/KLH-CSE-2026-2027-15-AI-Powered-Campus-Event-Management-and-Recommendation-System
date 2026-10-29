import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'organizer' | 'admin'
  college_id?: string
  college_verified: boolean
  college_email?: string
  location?: string
  onboarding_completed: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single()
    set({ profile: data as UserProfile | null })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },
}))

// ─── Preferences Store ────────────────────────────────────────────────────────
interface PreferencesState {
  interests: string[]
  preferredMode: 'online' | 'offline' | 'both'
  preferredLocation: string
  surveyCompleted: boolean
  setPreferences: (prefs: Partial<PreferencesState>) => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  interests: [],
  preferredMode: 'both',
  preferredLocation: '',
  surveyCompleted: false,
  setPreferences: (prefs) => set(prefs),
}))
