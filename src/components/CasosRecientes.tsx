'use client'

import { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'

interface CasoReciente {
  id: string
  numeroCaso: string
  tipoInsolvencia: string
  // valorDeuda: string
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

export default function CasosRecientes({ casosIniciales }: CasosRecientesProps) {
  const [casos, setCasos] = useState<CasoReciente[]>(casosIniciales.slice(0, 5))
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(casosIniciales.length > 5)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Helper para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

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

  // Helper para obtener color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'success'
      case 'SUSPENDIDO': return 'warning'
      case 'CERRADO': return 'secondary'
      case 'ARCHIVADO': return 'dark'
      default: return 'primary'
    }
  }

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
      <div className="list-group-item p-4 text-center">
        <div className="text-muted">
          <Briefcase className="mb-2" size={32} />
          <p className="mb-0">No hay casos activos registrados</p>
          <small>Los casos aparecerán aquí una vez que los registres</small>
        </div>
      </div>
    )
  }

  return (
    <div className="casos-scroll-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {casos.map((caso) => {
        const clienteNombre = caso.cliente?.tipoPersona === 'JURIDICA' 
          ? caso.cliente.empresa || `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.trim()
          : `${caso.cliente?.nombre || ''} ${caso.cliente?.apellido || ''}`.trim()
        
        return (
          <div key={caso.id} className="list-group-item p-3 hover-bg-light cursor-pointer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className={`bg-${getEstadoColor(caso.estado)} rounded-circle me-3`} style={{width: '8px', height: '8px'}}></div>
                <div>
                  <p className="fw-semibold text-dark mb-1">
                    {caso.numeroCaso}
                  </p>
                  <div className="d-flex align-items-center small text-muted">
                    <span>{getTipoInsolvenciaLabel(caso.tipoInsolvencia)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatRelativeDate(new Date(caso.updatedAt))}</span>
                  </div>
                  {clienteNombre && (
                    <p className="small text-muted mb-0 mt-1">{clienteNombre}</p>
                  )}
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className={`badge bg-${getEstadoColor(caso.estado)}`}>
                  {caso.estado === 'ACTIVO' ? 'Activo' : 
                   caso.estado === 'SUSPENDIDO' ? 'Suspendido' :
                   caso.estado === 'CERRADO' ? 'Cerrado' : 'Archivado'}
                </span>
                {/* <div className="text-end">
                  <p className="small fw-medium text-dark mb-0">
                    {formatCurrency(Number(caso.valorDeuda))}
                  </p>
                  <p className="small text-muted mb-0">Valor deuda</p>
                </div> */}
              </div>
            </div>
          </div>
        )
      })}
      
      {loading && (
        <div className="list-group-item p-3 text-center">
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          <small className="text-muted">Cargando más casos...</small>
        </div>
      )}
      
      {!hasMore && casos.length > 0 && (
        <div className="list-group-item p-3 text-center bg-light">
          <small className="text-muted">
            {casos.length === casosIniciales.length 
              ? `Mostrando todos los ${casos.length} casos`
              : `Has visto todos los casos disponibles`
            }
          </small>
        </div>
      )}
      
      {hasMore && !loading && casos.length >= 5 && (
        <div className="list-group-item p-3 text-center bg-light">
          <button 
            className="btn btn-link btn-sm p-0" 
            onClick={loadMoreCases}
          >
            Cargar más casos ({casosIniciales.length - casos.length} restantes)
          </button>
        </div>
      )}
    </div>
  )
}