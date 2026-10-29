import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import EventCard from '../components/EventCard'
import { supabase } from '../lib/supabase'
import { registrationsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const CATEGORIES = [
  'All', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Python',
  'Web Development', 'App Development', 'Cybersecurity', 'Cloud Computing',
  'Hackathon', 'Coding Competition', 'Entrepreneurship', 'Cultural', 'Sports', 'Gaming',
]

const MODES = ['All', 'online', 'offline', 'hybrid']

export default function Events() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [mode, setMode] = useState('All')

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', category, mode],
    queryFn: async () => {
      let query = supabase.from('events').select('*').eq('is_active', true).eq('college_scope', false)
      if (category !== 'All') query = query.eq('category', category)
      if (mode !== 'All') query = query.eq('mode', mode)
      const { data } = await query.order('date').limit(50)
      return (data || []) as any[]
    },
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

  const filteredEvents = (eventsData || []).filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (eventId: string) => {
    if (!user) { toast.error('Please sign in'); return }
    try {
      if (savedIds.has(eventId)) {
        await registrationsApi.unsave(eventId)
        toast.success('Removed from saved')
      } else {
        await registrationsApi.save(eventId)
        toast.success('Event saved!')
      }
    } catch { toast.error('Action failed') }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">General Events</h1>
          <p className="text-gray-400">Hackathons, workshops, conferences and more — open to everyone</p>
        </div>

        {/* Search + Filters */}
        <div className="glass p-4 rounded-2xl mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events..."
                className="input-field pl-10"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="input-field w-auto min-w-32 capitalize"
            >
              {MODES.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modes' : m}</option>)}
            </select>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap mt-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                  category === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm">{filteredEvents.length} events found</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event: any) => (
              <EventCard
                key={event.id}
                event={event}
                onSave={handleSave}
                isSaved={savedIds.has(event.id)}
                isRegistered={registeredIds.has(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass p-16 rounded-2xl text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No events found for your filters</p>
            <button onClick={() => { setCategory('All'); setMode('All'); setSearch('') }} className="btn-secondary mt-4 text-sm">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
