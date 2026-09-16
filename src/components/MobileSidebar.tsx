'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-xl border border-slate-200 bg-white p-2 shadow-soft transition-shadow hover:shadow-soft-md"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed bottom-0 top-0 z-50 w-72 shadow-soft-xl transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'left-0 translate-x-0' : 'left-0 -translate-x-full'
        )}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>

        <div className="h-full overflow-auto">
          <Sidebar />
        </div>
      </div>
    </>
  )
}
