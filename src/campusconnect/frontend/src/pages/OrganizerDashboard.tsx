import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, QrCode, Calendar, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { attendanceApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function OrganizerDashboard() {
  const { user } = useAuthStore()
  const [showQR, setShowQR] = useState<{ token: string; type: string; title: string } | null>(null)

  const { data: myEvents } = useQuery({
    queryKey: ['my-events-org'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user!.id)
        .order('date', { ascending: false })
      return (data || []) as any[]
    },
    enabled: !!user,
  })

  const generateEntryQR = async (eventId: string, title: string) => {
    try {
      const res = await attendanceApi.getEntryQR(eventId)
      setShowQR({ token: res.data.qr_data, type: 'Entry', title })
    } catch { toast.error('Failed to generate QR') }
  }

  const generateExitQR = async (eventId: string, title: string) => {
    try {
      const res = await attendanceApi.getExitQR(eventId)
      setShowQR({ token: res.data.qr_data, type: 'Exit', title })
    } catch { toast.error('Failed to generate QR') }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Organizer Dashboard</h1>
            <p className="text-gray-400">Manage your events and attendance</p>
          </div>
          <a href="/events/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </a>
        </div>

        {/* Events list */}
        <div className="space-y-4">
          {(myEvents || []).length === 0 ? (
            <div className="glass p-16 rounded-2xl text-center text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No events created yet</p>
            </div>
          ) : (
            (myEvents || []).map((event: any) => (
              <div key={event.id} className="glass p-5 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-brand text-xs">{event.category}</span>
                      <span className={clsx('badge text-xs capitalize', event.is_active ? 'badge-green' : 'badge-red')}>
                        {event.is_active ? 'Active' : 'Cancelled'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white truncate">{event.title}</h3>
                    <p className="text-sm text-gray-400">{event.date} • {event.city} • {event.mode}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => generateEntryQR(event.id, event.title)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-300 text-xs hover:bg-brand-600/30 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Entry QR
                    </button>
                    <button
                      onClick={() => generateExitQR(event.id, event.title)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-600/30 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Exit QR
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass p-8 rounded-2xl max-w-sm w-full text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">{showQR.type} QR — {showQR.title}</h2>
              <button onClick={() => setShowQR(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-xl inline-block mb-4">
              <QRCode value={showQR.token} size={200} />
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Show this QR code to students for {showQR.type.toLowerCase()} scanning
            </p>
            <span className={clsx(
              'badge mt-3 inline-flex',
              showQR.type === 'Entry' ? 'badge-brand' : 'badge-green'
            )}>
              {showQR.type} QR Code
            </span>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
