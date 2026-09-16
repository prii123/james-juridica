'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, User, LogOut, FileText, Users, Briefcase, CreditCard, Scale, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  tipo: 'lead' | 'cliente' | 'caso' | 'factura' | 'radicacion'
  titulo: string
  subtitulo: string
  estado: string
  detalles: string
  url: string
}

interface SearchResults {
  leads: SearchResult[]
  clientes: SearchResult[]
  casos: SearchResult[]
  facturas: SearchResult[]
  radicaciones: SearchResult[]
}

const getIcon = (tipo: string) => {
  switch (tipo) {
    case 'lead': return Users
    case 'cliente': return Users
    case 'caso': return Briefcase
    case 'factura': return CreditCard
    case 'radicacion': return Scale
    default: return FileText
  }
}

const getTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'lead': return 'Lead'
    case 'cliente': return 'Cliente'
    case 'caso': return 'Caso'
    case 'factura': return 'Factura'
    case 'radicacion': return 'Radicación'
    default: return tipo
  }
}

const categoryLabels: Record<string, string> = {
  leads: '👤 Leads',
  clientes: '🏢 Clientes',
  casos: '⚖️ Casos',
  facturas: '💰 Facturas',
  radicaciones: '🤝 Radicaciones',
}

const badgeColorClasses: Record<string, string> = {
  success: 'bg-teal-100 text-teal-800',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-800',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-slate-100 text-slate-700',
}

const getBadgeClass = (estado: string) => {
  switch (estado.toUpperCase()) {
    case 'ACTIVO': case 'NUEVO': case 'GENERADA': case 'SOLICITADA': return badgeColorClasses.success
    case 'VENCIDO': case 'VENCIDA': case 'PERDIDO': case 'ANULADA': return badgeColorClasses.danger
    case 'PARCIAL': case 'EN_PROCESO': case 'PROGRAMADA': return badgeColorClasses.warning
    case 'PAGADA': case 'CONVERTIDO': case 'CERRADO': case 'REALIZADA': return badgeColorClasses.primary
    default: return badgeColorClasses.secondary
  }
}

export default function TopBar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults>({
    leads: [], clientes: [], casos: [], facturas: [], radicaciones: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery)
      } else {
        setSearchResults({ leads: [], clientes: [], casos: [], facturas: [], radicaciones: [] })
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Calcular posición del dropdown
  const updateDropdownPosition = () => {
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    }
  }

  // Actualizar posición del dropdown cuando se muestre o cambie el tamaño de la ventana
  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition()

      const handleResize = () => updateDropdownPosition()
      const handleScroll = () => updateDropdownPosition()

      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)

      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [showDropdown])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
        updateDropdownPosition()
        setShowDropdown(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener todos los resultados en orden para navegación con teclado
  const getAllResults = (): SearchResult[] => {
    const all: SearchResult[] = []
    Object.values(searchResults).forEach(categoryResults => {
      all.push(...categoryResults)
    })
    return all
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = getAllResults()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          router.push(allResults[selectedIndex].url)
          setShowDropdown(false)
          setSearchQuery('')
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setShowDropdown(false)
    setSearchQuery('')
  }

  const allResults = getAllResults()

  return (
    <header
      className="fixed inset-x-0 top-0 z-[1030] flex items-center border-b border-slate-200 bg-white px-4 py-2 shadow lg:ml-64 lg:w-[calc(100%-16rem)]"
      style={{ height: 'var(--topbar-height)', maxHeight: 'var(--topbar-height)' }}
    >
      <div className="flex w-full items-center justify-between">
        {/* Search with Dropdown */}
        <div className="relative flex flex-1 items-center" ref={searchRef}>
          <div className="relative flex w-full max-w-[500px] items-center">
            <span className="pointer-events-none absolute left-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, casos, facturas..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  updateDropdownPosition()
                  setShowDropdown(true)
                }
              }}
            />
            {isLoading && (
              <span className="absolute right-3 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="sr-only">Buscando...</span>
              </span>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div
              className="search-dropdown fixed overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999,
                maxHeight: '400px',
              }}
            >
              {allResults.length === 0 ? (
                <div className="p-3 text-center text-slate-500">
                  {searchQuery.length >= 2 ? 'No se encontraron resultados' : 'Escribe al menos 2 caracteres'}
                </div>
              ) : (
                <>
                  {/* Mostrar contador total */}
                  <div className="sticky top-0 z-[3] border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <small className="font-semibold text-slate-500">
                      📊 {allResults.length} resultado{allResults.length !== 1 ? 's' : ''} encontrado{allResults.length !== 1 ? 's' : ''}
                    </small>
                  </div>

                  {/* Resultados por categoría */}
                  {Object.entries(searchResults).map(([category, results]) => {
                    if (results.length === 0) return null

                    return (
                      <div key={category}>
                        <div className="sticky top-8 z-[2] border-y border-slate-200 bg-slate-50 px-3 py-2">
                          <small className="font-semibold uppercase text-slate-500">
                            {categoryLabels[category]} ({results.length})
                          </small>
                        </div>
                        {results.map((result: SearchResult) => {
                          const globalIndex = allResults.findIndex(r => r.id === result.id && r.tipo === result.tipo)
                          const Icon = getIcon(result.tipo)

                          return (
                            <div
                              key={`${result.tipo}-${result.id}`}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 border-b border-slate-100 p-3 transition-colors',
                                globalIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                              )}
                              onClick={() => handleResultClick(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            >
                              <Icon size={16} className="text-slate-400" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{result.titulo}</span>
                                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getBadgeClass(result.estado))}>
                                    {result.estado}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-500">{result.subtitulo}</div>
                                <div className="text-sm text-slate-500">{result.detalles}</div>
                              </div>
                              <div className="text-sm text-slate-500">
                                {getTypeLabel(result.tipo)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}

                  {/* Indicador de scroll al final si hay muchos resultados */}
                  {allResults.length > 10 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-center">
                      <small className="text-slate-500">
                        ↕️ Usa las flechas ↑↓ o scroll para navegar • Enter para abrir
                      </small>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Notification Badge */}
            <div className="relative">
              <button className="relative rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
                <Bell size={20} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-600" />
              </button>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <div className="hidden text-right sm:block">
              <p className="m-0 font-semibold text-slate-800">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="m-0 text-sm text-slate-500">
                {session?.user?.email || 'usuario@ejemplo.com'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 shadow">
                  <User size={20} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-teal-600" />
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="rounded-lg border border-red-600 p-1.5 text-red-600 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
