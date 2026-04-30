'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { getIcon } from '@/lib/sidebar-icons'

interface ModuleItem {
  id: string
  name: string
  href: string
  icon: string
  description: string | null
  permission: string | null
  order: number
}

export default function Sidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const [modules, setModules] = useState<ModuleItem[]>([])

  useEffect(() => {
    fetch('/api/sidebar')
      .then(res => res.json())
      .then(data => setModules(data.modules || []))
      .catch(() => setModules([]))
  }, [])

  return (
    <div className={`h-100 ${className}`} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
      <div className="p-4 border-bottom" style={{ borderColor: '#334155 !important', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <h2 className="h5 fw-bold" style={{ color: '#ffffff' }}>ERP Jurídico</h2>
        <p className="small fw-medium" style={{ color: '#cbd5e1' }}>Procesos de Insolvencia</p>
      </div>

      <nav className="p-3">
        {modules.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = getIcon(item.icon)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`d-flex align-items-center gap-3 px-3 py-3 rounded-3 small fw-medium transition-all text-decoration-none ${isActive
                  ? 'border-start border-4 shadow-sm'
                  : 'hover-shadow-sm'
                }`}
              style={{
                backgroundColor: isActive ? '#6b7280' : 'transparent',
                borderColor: isActive ? '#9ca3af' : 'transparent',
                color: isActive ? '#ffffff' : '#e2e8f0'
              }}
            >
              <Icon
                className="transition-colors"
                style={{
                  width: '20px',
                  height: '20px',
                  flexShrink: 0,
                  color: isActive ? '#ffffff' : '#94a3b8'
                }}
              />
              <div className="text-truncate flex-fill" style={{ minWidth: 0 }}>
                <div className="fw-semibold" style={{ color: isActive ? '#ffffff' : '#f1f5f9' }}>{item.name}</div>
                {item.description && (
                  <div className="small d-none d-lg-block text-truncate" style={{ color: '#94a3b8' }}>
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* <div className="mt-auto p-3 border-top" style={{ borderColor: '#334155', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <Link
          href="/configuracion"
          className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 small fw-medium transition-all text-decoration-none"
          style={{ color: '#e2e8f0' }}
        >
          <Settings style={{ color: '#94a3b8', width: '20px', height: '20px', flexShrink: 0 }} />
          <div className="text-truncate flex-fill" style={{ minWidth: 0 }}>
            <div className="fw-semibold" style={{ color: '#f1f5f9' }}>Configuración</div>
            <div className="small d-none d-lg-block text-truncate" style={{ color: '#94a3b8' }}>
              Ajustes del sistema
            </div>
          </div>
        </Link>
      </div> */}
    </div>
  )
}
