import axios from 'axios'
import { supabase } from './supabase'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BACKEND })

// Inject Supabase JWT into every FastAPI request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// ─── Events API ───────────────────────────────────────────────────────────────
export const eventsApi = {
  create: (data: any) => api.post('/api/events', data),
  update: (id: string, data: any) => api.put(`/api/events/${id}`, data),
  delete: (id: string) => api.delete(`/api/events/${id}`),
  getCollegeEvents: () => api.get('/api/events/college'),
}

// ─── Recommendations API ──────────────────────────────────────────────────────
export const recommendationsApi = {
  getPersonalized: (userId: string, limit: number = 10) =>
    api.get('/api/recommendations', { params: { user_id: userId, limit } }),
  trackInteraction: (eventId: string, type: string) =>
    api.post('/api/interactions', { event_id: eventId, interaction_type: type }),
}

// ─── Registrations API ────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (eventId: string) => api.post('/api/registrations', { event_id: eventId }),
  unregister: (eventId: string) => api.delete(`/api/registrations/${eventId}`),
  myRegistrations: () => api.get('/api/registrations/my'),
  save: (eventId: string) => api.post('/api/saves', { event_id: eventId }),
  unsave: (eventId: string) => api.delete(`/api/saves/${eventId}`),
  mySaved: () => api.get('/api/saves/my'),
  participationHistory: () => api.get('/api/interactions/my'),
  rate: (eventId: string, rating: number) => api.post('/api/ratings', { event_id: eventId, rating }),
}

// ─── Attendance API ───────────────────────────────────────────────────────────
export const attendanceApi = {
  getEntryQR: (eventId: string) => api.get(`/api/attendance/entry-qr/${eventId}`),
  getExitQR: (eventId: string) => api.get(`/api/attendance/exit-qr/${eventId}`),
  scanEntry: (token: string) => api.post('/api/attendance/scan-entry', { token }),
  scanExit: (token: string) => api.post('/api/attendance/scan-exit', { token }),
}

// ─── SIL API ─────────────────────────────────────────────────────────────────
export const silApi = {
  getProgress: () => api.get('/api/sil/progress'),
  getHistory: () => api.get('/api/sil/history'),
  getLeaderboard: (collegeId: string = 'KLU') => api.get('/api/sil/leaderboard', { params: { college_id: collegeId } }),
}

// ─── Dataset API (for DatasetDemo page — connects to FastAPI) ─────────────────
export const datasetApi = {
  getStats: () => api.get('/api/dataset/stats'),
  getCategoryBreakdown: () => api.get('/api/dataset/categories'),
  getInteractionBreakdown: () => api.get('/api/dataset/interactions'),
  getUserInterests: () => api.get('/api/dataset/user-interests'),
  getModeDistribution: () => api.get('/api/dataset/mode-distribution'),
}
