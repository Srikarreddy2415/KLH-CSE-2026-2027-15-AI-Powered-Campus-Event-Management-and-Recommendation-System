import { useQuery } from '@tanstack/react-query'
import { Database, BarChart2, PieChart, Users, Calendar, Activity, TrendingUp, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend,
} from 'recharts'
import { datasetApi } from '../lib/api'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']

const StatCard = ({ label, value, icon: Icon, color }: {
  label: string; value: number | string | undefined; icon: any; color: string
}) => (
  <div className="glass p-6 rounded-2xl">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-4xl font-display font-black text-white mb-1">{value ?? '—'}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
)

export default function DatasetDemo() {
  const { data: stats } = useQuery({
    queryKey: ['dataset-stats'],
    queryFn: () => datasetApi.getStats().then(r => r.data),
  })

  const { data: catData } = useQuery({
    queryKey: ['dataset-categories'],
    queryFn: () => datasetApi.getCategoryBreakdown().then(r => r.data),
  })

  const { data: intData } = useQuery({
    queryKey: ['dataset-interactions'],
    queryFn: () => datasetApi.getInteractionBreakdown().then(r => r.data),
  })

  const attendancePie = [
    { name: 'Fully Verified', value: stats?.verified_attendance || 0 },
    { name: 'Incomplete', value: (stats?.total_attendance || 0) - (stats?.verified_attendance || 0) },
  ]

  const eventScopePie = [
    { name: 'General Events', value: stats?.general_events || 0 },
    { name: 'College Events', value: stats?.college_events || 0 },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d0d1a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-brand-400" />
            <h1 className="font-display font-bold text-white">Dataset Overview</h1>
            <span className="badge badge-amber">Review 2 Demo</span>
          </div>
          <Link to="/" className="btn-ghost text-sm">← Back to Home</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Disclaimer */}
        <div className="glass p-4 rounded-xl mb-8 border border-amber-500/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-medium">Synthetic Dataset — For Prototype Development</p>
            <p className="text-xs text-gray-400 mt-1">
              This dataset is artificially generated for initial prototype development. It does NOT represent real student data
              from KL University. Real interaction data will be collected after deployment.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Events" value={stats?.total_events} icon={Calendar} color="from-brand-600 to-violet-600" />
          <StatCard label="User Profiles" value={stats?.total_users} icon={Users} color="from-sky-600 to-cyan-600" />
          <StatCard label="Interactions" value={stats?.total_interactions} icon={Activity} color="from-emerald-600 to-teal-600" />
          <StatCard label="Attendance Records" value={stats?.total_attendance} icon={TrendingUp} color="from-amber-600 to-orange-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Events by Category bar chart */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Events by Category</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(catData?.categories || []).slice(0, 12)} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(catData?.categories || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interaction types */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Interaction Types & Weights</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={intData?.interactions || []} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="type" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="count" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weight" name="Weight" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance verification pie */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Attendance Verification Status</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RPieChart>
                <Pie
                  data={attendancePie}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {attendancePie.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </div>

          {/* General vs College events pie */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">General vs College Events</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RPieChart>
                <Pie
                  data={eventScopePie}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {eventScopePie.map((_, i) => <Cell key={i} fill={i === 0 ? '#6366f1' : '#10b981'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendation engine explanation */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="font-semibold text-white text-lg mb-4">AI Recommendation Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-brand-400 mb-3">Interaction Weights</h3>
              <div className="space-y-2">
                {(intData?.interactions || []).map((item: any) => (
                  <div key={item.type} className="flex items-center gap-3">
                    <span className="text-sm text-gray-300 w-24">{item.type}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${(item.weight / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-6">×{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-brand-400 mb-3">Algorithm</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>• Model: <span className="text-white">all-MiniLM-L6-v2</span> (sentence transformers)</p>
                <p>• Similarity: <span className="text-white">Cosine similarity</span></p>
                <p>• New users: <span className="text-white">Survey-based cold start</span></p>
                <p>• Existing users: <span className="text-white">70% history + 30% survey blend</span></p>
                <p>• Threshold: <span className="text-white">5 interactions to switch modes</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
