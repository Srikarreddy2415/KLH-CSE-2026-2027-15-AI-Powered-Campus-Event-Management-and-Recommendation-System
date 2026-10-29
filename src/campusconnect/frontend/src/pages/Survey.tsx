import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MapPin, ChevronRight, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '../lib/api'
import { useAuthStore, usePreferencesStore } from '../store/authStore'
import toast from 'react-hot-toast'

const INTERESTS = [
  'Artificial Intelligence', 'Machine Learning', 'Python', 'Web Development',
  'App Development', 'Data Science', 'Cybersecurity', 'Cloud Computing',
  'Programming', 'Hackathons', 'Coding Competitions', 'Entrepreneurship',
  'Startups', 'Career', 'Placement', 'Robotics', 'IoT', 'Cultural',
  'Sports', 'Music', 'Gaming', 'Photography', 'Networking', 'Workshops', 'Seminars',
]

const MODES = [
  { value: 'online', label: 'Online', desc: 'Virtual events I can attend from anywhere' },
  { value: 'offline', label: 'Offline', desc: 'In-person events with networking opportunities' },
  { value: 'both', label: 'Both', desc: 'I\'m open to all formats' },
]

export default function Survey() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { setPreferences } = usePreferencesStore()
  const [step, setStep] = useState(1)
  const [interests, setInterests] = useState<string[]>([])
  const [mode, setMode] = useState('both')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleSubmit = async () => {
    if (interests.length === 0) {
      toast.error('Please select at least one interest')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/survey', {
        interests,
        preferred_mode: mode,
        preferred_location: location,
      })
      setPreferences({ interests, preferredMode: mode as any, preferredLocation: location, surveyCompleted: true })
      toast.success('Preferences saved! Loading your recommendations...')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Let's personalize your events
          </h1>
          <p className="text-gray-400">
            Welcome{profile?.name ? `, ${profile.name}` : ''}! Tell us what you're interested in.
          </p>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={clsx(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-brand-500' : s < step ? 'w-8 bg-brand-700' : 'w-2 bg-white/20'
              )} />
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
          {/* Step 1 — Interests */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-white mb-2">What events are you interested in?</h2>
              <p className="text-gray-400 text-sm mb-6">Select all that apply — choose at least 1</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {INTERESTS.map(interest => {
                  const selected = interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        selected
                          ? 'bg-brand-600 text-white border border-brand-400 shadow-lg shadow-brand-900/40'
                          : 'bg-white/5 text-gray-300 border border-white/15 hover:border-brand-500/40 hover:bg-white/10'
                      )}
                    >
                      {selected && <CheckCircle className="w-3 h-3 inline mr-1.5" />}
                      {interest}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{interests.length} selected</p>
                <button
                  onClick={() => interests.length > 0 && setStep(2)}
                  disabled={interests.length === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Mode */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-white mb-2">Preferred event mode?</h2>
              <p className="text-gray-400 text-sm mb-6">How do you prefer to attend events?</p>

              <div className="space-y-3 mb-8">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                      mode === m.value
                        ? 'border-brand-500 bg-brand-600/20'
                        : 'border-white/15 bg-white/5 hover:border-white/30'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      mode === m.value ? 'border-brand-400' : 'border-gray-600'
                    )}>
                      {mode === m.value && <div className="w-2.5 h-2.5 rounded-full bg-brand-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{m.label}</p>
                      <p className="text-sm text-gray-400">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Location */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-xl font-semibold text-white mb-2">Preferred location?</h2>
              <p className="text-gray-400 text-sm mb-6">
                We'll prioritize events in your city. You can skip this.
              </p>

              <div className="relative mb-8">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g., Hyderabad, Vijayawada..."
                  className="input-field pl-10"
                />
              </div>

              {/* Summary */}
              <div className="glass p-4 rounded-xl mb-6 border border-brand-500/20">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Your preferences summary:</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div><span className="text-white font-medium">Interests:</span> {interests.slice(0, 4).join(', ')}{interests.length > 4 ? ` +${interests.length - 4} more` : ''}</div>
                  <div><span className="text-white font-medium">Mode:</span> {mode}</div>
                  <div><span className="text-white font-medium">Location:</span> {location || 'Any'}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Get My Recommendations</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
