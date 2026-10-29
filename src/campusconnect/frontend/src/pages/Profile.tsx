import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, MapPin } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { profile, fetchProfile, user } = useAuthStore()
  const navigate = useNavigate()

  const [collegeEmail, setCollegeEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [verifyStep, setVerifyStep] = useState<'email' | 'otp' | 'done'>(
    profile?.college_verified ? 'done' : 'email'
  )
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const requestVerification = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-college', null, { params: { college_email: collegeEmail } })
      setDevOtp(res.data.otp || '')
      toast.success('OTP sent!')
      setVerifyStep('otp')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const confirmOtp = async () => {
    setLoading(true)
    try {
      await api.post('/api/auth/verify-college/confirm', { college_email: collegeEmail, otp })
      toast.success('College email verified!')
      setVerifyStep('done')
      if (user) await fetchProfile(user.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <AppLayout>
      <div className="page-container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-white mb-8">Profile</h1>

        {/* Profile card */}
        <div className="glass p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{profile?.name}</h2>
              <p className="text-gray-400 text-sm">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-brand text-xs capitalize">{profile?.role || 'student'}</span>
                {profile?.college_verified && <span className="badge badge-green text-xs">{profile.college_id} Verified</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>{profile?.location || 'Location not set'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>{profile?.college_verified ? `${profile.college_id} (${profile.college_email})` : 'No college verified'}</span>
            </div>
          </div>
        </div>

        {/* College verification */}
        {!profile?.college_verified && (
          <div className="glass p-6 rounded-2xl mb-6 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Verify College Email</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Verify your college email (.edu / institutional) to unlock college events and SIL tracking.
            </p>

            {verifyStep === 'email' && (
              <div className="space-y-3">
                <input
                  type="email"
                  value={collegeEmail}
                  onChange={e => setCollegeEmail(e.target.value)}
                  placeholder="yourname@college.edu.in"
                  className="input-field"
                />
                <button onClick={requestVerification} disabled={!collegeEmail || loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send Verification OTP'}
                </button>
              </div>
            )}

            {verifyStep === 'otp' && (
              <div className="space-y-3">
                {devOtp && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                    <strong>[DEV MODE]</strong> OTP: <span className="font-mono text-lg">{devOtp}</span>
                  </div>
                )}
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="input-field font-mono text-center text-xl tracking-widest"
                />
                <button onClick={confirmOtp} disabled={otp.length < 6 || loading} className="btn-primary w-full">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
          </div>
        )}

        {profile?.college_verified && (
          <div className="glass p-5 rounded-2xl mb-6 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-medium text-white">{profile.college_id} — College Verified</p>
                <p className="text-sm text-gray-400">{profile.college_email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="btn-secondary w-full text-red-400 border-red-500/30 hover:border-red-500/60"
        >
          Sign Out
        </button>
      </div>
    </AppLayout>
  )
}
