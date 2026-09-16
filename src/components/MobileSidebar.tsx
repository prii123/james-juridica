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
          className="rounded-lg border border-slate-200 bg-white p-2 shadow"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed bottom-0 top-0 z-50 w-64 bg-white transition-transform lg:hidden',
          isOpen ? 'left-0 translate-x-0' : 'left-0 -translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <h2 className="text-lg font-semibold text-slate-800">ERP Jurídico</h2>
          <button onClick={() => setIsOpen(false)} className="rounded-lg bg-slate-100 p-1 hover:bg-slate-200">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="h-full overflow-auto">
          <Sidebar />
        </div>
      </div>
    </>
  )
}
