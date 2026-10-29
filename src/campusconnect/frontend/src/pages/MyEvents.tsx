import { useQuery } from '@tanstack/react-query'
import { BookmarkCheck, Calendar, Clock } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import EventCard from '../components/EventCard'
import { registrationsApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function MyEvents() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'registered' | 'saved' | 'history'>('registered')

  const { data: regData } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.myRegistrations().then(r => r.data),
    enabled: !!user,
  })

  const { data: savedData } = useQuery({
    queryKey: ['my-saved'],
    queryFn: () => registrationsApi.mySaved().then(r => r.data),
    enabled: !!user,
  })

  const { data: historyData } = useQuery({
    queryKey: ['participation-history'],
    queryFn: () => registrationsApi.participationHistory().then(r => r.data),
    enabled: !!user,
  })

  const tabs = [
    { key: 'registered', label: 'Registered', count: regData?.registrations?.length || 0, icon: Calendar },
    { key: 'saved', label: 'Saved', count: savedData?.saved?.length || 0, icon: BookmarkCheck },
    { key: 'history', label: 'History', count: historyData?.history?.length || 0, icon: Clock },
  ]

  const events = tab === 'registered'
    ? (regData?.registrations || []).map((r: any) => r.events).filter(Boolean)
    : tab === 'saved'
    ? (savedData?.saved || []).map((r: any) => r.events).filter(Boolean)
    : (historyData?.history || []).map((r: any) => r.events).filter(Boolean)

  return (
    <AppLayout>
      <div className="page-container">
        <h1 className="font-display text-3xl font-bold text-white mb-6">My Events</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
                tab === t.key
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={clsx(
                'px-1.5 py-0.5 rounded-full text-xs',
                tab === t.key ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-400'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="glass p-16 rounded-2xl text-center text-gray-400">
            <BookmarkCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {tab} events yet</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
