'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, User, LogOut } from 'lucide-react'

export default function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-bottom border-secondary px-4 py-3 shadow">
      <div className="d-flex align-items-center justify-content-between">
        {/* Search */}
        <div className="d-flex align-items-center flex-fill">
          <div className="input-group">
            <span className="input-group-text"><Search className="h-4 w-4" /></span>
            <input
              type="text"
              placeholder="Buscar casos, clientes, documentos..."
              className="form-control"
            />
          </div>
        </div>

        {/* Right side - Notifications and User */}
        <div className="d-flex align-items-center gap-3">
          {/* Quick Actions */}
          <div className="d-none d-md-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm">
              <Bell className="h-5 w-5" />
            </button>
            
            {/* Notification Badge */}
            <div className="position-relative">
              <button className="btn btn-outline-secondary btn-sm position-relative">
                <Bell className="h-5 w-5" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"></span>
              </button>
            </div>
          </div>

          {/* User Menu */}
          <div className="d-flex align-items-center gap-3 ps-3 border-start border-secondary">
            <div className="d-none d-sm-block text-end">
              <p className="mb-0 fw-semibold text-dark">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="mb-0 small text-muted">
                {session?.user?.email || 'usuario@ejemplo.com'}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center shadow" style={{width: '40px', height: '40px'}}>
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" style={{width: '12px', height: '12px'}}></div>
              </div>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="btn btn-outline-danger btn-sm"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}