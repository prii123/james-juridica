'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, User, LogOut } from 'lucide-react'

export default function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar casos, clientes, documentos..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 focus:bg-white transition-all duration-200 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center space-x-6">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-600 hover:text-slate-900">
              <Bell className="h-5 w-5" />
            </button>
            
            {/* Notification Badge */}
            <div className="relative">
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500">
                {session?.user?.email || 'usuario@ejemplo.com'}
              </p>
            </div>
            
            {/* Avatar */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 text-slate-600 group"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4 group-hover:animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}