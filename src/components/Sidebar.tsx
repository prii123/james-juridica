'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scale } from 'lucide-react'
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
    <div className={cn('flex h-full flex-col bg-slate-900 text-white', className)}>
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-soft">
          <Scale size={18} className="text-slate-900" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[0.95rem] font-bold leading-tight text-white">ERP Jurídico</h2>
          <p className="truncate text-xs font-medium text-slate-400">Procesos de Insolvencia</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {modules.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = getIcon(item.icon)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full bg-amber-400" style={{ width: '3px' }} />
              )}
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive ? 'bg-amber-400/15 text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1 truncate">
                <div className={cn('font-semibold', isActive ? 'text-white' : 'text-slate-200')}>
                  {item.name}
                </div>
                {item.description && (
                  <div className="hidden truncate text-xs text-slate-500 lg:block">
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
