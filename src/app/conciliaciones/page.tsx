'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { EstadoConciliacion } from '@prisma/client'

interface Conciliacion {
  id: string
  numero: string
  demandante: string
  demandado: string
  valor: number
  estado: EstadoConciliacion
  fechaSolicitud: string
  fechaAudiencia?: string
  createdAt: string
  asesoria: {
    id: string
    tema: string
    lead: {
      id: string
      nombre: string
      email: string
    }
    asesor: {
      id: string
      nombre: string
      apellido: string
    }
  }
}

const ESTADO_CONFIG = {
  SOLICITADA: {
    color: 'warning',
    icon: Clock,
    label: 'Solicitada'
  },
  PROGRAMADA: {
    color: 'primary',
    icon: Calendar,
    label: 'Programada'
  },
  REALIZADA: {
    color: 'success', 
    icon: CheckCircle,
    label: 'Realizada'
  },
  CANCELADA: {
    color: 'danger',
    icon: XCircle,
    label: 'Cancelada'
  }
}

export default function ConciliacionesPage() {
  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoConciliacion | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchConciliaciones()
  }, [search, estadoFilter, currentPage])

  const fetchConciliaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (search) params.append('search', search)
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/conciliaciones?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setConciliaciones(data.conciliaciones)
        setTotalPages(data.pagination.pages)
      } else {
        console.error('Error al cargar conciliaciones')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const calculateDaysElapsed = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = now.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (value: EstadoConciliacion | '') => {
    setEstadoFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Conciliaciones' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Conciliaciones</h1>
          <p className="text-secondary mb-0">Gestiona todas las conciliaciones del sistema</p>
        </div>
        <Link href="/conciliaciones/nueva" className="btn btn-primary d-flex align-items-center gap-2">
          <Plus size={16} />
          Nueva Conciliación
        </Link>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por número, demandante o demandado..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text">
                  <Filter size={16} />
                </span>
                <select
                  className="form-select"
                  value={estadoFilter}
                  onChange={(e) => handleFilterChange(e.target.value as EstadoConciliacion)}
                >
                  <option value="">Todos los estados</option>
                  <option value="SOLICITADA">Solicitada</option>
                  <option value="PROGRAMADA">Programada</option>
                  <option value="REALIZADA">Realizada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de conciliaciones */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Listado de Conciliaciones</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : conciliaciones.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay conciliaciones</h5>
              <p className="text-muted">
                {search || estadoFilter 
                  ? 'No se encontraron conciliaciones con los criterios de búsqueda.'
                  : 'Aún no se han creado conciliaciones en el sistema.'
                }
              </p>
              <Link href="/conciliaciones/nueva" className="btn btn-primary">
                <Plus size={16} className="me-2" />
                Crear Primera Conciliación
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Partes</th>
                    <th>Valor</th>
                    <th>Estado</th>
                    <th>Fecha Solicitud</th>
                    <th>Días</th>
                    <th>Asesoría Origen</th>
                    <th>Asesor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conciliaciones.map((conciliacion) => {
                    const estadoConfig = ESTADO_CONFIG[conciliacion.estado]
                    const IconoEstado = estadoConfig.icon

                    return (
                      <tr key={conciliacion.id}>
                        <td>
                          <Link 
                            href={`/conciliaciones/${conciliacion.id}`}
                            className="text-decoration-none fw-semibold"
                          >
                            {conciliacion.numero}
                          </Link>
                        </td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">{conciliacion.demandante}</div>
                            <div className="text-muted">vs {conciliacion.demandado}</div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold text-success">
                            {formatCurrency(conciliacion.valor)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1 w-fit`}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            <div>{formatDate(conciliacion.fechaSolicitud)}</div>
                            {conciliacion.fechaAudiencia && (
                              <div className="text-muted">
                                Audiencia: {formatDate(conciliacion.fechaAudiencia)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small text-center">
                            <div className="fw-semibold text-primary">
                              {calculateDaysElapsed(conciliacion.fechaSolicitud)} días
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <Link 
                              href={`/asesorias/${conciliacion.asesoria.id}`}
                              className="text-decoration-none"
                            >
                              {conciliacion.asesoria.tema}
                            </Link>
                            <div className="text-muted">
                              Cliente: {conciliacion.asesoria.lead.nombre}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">
                              {conciliacion.asesoria.asesor.nombre} {conciliacion.asesoria.asesor.apellido}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Link 
                            href={`/conciliaciones/${conciliacion.id}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </li>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    )
                  })}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  )
}