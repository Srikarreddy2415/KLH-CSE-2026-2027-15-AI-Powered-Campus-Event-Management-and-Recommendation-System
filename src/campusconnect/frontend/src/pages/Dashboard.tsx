import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Sparkles, Calendar, Trophy, TrendingUp, GraduationCap, ChevronRight, Zap } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import EventCard from '../components/EventCard'
import { useAuthStore } from '../store/authStore'
import { recommendationsApi, silApi, registrationsApi } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { profile, user } = useAuthStore()

  const { data: recs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.getPersonalized(user!.id, 6).then(r => r.data),
    enabled: !!user,
  })

  const { data: upcomingEvents } = useQuery<any[]>({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('is_active', true).eq('college_scope', false).order('date').limit(4)
      return (data || []) as any[]
    },
  })

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.myRegistrations().then((r: any) => r.data),
    enabled: !!user,
  })

  const { data: silProgress } = useQuery({
    queryKey: ['sil-progress'],
    queryFn: () => silApi.getProgress().then(r => r.data),
    enabled: !!user && !!profile?.college_verified,
  })

  const registeredIds = new Set((myRegistrations?.registrations || []).map((r: any) => r.event_id))

  return (
    <AppLayout>
      <div className="page-container">
        {/* Welcome header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Welcome back, {profile?.name?.split(' ')[0] || 'Explorer'} 👋
          </h1>
          <p className="text-gray-400">
            {profile?.college_verified ? `${profile.college_id || 'College'} Verified Student` : 'General User'} •
            Discover events personalized for you
          </p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-gray-400">Recommendations</span>
            </div>
            <div className="text-2xl font-bold text-white">{recs?.count || 0}</div>
          </div>
          <div className="glass p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-gray-400">Registered</span>
            </div>
            <div className="text-2xl font-bold text-white">{myRegistrations?.registrations?.length || 0}</div>
          </div>
          {profile?.college_verified && silProgress && (
            <>
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-400">SIL Progress</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {silProgress.attended}/{silProgress.required}
                </div>
              </div>
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-400">SIL %</span>
                </div>
                <div className="text-2xl font-bold text-white">{silProgress.percentage}%</div>
              </div>
            </>
          )}
          {!profile?.college_verified && (
            <div className="col-span-2 glass p-4 rounded-2xl border border-brand-500/20">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-brand-400" />
                <div>
                  <p className="text-sm font-medium text-white">Unlock College Events</p>
                  <p className="text-xs text-gray-400">Verify your college email to access SIL tracking</p>
                </div>
                <Link to="/profile" className="ml-auto btn-primary text-xs px-3 py-1.5">Verify</Link>
              </div>
            </div>
          )}
        </div>

        {/* SIL progress bar */}
        {profile?.college_verified && silProgress && (
          <div className="glass p-5 rounded-2xl mb-8 border border-amber-500/20 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-white">SIL Progress</h2>
              </div>
              <Link to="/sil" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Details <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 mb-2">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                style={{ width: `${silProgress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{silProgress.attended} events attended</span>
              <span>{silProgress.remaining} remaining to complete</span>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-400" />
              </div>
              <h2 className="section-title">Recommended For You</h2>
            </div>
            <Link to="/recommendations" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recs?.recommendations?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recs.recommendations.slice(0, 6).map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showRecommendation
                  isRegistered={registeredIds.has(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass p-10 rounded-2xl text-center">
              <Zap className="w-12 h-12 text-brand-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400">Building your recommendations...</p>
              <p className="text-gray-500 text-sm mt-1">Make sure the backend is running</p>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <h2 className="section-title">Upcoming Events</h2>
            </div>
            <Link to="/events" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Browse all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(upcomingEvents || []).map((event: any) => (
              <EventCard key={event.id} event={event} isRegistered={registeredIds.has(event.id)} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
