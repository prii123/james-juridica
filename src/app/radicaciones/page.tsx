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
import { EstadoRadicacion } from '@prisma/client'

interface Radicacion {
  id: string
  numero: string
  demandante: string
  demandado: string
  valor: number
  estado: EstadoRadicacion
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

export default function RadicacionesPage() {
  const [radicaciones, setRadicaciones] = useState<Radicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoRadicacion | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRadicaciones()
  }, [search, estadoFilter, currentPage])

  const fetchRadicaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (search) params.append('search', search)
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/radicaciones?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setRadicaciones(data.radicaciones)
        setTotalPages(data.pagination.pages)
      } else {
        console.error('Error al cargar radicaciones')
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

  const handleFilterChange = (value: EstadoRadicacion | '') => {
    setEstadoFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Radicaciones' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Radicaciones</h1>
          <p className="text-secondary mb-0">Gestiona todas las radicaciones del sistema</p>
        </div>
        <Link href="/radicaciones/nueva" className="btn btn-primary d-flex align-items-center gap-2">
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
                  onChange={(e) => handleFilterChange(e.target.value as EstadoRadicacion)}
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

      {/* Lista de radicaciones */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Listado de Radicaciones</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : radicaciones.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay radicaciones</h5>
              <p className="text-muted">
                {search || estadoFilter 
                  ? 'No se encontraron radicaciones con los criterios de búsqueda.'
                  : 'Aún no se han creado radicaciones en el sistema.'
                }
              </p>
              <Link href="/radicaciones/nueva" className="btn btn-primary">
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
                    <th>Estado</th>
                    <th>Fecha Solicitud</th>
                    <th>Días</th>
                    <th>Asesoría Origen</th>
                    <th>Asesor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {radicaciones.map((radicacion) => {
                    const estadoConfig = ESTADO_CONFIG[radicacion.estado]
                    const IconoEstado = estadoConfig.icon
                    const diasTranscurridos = calculateDaysElapsed(radicacion.fechaSolicitud)
                    const isOverdue = diasTranscurridos > 10

                    return (
                      <tr key={radicacion.id} className={isOverdue ? 'table-danger' : ''}>
                        <td>
                          <Link 
                            href={`/radicaciones/${radicacion.id}`}
                            className="text-decoration-none fw-semibold"
                          >
                            {radicacion.numero}
                          </Link>
                        </td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">{radicacion.demandante}</div>
                            <div className="text-muted">vs {radicacion.demandado}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1 w-fit`}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            <div>{formatDate(radicacion.fechaSolicitud)}</div>
                            {radicacion.fechaAudiencia && (
                              <div className="text-muted">
                                Audiencia: {formatDate(radicacion.fechaAudiencia)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small text-center">
                            <div className={`fw-semibold ${isOverdue ? 'text-danger d-flex align-items-center gap-1 justify-content-center' : 'text-primary'}`}>
                              {isOverdue && <AlertCircle size={14} />}
                              {diasTranscurridos} días
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <Link 
                              href={`/asesorias/${radicacion.asesoria.id}`}
                              className="text-decoration-none"
                            >
                              {radicacion.asesoria.tema}
                            </Link>
                            <div className="text-muted">
                              Cliente: {radicacion.asesoria.lead.nombre}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">
                              {radicacion.asesoria.asesor.nombre} {radicacion.asesoria.asesor.apellido}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Link 
                            href={`/radicaciones/${radicacion.id}`}
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