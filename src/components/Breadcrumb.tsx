'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-3 flex items-center gap-1 text-sm text-slate-500">
      <Link href="/dashboard" className="flex items-center text-slate-500 transition-colors hover:text-slate-800">
        <Home size={16} />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight size={16} className="text-slate-400" />
          {item.href ? (
            <Link href={item.href} className="text-slate-500 transition-colors hover:text-slate-800">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-800">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
