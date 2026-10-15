'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileSidebar from './MobileSidebar'
import { PendientesBotProvider } from './PendientesBot'

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
    <PendientesBotProvider>
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

          {/* Contenido: se monta una sola vez. En escritorio deja el margen de la barra lateral fija. */}
          <div className="min-w-0 flex-1 lg:ml-64">
            <main className="main-content min-h-screen overflow-auto bg-slate-50 p-4 lg:p-6">
              {/* Espaciador automático para compensar TopBar fijo */}
              <div className="topbar-spacer" />
              <div className="w-full">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </PendientesBotProvider>
  )
}
