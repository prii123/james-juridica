'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getIcon } from '@/lib/sidebar-icons'
import { cn } from '@/lib/utils'

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
    <div className={cn('h-full bg-slate-800 text-white', className)}>
      <div className="border-b border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <h2 className="text-lg font-bold text-white">ERP Jurídico</h2>
        <p className="text-sm font-medium text-slate-300">Procesos de Insolvencia</p>
      </div>

      <nav className="p-3">
        {modules.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = getIcon(item.icon)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium no-underline transition-colors',
                isActive
                  ? 'border-l-4 border-slate-400 bg-slate-500 shadow-sm'
                  : 'border-l-4 border-transparent text-slate-200 hover:bg-slate-700/60'
              )}
            >
              <Icon
                size={20}
                className={cn('shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400')}
              />
              <div className="min-w-0 flex-1 truncate">
                <div className={cn('font-semibold', isActive ? 'text-white' : 'text-slate-100')}>
                  {item.name}
                </div>
                {item.description && (
                  <div className="hidden truncate text-xs text-slate-400 lg:block">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
