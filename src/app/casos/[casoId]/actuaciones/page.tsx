'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Filter
} from 'lucide-react'

interface Actuacion {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  estado: 'PENDIENTE' | 'TRAMITE' | 'COMPLETADA' | 'VENCIDA'
  fechaCreacion: string
  fechaVencimiento?: string
  fechaCompletada?: string
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
  documentos?: Array<{
    id: string
    nombre: string
    url: string
  }>
}

interface Caso {
  id: string
  numeroCaso: string
  cliente: {
    nombre: string
    apellido?: string
  }
}

const ESTADO_CONFIG = {
  PENDIENTE: {
    color: 'warning',
    icon: Clock,
    label: 'Pendiente'
  },
  TRAMITE: {
    color: 'primary',
    icon: AlertTriangle,
    label: 'En Trámite'
  },
  COMPLETADA: {
    color: 'success',
    icon: CheckCircle,
    label: 'Completada'
  },
  VENCIDA: {
    color: 'danger',
    icon: XCircle,
    label: 'Vencida'
  }
}

const TIPO_ACTUACIONES = {
  'DERECHO_PETICION': 'Derecho de Petición',
  'LEVANTAMIENTO_EMBARGO': 'Levantamiento de Embargos',
  'RESPUESTA_JUZGADO': 'Respuesta del Juzgado',
  'MEMORIAL': 'Memorial',
  'PODER': 'Poder',
  'DEMANDA': 'Demanda',
  'CONTESTACION': 'Contestación',
  'ALEGATOS': 'Alegatos',
  'RECURSO': 'Recurso', 
  'OTROS': 'Otros'
}

export default function ActuacionesPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string
  
  const [caso, setCaso] = useState<Caso | null>(null)
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    fetchData()
  }, [casoId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener información del caso
      const casoResponse = await fetch(`/api/casos/${casoId}`)
      if (casoResponse.ok) {
        const casoData = await casoResponse.json()
        setCaso(casoData)
      }

      // Obtener actuaciones (API endpoint que necesitamos crear)
      const actuacionesResponse = await fetch(`/api/casos/${casoId}/actuaciones`)
      if (actuacionesResponse.ok) {
        const actuacionesData = await actuacionesResponse.json()
        setActuaciones(actuacionesData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setActuaciones([])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isVencida = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const getDaysUntilDeadline = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null
    const today = new Date()
    const deadline = new Date(fechaVencimiento)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const actuacionesFiltradas = actuaciones.filter(actuacion => {
    const matchEstado = !filtroEstado || actuacion.estado === filtroEstado
    const matchTipo = !filtroTipo || actuacion.tipo === filtroTipo
    return matchEstado && matchTipo
  })

  const estadisticas = {
    total: actuaciones.length,
    pendientes: actuaciones.filter(a => a.estado === 'PENDIENTE').length,
    tramite: actuaciones.filter(a => a.estado === 'TRAMITE').length,
    completadas: actuaciones.filter(a => a.estado === 'COMPLETADA').length,
    vencidas: actuaciones.filter(a => a.estado === 'VENCIDA').length
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Caso no encontrado'}
        </div>
        <Link href="/casos" className="btn btn-primary">
          Volver a Casos
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Actuaciones' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/casos/${casoId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">Actuaciones</h1>
            <p className="text-secondary mb-0">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Link
            href={`/casos/${casoId}/actuaciones/derecho-peticion/nuevo`}
            className="btn btn-outline-primary d-flex align-items-center gap-2"
          >
            <Plus size={16} />
            Derecho de Petición
          </Link>
          <Link
            href={`/casos/${casoId}/actuaciones/levantamiento-embargos/nuevo`}
            className="btn btn-outline-primary d-flex align-items-center gap-2"
          >
            <Plus size={16} />
            Levantamiento Embargos
          </Link>
          <div className="dropdown">
            <button
              className="btn btn-primary dropdown-toggle d-flex align-items-center gap-2"
              type="button"
              data-bs-toggle="dropdown"
            >
              <Plus size={16} />
              Nueva Actuación
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href={`/casos/${casoId}/actuaciones/memorial/nuevo`}>
                  Memorial
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href={`/casos/${casoId}/actuaciones/poder/nuevo`}>
                  Poder
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href={`/casos/${casoId}/actuaciones/demanda/nuevo`}>
                  Demanda
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href={`/casos/${casoId}/actuaciones/recurso/nuevo`}>
                  Recurso
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link className="dropdown-item" href={`/casos/${casoId}/actuaciones/general/nuevo`}>
                  Otra Actuación
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-2 col-sm-4 col-6">
          <div className="card bg-light text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-dark">{estadisticas.total}</div>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-4 col-6">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-warning">{estadisticas.pendientes}</div>
              <small className="text-muted">Pendientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-4 col-6">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-primary">{estadisticas.tramite}</div>
              <small className="text-muted">En Trámite</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-4 col-6">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-success">{estadisticas.completadas}</div>
              <small className="text-muted">Completadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-4 col-6">
          <div className="card bg-danger bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-danger">{estadisticas.vencidas}</div>
              <small className="text-muted">Vencidas</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                <Filter size={14} className="me-1" />
                Filtrar por Estado
              </label>
              <select 
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="TRAMITE">En Trámite</option>
                <option value="COMPLETADA">Completada</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <FileText size={14} className="me-1" />
                Filtrar por Tipo
              </label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_ACTUACIONES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFiltroEstado('')
                  setFiltroTipo('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Actuaciones */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Actuaciones ({actuacionesFiltradas.length})
          </h5>
        </div>
        <div className="card-body">
          {actuacionesFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay actuaciones</h5>
              <p className="text-secondary">
                {actuaciones.length === 0 
                  ? 'Aún no se han creado actuaciones para este caso.'
                  : 'No se encontraron actuaciones con los filtros seleccionados.'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Creada</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {actuacionesFiltradas.map((actuacion) => {
                    const estadoConfig = ESTADO_CONFIG[actuacion.estado] || ESTADO_CONFIG.PENDIENTE
                    const IconoEstado = estadoConfig.icon
                    const diasVencimiento = getDaysUntilDeadline(actuacion.fechaVencimiento)
                    const estaVencida = isVencida(actuacion.fechaVencimiento)
                    
                    return (
                      <tr key={actuacion.id}>
                        <td>
                          <span className="badge bg-light text-dark">
                            {TIPO_ACTUACIONES[actuacion.tipo as keyof typeof TIPO_ACTUACIONES] || actuacion.tipo}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium">{actuacion.titulo}</div>
                          {actuacion.descripcion && (
                            <small className="text-muted d-block">
                              {actuacion.descripcion.length > 50 
                                ? `${actuacion.descripcion.substring(0, 50)}...`
                                : actuacion.descripcion
                              }
                            </small>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`} style={{width: 'fit-content'}}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td>
                          <small>
                            {actuacion.responsable.nombre} {actuacion.responsable.apellido}
                          </small>
                        </td>
                        <td>
                          <small>{formatDate(actuacion.fechaCreacion)}</small>
                        </td>
                        <td>
                          {actuacion.fechaVencimiento ? (
                            <div>
                              <small className={estaVencida ? 'text-danger fw-bold' : 'text-muted'}>
                                {formatDate(actuacion.fechaVencimiento)}
                              </small>
                              {diasVencimiento !== null && (
                                <div>
                                  <small className={
                                    diasVencimiento < 0 ? 'text-danger' :
                                    diasVencimiento <= 5 ? 'text-warning' : 'text-muted'
                                  }>
                                    {diasVencimiento < 0 
                                      ? `Vencida hace ${Math.abs(diasVencimiento)} días`
                                      : diasVencimiento === 0
                                      ? 'Vence hoy'
                                      : `${diasVencimiento} días`
                                    }
                                  </small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/casos/${casoId}/actuaciones/${actuacion.id}`}
                              className="btn btn-outline-primary"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/casos/${casoId}/actuaciones/${actuacion.id}/editar`}
                              className="btn btn-outline-secondary"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}