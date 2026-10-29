import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import CollegeEvents from './pages/CollegeEvents'
import EventDetail from './pages/EventDetail'
import Recommendations from './pages/Recommendations'
import MyEvents from './pages/MyEvents'
import SILDashboard from './pages/SILDashboard'
import Profile from './pages/Profile'
import OrganizerDashboard from './pages/OrganizerDashboard'
import AdminPanel from './pages/AdminPanel'
import DatasetDemo from './pages/DatasetDemo'

// Layout
import ProtectedRoute from './components/ProtectedRoute'
import CollegeRoute from './components/CollegeRoute'

export default function App() {
  const { setUser, setSession, setProfile, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from Supabase session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dataset" element={<DatasetDemo />} />

        {/* Protected — any logged-in user */}
        <Route path="/survey" element={<ProtectedRoute><Survey /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

        {/* College-verified only */}
        <Route path="/events/college" element={<CollegeRoute><CollegeEvents /></CollegeRoute>} />
        <Route path="/sil" element={<CollegeRoute><SILDashboard /></CollegeRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
