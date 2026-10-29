import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CollegeRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!profile?.college_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-8 max-w-md text-center rounded-2xl">
          <ShieldCheck className="w-16 h-16 text-brand-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">College Access Required</h2>
          <p className="text-gray-400 mb-6">
            This section is restricted to verified KL University students.
            Verify your college email to access college events and SIL tracking.
          </p>
          <Link to="/profile" className="btn-primary">
            Verify College Email
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
