import { useQuery } from '@tanstack/react-query'
import { BarChart2, Users, Calendar, Shield, TrendingUp, Database } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'

export default function AdminPanel() {
  const { profile } = useAuthStore()
  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats').then(r => r.data),
  })

  const statCards = [
    { label: 'Total Events', value: stats?.total_events, icon: Calendar, color: 'from-brand-600 to-violet-600' },
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'from-sky-600 to-cyan-600' },
    { label: 'Registrations', value: stats?.total_registrations, icon: TrendingUp, color: 'from-emerald-600 to-teal-600' },
    { label: 'Verified Attendance', value: stats?.verified_attendances, icon: Shield, color: 'from-amber-600 to-orange-600' },
  ]

  return (
    <AppLayout>
      <div className="page-container">
        <h1 className="font-display text-3xl font-bold text-white mb-8">Admin Panel</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="glass p-5 rounded-2xl">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-display font-black text-white mb-1">{card.value ?? '—'}</div>
              <div className="text-xs text-gray-400">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <a href="/dataset" target="_blank" className="btn-secondary text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Dataset Stats
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
