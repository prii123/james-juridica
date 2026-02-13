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
    <nav className="d-flex align-items-center gap-1 fs-6 text-secondary mb-3">
      <Link 
        href="/dashboard"
        className="d-flex align-items-center text-secondary hover-text-dark transition-colors"
      >
        <Home style={{width: '16px', height: '16px'}} />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="d-flex align-items-center gap-1">
          <ChevronRight style={{width: '16px', height: '16px'}} className="text-muted" />
          {item.href ? (
            <Link 
              href={item.href}
              className="text-secondary hover-text-dark transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-dark fw-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}