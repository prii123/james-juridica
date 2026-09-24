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
    <nav className="mb-3 flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/dashboard" className="flex items-center rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-700">
        <Home size={15} />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-slate-300" />
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
