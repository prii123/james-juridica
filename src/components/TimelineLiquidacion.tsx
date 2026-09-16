'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Search, User, FileText, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

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
    <Card className="mb-4">
      <div className="rounded-t-xl border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3">
        <div className="flex items-center">
          <div className="mr-3 rounded-lg bg-teal-50 p-2">
            <Activity className="text-teal-700" />
          </div>
          <div>
            <h5 className="m-0 font-semibold text-slate-800">Proceso en Fracaso</h5>
            <p className="m-0 text-sm text-slate-500">Etapas del proceso concursal</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* Buscador */}
        <div className="relative mb-3" ref={dropdownRef}>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-slate-400">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              placeholder="Buscar cliente por nombre, cédula o correo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-[1000] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              {searchResults.map((result, i) => (
                <button
                  key={`${result.tipo}-${result.id}-${i}`}
                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className={cn(
                    'mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    result.tipo === 'cliente' ? 'bg-teal-50' : 'bg-blue-50'
                  )}>
                    {result.tipo === 'cliente' ? <User size={14} className="text-teal-700" /> : <FileText size={14} className="text-blue-800" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium leading-tight text-slate-800">{result.titulo}</div>
                    <div className="truncate text-xs text-slate-500">{result.subtitulo} • {result.detalles}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
              <small className="text-slate-500">No se encontraron clientes</small>
            </div>
          )}
        </div>

        {/* Info del cliente seleccionado */}
        {selectedClient && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-2">
              <User size={14} className="text-teal-700" />
              <span className="text-sm font-medium text-slate-800">{selectedClient.nombre}</span>
              <span className="text-sm text-slate-500">{selectedClient.documento}</span>
              {selectedCaso && (
                <span className="ml-auto text-sm text-slate-500">Caso: {selectedCaso.numeroCaso}</span>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="py-4 text-center">
            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-slate-400" />
            <div className="text-sm text-slate-500">Cargando proceso de liquidación...</div>
          </div>
        ) : noData ? (
          <div className="py-4 text-center">
            <Activity size={32} className="mx-auto text-slate-300" />
            <p className="mb-0 mt-2 text-sm text-slate-500">
              Este cliente no tiene un proceso de liquidación activo.
            </p>
          </div>
        ) : selectedClient && !hasData ? (
          <div className="py-4 text-center">
            <Activity size={32} className="mx-auto text-slate-300" />
            <p className="mb-0 mt-2 text-sm text-slate-500">
              No hay etapas registradas en el proceso de liquidación.
            </p>
          </div>
        ) : selectedClient ? (
          <div className="relative pl-8">
            <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-slate-200" />
            {displayedPasos.map((item, i) => (
              <div key={i} className={cn('relative', i < displayedPasos.length - 1 && 'mb-5')}>
                <div
                  className={cn(
                    'absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white',
                    item.completado ? 'bg-teal-600' : item.active ? 'bg-sky-600' : 'border-slate-300 bg-slate-100'
                  )}
                />
                <div className="ml-2">
                  <h6
                    className={cn(
                      'mb-1 text-sm font-medium',
                      item.completado ? 'text-teal-700' : item.active ? 'text-sky-700' : 'text-slate-400'
                    )}
                  >
                    {item.nombre}
                  </h6>
                  <small className="text-slate-500">{item.descripcion}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <Search size={32} className="mx-auto text-slate-300" />
            <p className="mb-0 mt-2 text-sm text-slate-500">
              Busque un cliente para visualizar las etapas de su proceso de liquidación.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
