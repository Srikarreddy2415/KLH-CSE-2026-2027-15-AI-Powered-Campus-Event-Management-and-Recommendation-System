import { Link } from 'react-router-dom'
import {
  Sparkles, GraduationCap, Trophy,
  QrCode, ArrowRight, Zap, Globe, Users
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Personalized event suggestions using semantic embeddings and your interest history.',
    color: 'from-brand-600 to-violet-600',
  },
  {
    icon: Globe,
    title: 'General Events',
    description: 'Hackathons, workshops, conferences, networking — open to all registered users.',
    color: 'from-sky-600 to-cyan-600',
  },
  {
    icon: GraduationCap,
    title: 'College Events',
    description: 'Exclusive KL University events for verified students — classes, fests, and more.',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    icon: Trophy,
    title: 'SIL Tracking',
    description: 'Track your 25-event semester requirement automatically with verified attendance.',
    color: 'from-amber-600 to-orange-600',
  },
  {
    icon: QrCode,
    title: 'QR Attendance',
    description: 'Two-step secure QR attendance verification — Entry + Exit for fraud prevention.',
    color: 'from-pink-600 to-rose-600',
  },
  {
    icon: Users,
    title: 'Room Management',
    description: 'College venue booking with capacity checks and conflict detection.',
    color: 'from-purple-600 to-fuchsia-600',
  },
]

const stats = [
  { value: '100+', label: 'Events Available' },
  { value: '25+', label: 'Event Categories' },
  { value: '2-Step', label: 'QR Attendance' },
  { value: 'AI', label: 'Powered Recs' },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-[#0f0f1a]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">CampusConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dataset" className="btn-ghost text-sm">Dataset Demo</Link>
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow animate-delay-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/20 border border-brand-500/30 mb-6 animate-fade-in">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-brand-300 font-medium">AI-Powered Event Platform for KL University</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-black mb-6 animate-slide-up">
            Discover Events
            <br />
            <span className="gradient-text">That Matter to You</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-slide-up animate-delay-100">
            Find workshops, hackathons, competitions, meetups and campus events
            personalized to your interests using AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-200">
            <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              Explore Events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Join Your College
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in animate-delay-300">
            {stats.map((stat) => (
              <div key={stat.label} className="glass p-4 rounded-2xl">
                <div className="font-display text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Never Miss an Event</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From AI-powered personalization to QR attendance tracking — CampusConnect has it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="glass-hover p-6 rounded-2xl animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass p-12 rounded-3xl border border-brand-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-violet-900/30" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold mb-4">
                Ready to Discover Your Next Event?
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Join CampusConnect and let AI recommend the perfect events for your interests.
              </p>
              <Link to="/register" className="btn-primary text-lg px-10 py-3 inline-flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="font-display font-bold text-white">CampusConnect</span>
        </div>
        <p className="text-gray-500 text-sm">
          AI-Powered Campus Event Management System — KL University | Review 2 Prototype
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Dataset is synthetic and generated for prototype development purposes.
        </p>
      </footer>
    </div>
  )
}
