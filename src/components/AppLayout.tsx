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
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Determinar si debe mostrar el sidebar
  const showSidebar = session && !authRoutes.includes(pathname) && pathname !== '/'
  
  // Si no debe mostrar sidebar, renderizar solo el contenido
  if (!showSidebar) {
    return (
      <div className="min-vh-100">
        {children}
      </div>
    )
  }

  // Renderizar con sidebar para usuarios autenticados en rutas protegidas
  return (
    <div className="min-vh-100 bg-light">
      {/* TopBar fijo global */}
      <TopBar />
      
      <div className="d-flex vh-100">
        {/* Desktop Sidebar */}
        <aside 
          className="d-none d-lg-block position-fixed h-100" 
          style={{width: '16rem', zIndex: 10}}
        >
          <Sidebar />
        </aside>
        
        {/* Mobile Sidebar */}
        <MobileSidebar />
        
        {/* Main content area */}
        <div className="flex-fill d-flex flex-column d-lg-block" style={{marginLeft: '0'}}>
          {/* Desktop: apply margin */}
          <div className="d-none d-lg-block" style={{marginLeft: '16rem'}}>
            {/* Page content */}
            <main className="main-content overflow-auto p-3 p-lg-4 bg-light" style={{minHeight: '100vh'}}>
              {/* Espaciador automático para compensar TopBar fijo */}
              <div className="topbar-spacer"></div>
              
              <div className="container-fluid">
                {children}
              </div>
            </main>
          </div>
          
          {/* Mobile: no margin */}
          <div className="d-lg-none d-flex flex-column h-100">
            {/* Page content */}
            <main className="main-content flex-fill overflow-auto p-3 bg-light">
              {/* Espaciador automático para compensar TopBar fijo */}
              <div className="topbar-spacer"></div>
              
              <div className="container-fluid">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}