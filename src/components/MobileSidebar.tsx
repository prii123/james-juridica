'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="d-lg-none position-fixed" style={{top: '1rem', left: '1rem', zIndex: 50}}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-3 shadow border border-secondary"
        >
          <Menu style={{width: '20px', height: '20px'}} className="text-secondary" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed bg-dark opacity-50"
          style={{top: 0, left: 0, right: 0, bottom: 0, zIndex: 40}}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`d-lg-none position-fixed bg-white transition-all ${isOpen ? 'start-0' : ''}`} style={{top: 0, bottom: 0, width: '16rem', zIndex: 50, transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary">
          <h2 className="fs-5 fw-semibold text-dark">ERP Jurídico</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 btn btn-light rounded"
          >
            <X style={{width: '20px', height: '20px'}} className="text-secondary" />
          </button>
        </div>
        
        <div className="h-100 overflow-auto">
          <Sidebar className="border-end-0" />
        </div>
      </div>
    </>
  )
}