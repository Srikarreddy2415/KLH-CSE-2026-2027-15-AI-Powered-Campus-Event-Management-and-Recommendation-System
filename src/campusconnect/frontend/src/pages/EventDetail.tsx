import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Clock, Users, Bookmark, CheckCircle, ArrowLeft, Globe, Building2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import { registrationsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id!).single()
      return data
    },
    enabled: !!id,
  })

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.myRegistrations().then(r => r.data),
    enabled: !!user,
  })

  const { data: mySaved } = useQuery({
    queryKey: ['my-saved'],
    queryFn: () => registrationsApi.mySaved().then(r => r.data),
    enabled: !!user,
  })

  const registeredIds = new Set((myRegistrations?.registrations || []).map((r: any) => r.event_id))
  const savedIds = new Set((mySaved?.saved || []).map((r: any) => r.event_id))

  const registerMutation = useMutation({
    mutationFn: () => registrationsApi.register(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      toast.success('Successfully registered!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Registration failed'),
  })

  const saveMutation = useMutation({
    mutationFn: () => savedIds.has(id!) ? registrationsApi.unsave(id!) : registrationsApi.save(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved'] })
      toast.success(savedIds.has(id!) ? 'Removed from saved' : 'Event saved!')
    },
  })

  if (isLoading) return (
    <AppLayout>
      <div className="page-container">
        <div className="glass rounded-2xl h-96 animate-pulse" />
      </div>
    </AppLayout>
  )

  if (!event) return (
    <AppLayout>
      <div className="page-container text-center py-20 text-gray-400">Event not found</div>
    </AppLayout>
  )

  const isRegistered = registeredIds.has(id!)
  const isSaved = savedIds.has(id!)

  return (
    <AppLayout>
      <div className="page-container max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="glass rounded-2xl overflow-hidden mb-6">
          <div className="h-48 bg-gradient-to-br from-brand-900 to-violet-900 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="text-9xl font-display font-black text-white">{event.category?.[0]}</div>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="badge badge-brand">{event.category}</span>
              {event.college_scope && <span className="badge badge-purple">College Only</span>}
            </div>
            <div className="absolute top-4 right-4">
              <span className={clsx('badge capitalize', event.mode === 'online' ? 'badge-green' : event.mode === 'offline' ? 'badge-amber' : 'badge-sky')}>
                {event.mode}
              </span>
            </div>
          </div>

          <div className="p-6">
            <h1 className="font-display text-2xl font-bold text-white mb-4">{event.title}</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{event.start_time?.slice(0,5)} – {event.end_time?.slice(0,5)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="truncate">{event.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Cap: {event.capacity || 'N/A'}</span>
              </div>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              <span className="text-gray-500">Organizer:</span> {event.organizer}
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {(Array.isArray(event.tags) ? event.tags : event.tags.split('|')).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">{tag}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isRegistered ? (
                <div className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Registered
                </div>
              ) : (
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Register for Event</>
                  )}
                </button>
              )}
              <button
                onClick={() => saveMutation.mutate()}
                className={clsx(
                  'p-3 rounded-xl border transition-all duration-200',
                  isSaved ? 'border-brand-500/60 bg-brand-500/20 text-brand-300' : 'border-white/15 bg-white/5 text-gray-400 hover:border-brand-500/40'
                )}
              >
                <Bookmark className={clsx('w-5 h-5', isSaved && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="font-semibold text-white text-lg mb-4">About This Event</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>

          {event.location && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {event.mode === 'online' ? <Globe className="w-4 h-4 text-brand-400" /> : <Building2 className="w-4 h-4 text-brand-400" />}
                <span>{event.location}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
