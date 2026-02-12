'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales inválidas')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Patrón de fondo mejorado */}
      <div className="absolute inset-0 bg-slate-900/30 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]"></div>
      
      {/* Efectos de luz ambiental */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-70 animate-pulse delay-1000"></div>
      
      <div className="relative max-w-md w-full space-y-8 z-10">
        {/* Header con logo/escudo mejorado */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl mb-8 ring-4 ring-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
            <svg className="w-12 h-12 text-slate-800 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              ERP Jurídico
            </span>
          </h1>
          <p className="text-amber-100 text-xl font-semibold tracking-wide drop-shadow-md">
            Procesos de Insolvencia
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-6 rounded-full"></div>
        </div>
        
        {/* Card principal mejorada */}
        <div className="bg-white/98 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-10 relative overflow-hidden">
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
          <div className="relative z-10">
            <form className="space-y-7" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-3 transition-colors group-focus-within:text-indigo-600">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 placeholder-slate-400 hover:border-slate-300 hover:bg-white/80"
                    placeholder="ejemplo@firma.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-3 transition-colors group-focus-within:text-indigo-600">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-slate-900 bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 placeholder-slate-400 hover:border-slate-300 hover:bg-white/80"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 text-sm text-center font-semibold flex items-center justify-center space-x-2 animate-shake">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:via-indigo-800 hover:to-indigo-900 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg relative overflow-hidden group"
            >
              {/* Efecto de brillo en el botón */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Verificando credenciales...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-lg font-semibold">Acceder al Sistema</span>
                </div>
              )}
            </button>
            </form>

            {/* Información de usuarios de prueba mejorada */}
            <div className="mt-10 pt-8 border-t border-slate-200/70">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-6 border border-slate-100 shadow-inner">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Credenciales de Prueba
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/90 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="font-semibold text-slate-800">Admin Simple</span>
                    </div>
                    <code className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-medium text-xs">admin</code>
                  </div>
                  <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/90 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="font-semibold text-slate-800">Administrador</span>
                    </div>
                    <code className="text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg font-medium text-xs">admin@juridica.com</code>
                  </div>
                  <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/90 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-semibold text-slate-800">Abogado Principal</span>
                    </div>
                    <code className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium text-xs">abogado@juridica.com</code>
                  </div>
                  <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/90 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      <span className="font-semibold text-slate-800">Asesor Jurídico</span>
                    </div>
                    <code className="text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg font-medium text-xs">asesor@juridica.com</code>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-600 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                    </svg>
                    <span className="font-medium">Contraseñas:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">admin:</span>
                        <code className="bg-red-50 px-2 py-1 rounded font-bold text-red-700">admin123</code>
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">admin@juridica.com:</span>
                        <code className="bg-orange-50 px-2 py-1 rounded font-bold text-orange-700">admin123</code>
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">abogado@juridica.com:</span>
                        <code className="bg-emerald-50 px-2 py-1 rounded font-bold text-emerald-700">abogado123</code>
                      </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">asesor@juridica.com:</span>
                        <code className="bg-violet-50 px-2 py-1 rounded font-bold text-violet-700">asesor123</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer mejorado */}
        <div className="text-center text-slate-200 text-sm space-y-2">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <p className="font-medium">Sistema Jurídico Especializado</p>
            </div>
            <div className="w-px h-4 bg-slate-400/50"></div>
            <p className="font-medium">Procesos de Insolvencia</p>
          </div>
          <div className="flex items-center justify-center space-x-2 opacity-80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs">© 2026 - Plataforma Segura y Confidencial</p>
          </div>
        </div>
      </div>
    </div>
  )
}