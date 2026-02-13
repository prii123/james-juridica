'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    if (!session) {
      router.replace('/auth/login')
    } else {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-light border-t-transparent rounded-circle animate-spin mb-3 d-block mx-auto"></div>
        <p className="text-light fs-5 fw-medium">Redirigiendo...</p>
      </div>
    </div>
  )
}