import { useQuery } from '@tanstack/react-query'
import AppLayout from '../components/AppLayout'
import EventCard from '../components/EventCard'
import { useAuthStore } from '../store/authStore'
import { api, registrationsApi } from '../lib/api'
import { GraduationCap } from 'lucide-react'

export default function CollegeEvents() {
  const { profile, user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['college-events'],
    queryFn: () => api.get('/api/events/college').then(r => r.data),
    enabled: !!profile?.college_verified,
  })

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.myRegistrations().then(r => r.data),
    enabled: !!user,
  })

  const registeredIds = new Set((myRegistrations?.registrations || []).map((r: any) => r.event_id))

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">College Events</h1>
            <p className="text-gray-400 text-sm">Exclusive events for verified college students</p>
          </div>
          <div className="ml-auto">
            <span className="badge badge-green">{profile?.college_id || 'College'} Verified</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-72 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.events || []).map((event: any) => (
              <EventCard key={event.id} event={event} isRegistered={registeredIds.has(event.id)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
