'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileSidebar from './MobileSidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

// Rutas donde NO se debe mostrar el sidebar
const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Determinar si debe mostrar el sidebar
  const showSidebar = session && !authRoutes.includes(pathname) && pathname !== '/'

  // Si no debe mostrar sidebar, renderizar solo el contenido
  if (!showSidebar) {
    return <div className="min-h-screen">{children}</div>
  }

  // Renderizar con sidebar para usuarios autenticados en rutas protegidas
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TopBar fijo global */}
      <TopBar />

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="fixed hidden h-full w-64 lg:block" style={{ zIndex: 10 }}>
          <Sidebar />
        </aside>

        {/* Mobile Sidebar */}
        <MobileSidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col lg:block">
          {/* Desktop: apply margin */}
          <div className="hidden lg:ml-64 lg:block">
            <main className="main-content min-h-screen overflow-auto bg-slate-50 p-4 lg:p-6">
              {/* Espaciador automático para compensar TopBar fijo */}
              <div className="topbar-spacer" />
              <div className="w-full">{children}</div>
            </main>
          </div>

          {/* Mobile: no margin */}
          <div className="flex h-full flex-col lg:hidden">
            <main className="main-content flex-1 overflow-auto bg-slate-50 p-4">
              {/* Espaciador automático para compensar TopBar fijo */}
              <div className="topbar-spacer" />
              <div className="w-full">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
