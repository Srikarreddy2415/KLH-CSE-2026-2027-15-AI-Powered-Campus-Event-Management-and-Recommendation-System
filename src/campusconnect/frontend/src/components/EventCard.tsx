import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Bookmark, Eye, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string
    category: string
    date: string
    city: string
    mode: string
    organizer: string
    capacity?: number
    college_scope?: boolean
    poster_url?: string
    score?: number
    recommendation_reason?: string
    recommendation_type?: string
  }
  onSave?: (id: string) => void
  isSaved?: boolean
  isRegistered?: boolean
  showRecommendation?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'Artificial Intelligence': 'badge-brand',
  'Machine Learning': 'badge-brand',
  'Data Science': 'badge-sky',
  'Python': 'badge-green',
  'Web Development': 'badge-sky',
  'App Development': 'badge-sky',
  'Cybersecurity': 'badge-red',
  'Cloud Computing': 'badge-sky',
  'Programming': 'badge-green',
  'Hackathon': 'badge-amber',
  'Coding Competition': 'badge-amber',
  'Entrepreneurship': 'badge-purple',
  'Startup': 'badge-purple',
  'Career': 'badge-green',
  'Placement': 'badge-green',
  'Robotics': 'badge-amber',
  'IoT': 'badge-amber',
  'Cultural': 'badge-purple',
  'Sports': 'badge-green',
  'Gaming': 'badge-purple',
  'Photography': 'badge-amber',
  'Networking': 'badge-sky',
  'Workshop': 'badge-brand',
  'Seminar': 'badge-sky',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Artificial Intelligence': 'from-violet-900/60 to-brand-900/60',
  'Machine Learning': 'from-blue-900/60 to-brand-900/60',
  'Hackathon': 'from-amber-900/60 to-orange-900/60',
  'Cybersecurity': 'from-red-900/60 to-pink-900/60',
  'Cultural': 'from-purple-900/60 to-pink-900/60',
  'Sports': 'from-emerald-900/60 to-green-900/60',
  default: 'from-slate-900/60 to-brand-900/60',
}

const MODE_BADGE: Record<string, string> = {
  online: 'badge-green',
  offline: 'badge-amber',
  hybrid: 'badge-sky',
}

export default function EventCard({
  event, onSave, isSaved, isRegistered, showRecommendation
}: EventCardProps) {
  const gradient = CATEGORY_GRADIENTS[event.category] || CATEGORY_GRADIENTS.default
  const catBadge = CATEGORY_COLORS[event.category] || 'badge-brand'

  const formattedDate = (() => {
    try { return format(new Date(event.date), 'MMM d, yyyy') }
    catch { return event.date }
  })()

  return (
    <div className="glass-hover rounded-2xl overflow-hidden group animate-fade-in">
      {/* Banner */}
      <div className={clsx('h-32 bg-gradient-to-br relative', gradient)}>
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="text-6xl font-display font-black text-white">{event.category?.[0]}</div>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className={clsx('badge text-xs', catBadge)}>{event.category}</span>
          {event.college_scope && (
            <span className="badge badge-purple text-xs">College Only</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={clsx('badge text-xs capitalize', MODE_BADGE[event.mode] || 'badge-brand')}>
            {event.mode}
          </span>
        </div>

        {/* Recommendation tag */}
        {showRecommendation && event.recommendation_type && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5 bg-brand-600/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-200 flex-shrink-0" />
              <p className="text-xs text-brand-100 truncate">{event.recommendation_reason || 'Recommended for you'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base leading-tight mb-1 line-clamp-2 group-hover:text-brand-300 transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{event.description}</p>

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="truncate">{event.city}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="truncate">{event.organizer}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 btn-primary text-center text-sm py-2 flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Link>
          <button
            onClick={() => onSave?.(event.id)}
            className={clsx(
              'p-2 rounded-xl border transition-all duration-200',
              isSaved
                ? 'border-brand-500/60 bg-brand-500/20 text-brand-300'
                : 'border-white/15 bg-white/5 text-gray-400 hover:border-brand-500/40 hover:text-brand-300'
            )}
            title={isSaved ? 'Unsave' : 'Save event'}
          >
            <Bookmark className={clsx('w-4 h-4', isSaved && 'fill-current')} />
          </button>
        </div>

        {isRegistered && (
          <div className="mt-2 text-center">
            <span className="badge badge-green text-xs w-full justify-center">Registered</span>
          </div>
        )}
      </div>
    </div>
  )
}
