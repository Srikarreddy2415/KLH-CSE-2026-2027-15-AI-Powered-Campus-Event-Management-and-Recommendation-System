import { useQuery } from '@tanstack/react-query'
import { Sparkles, Brain, History, Zap, Info } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import EventCard from '../components/EventCard'
import { recommendationsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { usePreferencesStore } from '../store/authStore'

export default function Recommendations() {
  const { user } = useAuthStore()
  const { interests } = usePreferencesStore()

  const { data, isLoading } = useQuery({
    queryKey: ['recommendations-full'],
    queryFn: () => recommendationsApi.getPersonalized(user!.id, 15).then(r => r.data),
    enabled: !!user,
  })

  const recs = data?.recommendations || []
  const isPersonalized = recs.some((r: any) => r.recommendation_type === 'personalized')

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-white">AI Recommendations</h1>
            </div>
            <p className="text-gray-400">
              {isPersonalized
                ? 'Based on your participation history and preferences'
                : 'Based on your survey preferences (interaction history grows with usage)'}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="glass p-5 rounded-2xl mb-8 border border-brand-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold text-white">How Your Recommendations Are Generated</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Your Interests</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {interests.length > 0 ? interests.slice(0, 3).join(', ') + (interests.length > 3 ? '...' : '') : 'Complete survey to set interests'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Participation History</p>
                <p className="text-xs text-gray-400 mt-0.5">Events you viewed, saved, registered for, attended</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Semantic Similarity</p>
                <p className="text-xs text-gray-400 mt-0.5">AI matches event content to your profile using embeddings</p>
              </div>
            </div>
          </div>

          {!isPersonalized && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-brand-600/10 border border-brand-500/20">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-300">
                <strong>Cold-start mode:</strong> Currently using survey preferences only.
                Recommendations improve as you interact with more events (register, attend, rate).
                After 5+ interactions, the system switches to personalized history-based recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Recommendations grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="glass rounded-2xl h-72 animate-pulse" />)}
          </div>
        ) : recs.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">{recs.length} events recommended for you</p>
              <span className={`badge ${isPersonalized ? 'badge-green' : 'badge-brand'}`}>
                {isPersonalized ? 'Personalized' : 'Survey-based'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recs.map((event: any, i: number) => (
                <div key={event.id} className="relative">
                  {i < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                      #{i + 1}
                    </div>
                  )}
                  <EventCard event={event} showRecommendation />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="glass p-16 rounded-2xl text-center">
            <Sparkles className="w-16 h-16 text-brand-400 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold text-white mb-2">No recommendations yet</h3>
            <p className="text-gray-400 mb-6">
              Complete the preference survey or make sure the backend is running.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
