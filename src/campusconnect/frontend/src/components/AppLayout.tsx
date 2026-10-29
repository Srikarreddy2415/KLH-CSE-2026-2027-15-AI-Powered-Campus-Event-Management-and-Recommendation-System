import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      {/* Main content — offset for sidebar width on desktop */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
