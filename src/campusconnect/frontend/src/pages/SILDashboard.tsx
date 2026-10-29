import { useQuery } from '@tanstack/react-query'
import { Trophy, TrendingUp, CheckCircle, Clock, Calendar, Star } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { silApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format } from 'date-fns'

export default function SILDashboard() {
  const { user } = useAuthStore()

  const { data: progress } = useQuery({
    queryKey: ['sil-progress'],
    queryFn: () => silApi.getProgress().then(r => r.data),
    enabled: !!user,
  })

  const { data: history } = useQuery({
    queryKey: ['sil-history'],
    queryFn: () => silApi.getHistory().then(r => r.data),
    enabled: !!user,
  })

  const attended = progress?.attended || 0
  const required = progress?.required || 25
  const remaining = progress?.remaining || 25
  const percentage = progress?.percentage || 0
  const completed = progress?.completed || false

  return (
    <AppLayout>
      <div className="page-container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">SIL Dashboard</h1>
            <p className="text-gray-400 text-sm">Student Innovation & Leadership — Event Participation Tracker</p>
          </div>
        </div>

        {/* Main progress card */}
        <div className={clsx(
          'glass p-8 rounded-2xl mb-6 border',
          completed ? 'border-emerald-500/40' : 'border-amber-500/20'
        )}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-display text-6xl font-black text-white mb-1">
                {attended}
                <span className="text-3xl text-gray-500">/{required}</span>
              </div>
              <p className="text-gray-400">Events attended this semester</p>
            </div>
            <div className={clsx(
              'w-24 h-24 rounded-full flex items-center justify-center border-4',
              completed
                ? 'border-emerald-500 bg-emerald-500/10'
                : percentage > 60
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-brand-500 bg-brand-500/10'
            )}>
              <div className="text-center">
                <div className={clsx('text-2xl font-bold', completed ? 'text-emerald-400' : 'text-white')}>{percentage}%</div>
                <div className="text-xs text-gray-400">done</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className={clsx(
                'h-4 rounded-full transition-all duration-1000 relative',
                completed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              )}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-slow" />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{remaining} more events to complete the requirement</span>
            {completed && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4" /> Requirement completed!
              </span>
            )}
          </div>

          {/* Semester info */}
          {progress?.semester && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{progress.semester.name}</p>
                <p className="text-xs text-gray-400">
                  {progress.semester.start_date} to {progress.semester.end_date}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-white mb-1">{attended}</div>
            <div className="text-xs text-gray-400">Attended</div>
          </div>
          <div className="glass p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-amber-400 mb-1">{remaining}</div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
          <div className="glass p-4 rounded-2xl text-center">
            <div className="text-2xl font-bold text-brand-400 mb-1">{required}</div>
            <div className="text-xs text-gray-400">Required</div>
          </div>
        </div>

        {/* Attendance history */}
        <div className="glass p-6 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white text-lg">SIL Credited Events</h2>
            <span className="badge badge-green">{history?.total_credited || 0} events</span>
          </div>

          {history?.history?.length > 0 ? (
            <div className="space-y-3">
              {history.history.map((record: any, i: number) => {
                const event = record.events || {}
                return (
                  <div key={record.id || i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title || 'Event'}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span>{event.category}</span>
                        <span>•</span>
                        <span>{event.date && format(new Date(event.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-medium">+1 SIL</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No SIL credits yet. Start attending events!</p>
              <Link to="/events" className="btn-primary text-sm mt-4 inline-block">Browse Events</Link>
            </div>
          )}
        </div>

        {/* How SIL works */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h2 className="font-semibold text-white text-lg mb-4">How SIL Credits Work</h2>
          <div className="space-y-3">
            {[
              { icon: Calendar, text: 'Register for an event', color: 'text-brand-400' },
              { icon: CheckCircle, text: 'Arrive and scan the Entry QR code', color: 'text-sky-400' },
              { icon: Clock, text: 'Participate in the event', color: 'text-amber-400' },
              { icon: TrendingUp, text: 'Scan Exit QR → Attendance verified → SIL +1', color: 'text-emerald-400' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">{i + 1}</div>
                <step.icon className={clsx('w-4 h-4 flex-shrink-0', step.color)} />
                <p className="text-sm text-gray-300">{step.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 p-3 rounded-lg bg-white/5">
            Note: SIL credit is only awarded after both Entry AND Exit QR are scanned.
            Simply registering or attending without scanning does NOT count.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
