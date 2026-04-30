'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Search, User, FileText, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  tipo: string
  titulo: string
  subtitulo: string
  estado: string
  detalles: string
}

interface Paso {
  id: string
  nombre: string
  completado: boolean
  descripcion?: string
}

const PASOS_BASE = [
  { id: 'autodeadmision', nombre: 'Autodeadmisión', descripcion: 'Auto de Admisión de la insolvencia' },
  { id: 'nombrar-liquidador', nombre: 'Nombrar Liquidador', descripcion: 'Nombrar al liquidador del proceso' },
  { id: 'inventario-avaluo', nombre: 'Inventario y Avalúo', descripcion: 'Diligenciar inventario y avalúo de bienes' },
  { id: 'audiencia-adjudicacion', nombre: 'Audiencia y Adjudicación', descripcion: 'Realizar audiencia y adjudicación de bienes' },
  { id: 'sentencia', nombre: 'Sentencia', descripcion: 'Sentencia de liquidación' },
  { id: 'notificar-cliente', nombre: 'Notificar al Cliente Terminación del Caso', descripcion: 'Notificar al cliente la terminación del caso' },
]

export default function TimelineLiquidacion() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<{ id: string; nombre: string; documento: string } | null>(null)
  const [selectedCaso, setSelectedCaso] = useState<{ id: string; numeroCaso: string } | null>(null)
  const [pasos, setPasos] = useState<Paso[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [noData, setNoData] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Búsqueda con debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        const clientes = data.results?.clientes || []
        const casos = data.results?.casos || []
        setSearchResults([...clientes, ...casos])
        setShowDropdown(true)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  async function handleSelectResult(result: SearchResult) {
    setShowDropdown(false)
    setSearchQuery(result.titulo)
    setIsLoading(true)
    setNoData(false)
    setSelectedCaso(null)

    if (result.tipo === 'cliente') {
      setSelectedClient({ id: result.id, nombre: result.titulo, documento: result.subtitulo })
      await loadByCliente(result.id)
    } else {
      setSelectedClient({ id: '', nombre: result.subtitulo, documento: '' })
      await loadByCaso(result.id)
    }

    setIsLoading(false)
  }

  async function loadByCliente(clienteId: string) {
    try {
      const res = await fetch(`/api/procesos-liquidacion/cliente/${clienteId}`)
      const casos: any[] = await res.json()

      const conProceso = casos.filter(c => c.procesosLiquidacion?.length > 0)

      if (conProceso.length === 0) {
        setPasos([])
        setNoData(true)
        return
      }

      const ultimo = conProceso[0]
      const proceso = ultimo.procesosLiquidacion[0]
      setSelectedCaso({ id: ultimo.id, numeroCaso: ultimo.numeroCaso })
      setPasos(proceso.pasos as Paso[])
    } catch {
      setPasos([])
      setNoData(true)
    }
  }

  async function loadByCaso(casoId: string) {
    try {
      const res = await fetch(`/api/procesos-liquidacion?casoId=${casoId}`)
      const procesos: any[] = await res.json()

      if (procesos.length === 0) {
        setPasos([])
        setNoData(true)
        return
      }

      setSelectedCaso({ id: casoId, numeroCaso: '' })
      setPasos(procesos[0].pasos as Paso[])
    } catch {
      setPasos([])
      setNoData(true)
    }
  }

  function mergePasos(savedPasos?: Paso[]) {
    if (!savedPasos || savedPasos.length === 0) {
      return PASOS_BASE.map(p => ({ ...p, completado: false, active: false }))
    }

    const savedMap = new Map(savedPasos.map(p => [p.id, p]))
    const lastCompleted = savedPasos.reduce((max, p, i) => p.completado ? i : max, -1)

    return PASOS_BASE.map((base, i) => {
      const saved = savedMap.get(base.id)
      const completado = saved?.completado ?? false
      const active = !completado && i === lastCompleted + 1
      return { ...base, completado, active }
    })
  }

  const displayedPasos = mergePasos(pasos)
  const hasData = displayedPasos.some(p => p.completado || p.active)

  return (
    <>
      <div className="card mb-4">
        <div className="card-header" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0'}}>
          <div className="d-flex align-items-center">
            <div className="p-2 rounded me-3" style={{backgroundColor: '#f0fdfa'}}>
              <Activity style={{color: '#0f766e'}} />
            </div>
            <div>
              <h5 className="card-title mb-0" style={{color: '#1e293b'}}>Proceso en Fracaso</h5>
              <p className="card-subtitle text-muted small mb-0">Etapas del proceso concursal</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Buscador */}
          <div className="position-relative mb-3" ref={dropdownRef}>
            <div className="input-group">
              <span className="input-group-text bg-white" style={{borderRight: 'none'}}>
                {isSearching ? <Loader2 size={16} className="spinner" /> : <Search size={16} style={{color: '#94a3b8'}} />}
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar cliente por nombre, cédula o correo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                style={{borderLeft: 'none', fontSize: '0.875rem'}}
              />
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{zIndex: 1000, maxHeight: '240px', overflowY: 'auto'}}>
                {searchResults.map((result, i) => (
                  <button
                    key={`${result.tipo}-${result.id}-${i}`}
                    className="d-flex align-items-center w-100 px-3 py-2 border-0 bg-transparent text-start"
                    style={{cursor: 'pointer', fontSize: '0.875rem'}}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="rounded-circle p-1 me-2 d-flex align-items-center justify-content-center" style={{
                      width: '28px', height: '28px',
                      backgroundColor: result.tipo === 'cliente' ? '#f0fdfa' : '#eff6ff'
                    }}>
                      {result.tipo === 'cliente' ? <User size={14} style={{color: '#0f766e'}} /> : <FileText size={14} style={{color: '#1e40af'}} />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium" style={{color: '#1e293b', lineHeight: 1.3}}>{result.titulo}</div>
                      <div className="small" style={{color: '#64748b'}}>{result.subtitulo} • {result.detalles}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm p-3 text-center" style={{zIndex: 1000}}>
                <small className="text-muted">No se encontraron clientes</small>
              </div>
            )}
          </div>

          {/* Info del cliente seleccionado */}
          {selectedClient && (
            <div className="rounded p-2 mb-3" style={{backgroundColor: '#f8fafc', border: '1px solid #e2e8f0'}}>
              <div className="d-flex align-items-center gap-2">
                <User size={14} style={{color: '#0f766e'}} />
                <span className="small fw-medium" style={{color: '#1e293b'}}>{selectedClient.nombre}</span>
                <span className="small text-muted">{selectedClient.documento}</span>
                {selectedCaso && (
                  <span className="small text-muted ms-auto">Caso: {selectedCaso.numeroCaso}</span>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 size={24} className="spinner mb-2" style={{color: '#94a3b8'}} />
              <div className="small text-muted">Cargando proceso de liquidación...</div>
            </div>
          ) : noData ? (
            <div className="text-center py-4">
              <Activity size={32} style={{color: '#cbd5e1'}} />
              <p className="small text-muted mt-2 mb-0">
                Este cliente no tiene un proceso de liquidación activo.
              </p>
            </div>
          ) : selectedClient && !hasData ? (
            <div className="text-center py-4">
              <Activity size={32} style={{color: '#cbd5e1'}} />
              <p className="small text-muted mt-2 mb-0">
                No hay etapas registradas en el proceso de liquidación.
              </p>
            </div>
          ) : selectedClient ? (
            <div className="timeline">
              {displayedPasos.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-marker ${item.completado ? 'bg-success' : item.active ? 'bg-info' : 'bg-light border'}`}></div>
                  <div className="timeline-content">
                    <h6 className="mb-1" style={{color: item.completado ? '#0f766e' : item.active ? '#0369a1' : '#94a3b8', fontSize: '0.875rem'}}>
                      {item.nombre}
                    </h6>
                    <small className="text-muted">{item.descripcion}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Search size={32} style={{color: '#cbd5e1'}} />
              <p className="small text-muted mt-2 mb-0">
                Busque un cliente para visualizar las etapas de su proceso de liquidación.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 2rem;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e9ecef;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 1.25rem;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        .timeline-marker {
          position: absolute;
          left: -2rem;
          top: 0.25rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        .timeline-marker.border {
          border-color: #cbd5e1;
        }
        .timeline-content {
          margin-left: 0.5rem;
        }
        :global(.spinner) {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
