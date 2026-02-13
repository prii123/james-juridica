'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  Scale, 
  Plus, 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock,
  User,
  Phone,
  Video,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria, ResultadoAsesoria } from '@prisma/client'

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria  
  fecha: Date
  duracion?: number | null
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string | null
  notas?: string | null
  valor?: number | null
  resultado?: ResultadoAsesoria | null
  lead: {
    id: string
    nombre: string
    email: string
    telefono: string
  }
  asesor: {
    id: string
    nombre: string
    apellido: string
  }
  createdAt: Date
}

interface AsesoriaFilters {
  estado?: EstadoAsesoria
  tipo?: TipoAsesoria
  modalidad?: ModalidadAsesoria
  asesorId?: string
  search?: string
  fechaInicio?: string
  fechaFin?: string
}

export default function AsesoriaPage() {
  const [asesorias, setAsesorias] = useState<Asesoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AsesoriaFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    realizadas: 0,
    canceladas: 0,
    pendientesHoy: 0
  })

  useEffect(() => {
    fetchAsesorias()
  }, [filters])

  const fetchAsesorias = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      
      if (filters.estado) queryParams.append('estado', filters.estado)
      if (filters.tipo) queryParams.append('tipo', filters.tipo)
      if (filters.modalidad) queryParams.append('modalidad', filters.modalidad)
      if (filters.asesorId) queryParams.append('asesorId', filters.asesorId)
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin)
      
      const response = await fetch(`/api/asesorias?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setAsesorias(data.asesorias || data)
        
        // Calcular estadísticas
        const total = data.asesorias?.length || data.length || 0
        const programadas = (data.asesorias || data).filter((a: Asesoria) => a.estado === 'PROGRAMADA').length
        const realizadas = (data.asesorias || data).filter((a: Asesoria) => a.estado === 'REALIZADA').length
        const canceladas = (data.asesorias || data).filter((a: Asesoria) => a.estado === 'CANCELADA').length
        
        const hoy = new Date().toDateString()
        const pendientesHoy = (data.asesorias || data).filter((a: Asesoria) => 
          new Date(a.fecha).toDateString() === hoy && a.estado === 'PROGRAMADA'
        ).length
        
        setStats({ total, programadas, realizadas, canceladas, pendientesHoy })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar las asesorías')
        setAsesorias([])
      }
    } catch (error) {
      console.error('Error al cargar asesorías:', error)
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setAsesorias([])
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadgeClass = (estado: EstadoAsesoria) => {
    switch (estado) {
      case 'PROGRAMADA': return 'badge bg-warning'
      case 'REALIZADA': return 'badge bg-success'  
      case 'CANCELADA': return 'badge bg-danger'
      case 'REPROGRAMADA': return 'badge bg-info'
      default: return 'badge bg-secondary'
    }
  }

  const getTipoText = (tipo: TipoAsesoria) => {
    switch (tipo) {
      case 'INICIAL': return 'Inicial'
      case 'SEGUIMIENTO': return 'Seguimiento'
      case 'ESPECIALIZADA': return 'Especializada'
      default: return tipo
    }
  }

  const getModalidadIcon = (modalidad: ModalidadAsesoria) => {
    switch (modalidad) {
      case 'PRESENCIAL': return <Users size={14} />
      case 'VIRTUAL': return <Video size={14} />
      case 'TELEFONICA': return <Phone size={14} />
      default: return <Users size={14} />
    }
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Asesorías' }
        ]} 
      />
      
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h2 fw-bold text-dark mb-2">Asesorías</h1>
            <p className="text-secondary mb-0">Gestión de asesorías y consultas jurídicas</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link href="/asesorias/nueva" className="btn btn-primary d-flex align-items-center gap-2">
              <Plus size={16} />
              Nueva Asesoría
            </Link>
            <Link href="/asesorias/calendario" className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <Calendar size={16} />
              Calendario
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{stats.total}</h4>
                    <small>Total Asesorías</small>
                  </div>
                  <Scale size={32} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{stats.programadas}</h4>
                    <small>Programadas</small>
                  </div>
                  <Clock size={32} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{stats.realizadas}</h4>
                    <small>Realizadas</small>
                  </div>
                  <CheckCircle size={32} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{stats.pendientesHoy}</h4>
                    <small>Pendientes Hoy</small>
                  </div>
                  <AlertCircle size={32} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="card-body p-3">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por tema, lead o asesor..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button 
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filtros
                </button>
              </div>
            </div>
            
            {showFilters && (
              <div className="row mt-3">
                <div className="col-md-3">
                  <select 
                    className="form-select"
                    value={filters.estado || ''}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value as EstadoAsesoria || undefined })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="PROGRAMADA">Programada</option>
                    <option value="REALIZADA">Realizada</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="REPROGRAMADA">Reprogramada</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select"
                    value={filters.tipo || ''}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value as TipoAsesoria || undefined })}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="INICIAL">Inicial</option>
                    <option value="SEGUIMIENTO">Seguimiento</option>
                    <option value="ESPECIALIZADA">Especializada</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select"
                    value={filters.modalidad || ''}
                    onChange={(e) => setFilters({ ...filters, modalidad: e.target.value as ModalidadAsesoria || undefined })}
                  >
                    <option value="">Todas las modalidades</option>
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="TELEFONICA">Telefónica</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-danger w-100"
                    onClick={() => setFilters({})}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Asesorías */}
      <div className="card">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Lista de Asesorías</h5>
            <span className="badge bg-primary">{asesorias.length} asesorías</span>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <div className="alert alert-danger mx-4" role="alert">
                <h6 className="alert-heading">Error al cargar asesorías</h6>
                {error}
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setError(null)
                  fetchAsesorias()
                }}
              >
                Reintentar
              </button>
            </div>
          ) : asesorias.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <Scale size={48} className="text-muted" />
              </div>
              <h5>No hay asesorías</h5>
              <p className="text-muted">No se encontraron asesorías que coincidan con los filtros.</p>
              <Link href="/asesorias/nueva" className="btn btn-primary">
                Crear primera asesoría
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tema</th>
                    <th>Lead</th>
                    <th>Asesor</th>
                    <th>Tipo</th>
                    <th>Modalidad</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asesorias.map((asesoria) => (
                    <tr key={asesoria.id}>
                      <td>
                        <div className="fw-semibold">{asesoria.tema}</div>
                        {asesoria.descripcion && (
                          <small className="text-muted">{asesoria.descripcion.substring(0, 50)}...</small>
                        )}
                      </td>
                      <td>
                        <Link href={`/leads/${asesoria.lead.id}`} className="text-decoration-none">
                          {asesoria.lead.nombre}
                        </Link>
                      </td>
                      <td>{asesoria.asesor.nombre} {asesoria.asesor.apellido}</td>
                      <td>{getTipoText(asesoria.tipo)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          {getModalidadIcon(asesoria.modalidad)}
                          <small>{asesoria.modalidad}</small>
                        </div>
                      </td>
                      <td>
                        <small>
                          {new Date(asesoria.fecha).toLocaleDateString()}
                          <br />
                          {new Date(asesoria.fecha).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <span className={getEstadoBadgeClass(asesoria.estado)}>
                          {asesoria.estado}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link 
                            href={`/asesorias/${asesoria.id}`}
                            className="btn btn-outline-primary btn-sm"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </Link>
                          {/* <Link 
                            href={`/asesorias/${asesoria.id}/editar`}
                            className="btn btn-outline-secondary btn-sm"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </Link> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}