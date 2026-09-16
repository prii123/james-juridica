'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CasoReciente {
  id: string
  numeroCaso: string
  tipoInsolvencia: string
  estado: string
  updatedAt: string
  cliente: {
    nombre: string
    apellido: string | null
    empresa: string | null
    tipoPersona: string
  } | null
}

interface CasosRecientesProps {
  casosIniciales: CasoReciente[]
}

const ESTADO_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  ACTIVO: { dot: 'bg-teal-600', badge: 'bg-teal-100 text-teal-800', label: 'Activo' },
  SUSPENDIDO: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'Suspendido' },
  CERRADO: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700', label: 'Cerrado' },
  ARCHIVADO: { dot: 'bg-slate-600', badge: 'bg-slate-200 text-slate-800', label: 'Archivado' },
}
const ESTADO_DEFAULT = { dot: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800', label: '' }

export default function CasosRecientes({ casosIniciales }: CasosRecientesProps) {
  const [casos, setCasos] = useState<CasoReciente[]>(casosIniciales.slice(0, 5))
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(casosIniciales.length > 5)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Helper para formatear fecha relativa
  const formatRelativeDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Hace menos de 1h'
    if (diffInHours < 24) return `Hace ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`

    return date.toLocaleDateString('es-CO')
  }

  // Helper para mapear tipo de insolvencia a texto legible
  const getTipoInsolvenciaLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'REORGANIZACION': 'Reorganización',
      'LIQUIDACION_JUDICIAL': 'Liquidación Judicial',
      'INSOLVENCIA_PERSONA_NATURAL': 'Insolvencia Personal',
      'ACUERDO_REORGANIZACION': 'Acuerdo de Reorganización'
    }
    return labels[tipo] || tipo
  }

  const getEstadoStyle = (estado: string) => ESTADO_STYLES[estado] || ESTADO_DEFAULT

  // Cargar más casos
  const loadMoreCases = async () => {
    if (loading || !hasMore) return

    setLoading(true)

    // Simular delay de carga
    await new Promise(resolve => setTimeout(resolve, 500))

    const startIndex = currentPage * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const newCases = casosIniciales.slice(startIndex, endIndex)

    if (newCases.length > 0) {
      setCasos(prev => [...prev, ...newCases])
      setCurrentPage(prev => prev + 1)

      // Verificar si hay más casos
      if (endIndex >= casosIniciales.length) {
        setHasMore(false)
      }
    } else {
      setHasMore(false)
    }

    setLoading(false)
  }

  // Detectar scroll cercano al final
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.casos-scroll-container')
      if (!scrollContainer) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer

      // Si está a 100px del final, cargar más
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreCases()
      }
    }

    const scrollContainer = document.querySelector('.casos-scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [loading, hasMore, currentPage])

  if (casos.length === 0) {
    return (
      <div className="p-4 text-center">
        <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
        <p className="mb-0 text-slate-500">No hay casos activos registrados</p>
        <small className="text-slate-400">Los casos aparecerán aquí una vez que los registres</small>
      </div>
    )
  }

  return (
    <div className="casos-scroll-container divide-y divide-slate-100" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {casos.map((caso) => {
        const clienteNombre = caso.cliente?.tipoPersona === 'JURIDICA'
          ? caso.cliente.empresa || `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.trim()
          : `${caso.cliente?.nombre || ''} ${caso.cliente?.apellido || ''}`.trim()
        const estilo = getEstadoStyle(caso.estado)

        return (
          <div key={caso.id} className="cursor-pointer p-3 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={cn('mr-3 h-2 w-2 rounded-full', estilo.dot)} />
                <div>
                  <p className="mb-1 font-semibold text-slate-800">
                    {caso.numeroCaso}
                  </p>
                  <div className="flex items-center text-sm text-slate-500">
                    <span>{getTipoInsolvenciaLabel(caso.tipoInsolvencia)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatRelativeDate(new Date(caso.updatedAt))}</span>
                  </div>
                  {clienteNombre && (
                    <p className="mb-0 mt-1 text-sm text-slate-500">{clienteNombre}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estilo.badge)}>
                  {estilo.label ||
                    (caso.estado === 'ACTIVO' ? 'Activo' :
                    caso.estado === 'SUSPENDIDO' ? 'Suspendido' :
                    caso.estado === 'CERRADO' ? 'Cerrado' : 'Archivado')}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 text-center">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <small className="text-slate-500">Cargando más casos...</small>
        </div>
      )}

      {!hasMore && casos.length > 0 && (
        <div className="bg-slate-50 p-3 text-center">
          <small className="text-slate-500">
            {casos.length === casosIniciales.length
              ? `Mostrando todos los ${casos.length} casos`
              : `Has visto todos los casos disponibles`
            }
          </small>
        </div>
      )}

      {hasMore && !loading && casos.length >= 5 && (
        <div className="bg-slate-50 p-3 text-center">
          <button
            className="text-sm text-blue-800 hover:underline"
            onClick={loadMoreCases}
          >
            Cargar más casos ({casosIniciales.length - casos.length} restantes)
          </button>
        </div>
      )}
    </div>
  )
}
