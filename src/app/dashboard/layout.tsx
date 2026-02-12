import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileSidebar from '@/components/MobileSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-xl border-r border-slate-200 fixed h-full z-10 backdrop-blur-sm">
          <Sidebar />
        </aside>
        
        {/* Mobile Sidebar */}
        <MobileSidebar />
        
        {/* Main content area */}
        <div className="flex-1 lg:ml-64 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
            <TopBar />
          </div>
          
          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gradient-to-br from-slate-50/50 to-slate-100/30">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}