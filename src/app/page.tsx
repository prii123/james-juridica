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

  // Mostrar spinner mientras se redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-white text-lg font-medium">Redirigiendo...</p>
      </div>
    </div>
  )
}