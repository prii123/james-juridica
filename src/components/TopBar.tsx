'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, User, LogOut, FileText, Users, Briefcase, CreditCard, Scale } from 'lucide-react'

interface SearchResult {
  id: string
  tipo: 'lead' | 'cliente' | 'caso' | 'factura' | 'conciliacion'
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
  conciliaciones: SearchResult[]
}

const getIcon = (tipo: string) => {
  switch (tipo) {
    case 'lead': return Users
    case 'cliente': return Users
    case 'caso': return Briefcase
    case 'factura': return CreditCard
    case 'conciliacion': return Scale
    default: return FileText
  }
}

const getTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'lead': return 'Lead'
    case 'cliente': return 'Cliente'
    case 'caso': return 'Caso'
    case 'factura': return 'Factura'
    case 'conciliacion': return 'Conciliación'
    default: return tipo
  }
}

const getBadgeColor = (estado: string) => {
  switch (estado.toUpperCase()) {
    case 'ACTIVO': case 'NUEVO': case 'GENERADA': case 'SOLICITADA': return 'success'
    case 'VENCIDO': case 'VENCIDA': case 'PERDIDO': case 'ANULADA': return 'danger'
    case 'PARCIAL': case 'EN_PROCESO': case 'PROGRAMADA': return 'warning'
    case 'PAGADA': case 'CONVERTIDO': case 'CERRADO': case 'REALIZADA': return 'primary'
    default: return 'secondary'
  }
}

export default function TopBar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults>({
    leads: [], clientes: [], casos: [], facturas: [], conciliaciones: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery)
      } else {
        setSearchResults({ leads: [], clientes: [], casos: [], facturas: [], conciliaciones: [] })
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

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

  return (
    <>
      {/* Estilos CSS para el dropdown y scrollbar */}
      <style jsx global>{`
        .search-dropdown {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .search-dropdown::-webkit-scrollbar {
          width: 8px;
        }
        
        .search-dropdown::-webkit-scrollbar-track {  
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .search-dropdown::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .search-dropdown::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .search-item:hover {
          background-color: rgba(13, 110, 253, 0.1) !important;
        }
        
        .topbar-responsive {
          z-index: 1030;
          left: 0;
          margin-left: min(16rem, 0px);
          height: var(--topbar-height) !important;
          max-height: var(--topbar-height);
          overflow: hidden;
        }
        
        @media (min-width: 992px) {
          .topbar-responsive {
            margin-left: 16rem !important;
            width: calc(100% - 16rem) !important;
          }
        }
      `}</style>
      
      <header className="bg-white border-bottom border-secondary px-4 py-2 shadow position-fixed top-0 w-100 topbar-responsive d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between w-100">
        {/* Search with Dropdown */}
        <div className="d-flex align-items-center flex-fill position-relative" ref={searchRef}>
          <div className="input-group" style={{ maxWidth: '500px' }}>
            <span className="input-group-text">
              <Search className="h-4 w-4" />
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, casos, facturas..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            />
            {isLoading && (
              <span className="input-group-text">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Buscando...</span>
                </div>
              </span>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div 
              className="position-absolute bg-white shadow border rounded-3 search-dropdown"
              style={{ 
                top: '100%', 
                left: '0', 
                right: '0', 
                zIndex: 9999, 
                marginTop: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                overflowX: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #dee2e6'
              }}
            >
              {getAllResults().length === 0 ? (
                <div className="p-3 text-center text-muted">
                  {searchQuery.length >= 2 ? 'No se encontraron resultados' : 'Escribe al menos 2 caracteres'}
                </div>
              ) : (
                <>
                  {/* Mostrar contador total */}
                  <div className="px-3 py-2 bg-primary bg-opacity-10 border-bottom position-sticky" style={{ 
                    backgroundColor: '#f8f9fa',
                    top: '0',
                    zIndex: 3
                  }}>
                    <small className="text-muted fw-semibold">
                      📊 {getAllResults().length} resultado{getAllResults().length !== 1 ? 's' : ''} encontrado{getAllResults().length !== 1 ? 's' : ''}
                    </small>
                  </div>
                  
                  {/* Resultados por categoría */}
                  {Object.entries(searchResults).map(([category, results]) => {
                    if (results.length === 0) return null
                    
                    return (
                      <div key={category}>
                        <div className="px-3 py-2 bg-light border-bottom position-sticky" style={{ 
                          backgroundColor: '#f8f9fa', 
                          borderTop: '1px solid #dee2e6',
                          top: '32px',
                          zIndex: 2
                        }}>
                          <small className="text-muted fw-semibold text-uppercase">
                            {category === 'leads' ? '👤 Leads' :
                             category === 'clientes' ? '🏢 Clientes' :
                             category === 'casos' ? '⚖️ Casos' :
                             category === 'facturas' ? '💰 Facturas' :
                             '🤝 Conciliaciones'} ({results.length})
                          </small>
                        </div>
                        {results.map((result: SearchResult) => {
                          const globalIndex = getAllResults().findIndex(r => r.id === result.id && r.tipo === result.tipo)
                          const Icon = getIcon(result.tipo)
                          
                          return (
                            <div
                              key={`${result.tipo}-${result.id}`}
                              className={`p-3 border-bottom d-flex align-items-center gap-3 ${
                                globalIndex === selectedIndex ? 'bg-primary bg-opacity-10' : ''
                              }`}
                              style={{ 
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => handleResultClick(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            >
                              <Icon size={16} className="text-muted" />
                              <div className="flex-fill">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-medium">{result.titulo}</span>
                                  <span className={`badge bg-${getBadgeColor(result.estado)} badge-sm`}>
                                    {result.estado}
                                  </span>
                                </div>
                                <div className="small text-muted">{result.subtitulo}</div>
                                <div className="small text-muted">{result.detalles}</div>
                              </div>
                              <div className="small text-muted">
                                {getTypeLabel(result.tipo)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  
                  {/* Indicador de scroll al final si hay muchos resultados */}
                  {getAllResults().length > 10 && (
                    <div className="px-3 py-2 text-center bg-light border-top" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="text-muted">
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
        <div className="d-flex align-items-center gap-3">
          {/* Quick Actions */}
          <div className="d-none d-md-flex align-items-center gap-2">
            
            {/* Notification Badge */}
            <div className="position-relative">
              <button className="btn btn-outline-secondary btn-sm position-relative">
                <Bell className="h-5 w-5" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"></span>
              </button>
            </div>
          </div>

          {/* User Menu */}
          <div className="d-flex align-items-center gap-3 ps-3 border-start border-secondary">
            <div className="d-none d-sm-block text-end">
              <p className="mb-0 fw-semibold text-dark">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="mb-0 small text-muted">
                {session?.user?.email || 'usuario@ejemplo.com'}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center shadow" style={{width: '40px', height: '40px'}}>
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" style={{width: '12px', height: '12px'}}></div>
              </div>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="btn btn-outline-danger btn-sm"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}