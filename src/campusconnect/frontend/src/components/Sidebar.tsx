import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Calendar, Sparkles, BookmarkCheck,
  GraduationCap, User, Settings, LogOut, Menu, X,
  Building2, Trophy, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'General Events', path: '/events' },
  { icon: GraduationCap, label: 'College Events', path: '/events/college', requiresCollege: true },
  { icon: Sparkles, label: 'Recommendations', path: '/recommendations' },
  { icon: BookmarkCheck, label: 'My Events', path: '/my-events' },
  { icon: Trophy, label: 'SIL Dashboard', path: '/sil', requiresCollege: true },
  { icon: Building2, label: 'Organizer', path: '/organizer' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">CampusConnect</span>
        </Link>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-sm font-bold">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {profile.college_verified ? `✓ ${profile.college_id} Verified` : 'General User'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.requiresCollege && !profile?.college_verified) return null
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={clsx(active ? 'nav-item-active' : 'nav-item')}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link to="/profile" onClick={() => setOpen(false)} className="nav-item">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
        {profile?.role === 'admin' && (
          <Link to="/admin" onClick={() => setOpen(false)} className="nav-item">
            <Settings className="w-5 h-5" />
            <span>Admin</span>
          </Link>
        )}
        <button onClick={handleSignOut} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0d0d1a] border-r border-white/10 fixed left-0 top-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-[#0d0d1a] border-r border-white/10 z-50 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
