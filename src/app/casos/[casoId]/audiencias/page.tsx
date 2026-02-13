'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Filter,
  Video
} from 'lucide-react'

interface Audiencia {
  id: string
  tipo: string
  titulo: string
  descripcion?: string
  fechaAudiencia: string
  horaInicio: string
  horaFin?: string
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'REPROGRAMADA'
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTA'
  lugar?: string
  enlaceVirtual?: string
  juez?: string
  observaciones?: string
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
  asistentes?: Array<{
    id: string
    nombre: string
    rol: string
    confirmo: boolean
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
  PROGRAMADA: {
    color: 'primary',
    icon: Calendar,
    label: 'Programada'
  },
  EN_CURSO: {
    color: 'warning',
    icon: Clock,
    label: 'En Curso'
  },
  COMPLETADA: {
    color: 'success',
    icon: CheckCircle,
    label: 'Completada'
  },
  CANCELADA: {
    color: 'danger',
    icon: XCircle,
    label: 'Cancelada'
  },
  REPROGRAMADA: {
    color: 'info',
    icon: AlertTriangle,
    label: 'Reprogramada'
  }
}

const MODALIDAD_CONFIG = {
  PRESENCIAL: {
    color: 'secondary',
    icon: MapPin,
    label: 'Presencial'
  },
  VIRTUAL: {
    color: 'info',
    icon: Video,
    label: 'Virtual'
  },
  MIXTA: {
    color: 'primary',
    icon: Users,
    label: 'Mixta'
  }
}

const TIPO_AUDIENCIAS = {
  'PRIMERA_INSTANCIA': 'Primera Instancia',
  'CONCILIACION': 'Conciliación',
  'CALIFICACION': 'Calificación',
  'LIQUIDACION': 'Liquidación',
  'REORGANIZACION': 'Reorganización',
  'OBJECIONES': 'Objeciones',
  'APROBACION_ACUERDO': 'Aprobación de Acuerdo',
  'CADUCIDAD': 'Caducidad',
  'OTROS': 'Otros'
}

export default function AudienciasPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string
  
  const [caso, setCaso] = useState<Caso | null>(null)
  const [audiencias, setAudiencias] = useState<Audiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')

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

      // Obtener audiencias (API endpoint que necesitamos crear)
      const audienciasResponse = await fetch(`/api/casos/${casoId}/audiencias`)
      if (audienciasResponse.ok) {
        const audienciasData = await audienciasResponse.json()
        setAudiencias(audienciasData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setAudiencias([])
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5) // HH:MM
  }

  const isUpcoming = (fechaAudiencia: string, horaInicio: string) => {
    const audienciaDateTime = new Date(`${fechaAudiencia}T${horaInicio}`)
    return audienciaDateTime > new Date()
  }

  const getDaysUntilAudiencia = (fechaAudiencia: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const audienciaDate = new Date(fechaAudiencia)
    audienciaDate.setHours(0, 0, 0, 0)
    const diffTime = audienciaDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const audienciasFiltradas = audiencias.filter(audiencia => {
    const matchEstado = !filtroEstado || audiencia.estado === filtroEstado
    const matchTipo = !filtroTipo || audiencia.tipo === filtroTipo
    const matchModalidad = !filtroModalidad || audiencia.modalidad === filtroModalidad
    return matchEstado && matchTipo && matchModalidad
  })

  // Ordenar por fecha de audiencia
  const audienciasOrdenadas = [...audienciasFiltradas].sort((a, b) => {
    const dateA = new Date(`${a.fechaAudiencia}T${a.horaInicio}`)
    const dateB = new Date(`${b.fechaAudiencia}T${b.horaInicio}`)
    return dateA.getTime() - dateB.getTime()
  })

  const estadisticas = {
    total: audiencias.length,
    programadas: audiencias.filter(a => a.estado === 'PROGRAMADA').length,
    completadas: audiencias.filter(a => a.estado === 'COMPLETADA').length,
    canceladas: audiencias.filter(a => a.estado === 'CANCELADA').length,
    proximas: audiencias.filter(a => 
      a.estado === 'PROGRAMADA' && 
      getDaysUntilAudiencia(a.fechaAudiencia) <= 7
    ).length
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
          { label: 'Audiencias' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/casos/${casoId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">Audiencias</h1>
            <p className="text-secondary mb-0">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>
        
        <Link
          href={`/casos/${casoId}/audiencias/nueva`}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Plus size={16} />
          Nueva Audiencia
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-2 col-sm-6">
          <div className="card bg-light text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-dark">{estadisticas.total}</div>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-primary">{estadisticas.programadas}</div>
              <small className="text-muted">Programadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-warning">{estadisticas.proximas}</div>
              <small className="text-muted">Próximas (7 días)</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-success">{estadisticas.completadas}</div>
              <small className="text-muted">Completadas</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-danger bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-danger">{estadisticas.canceladas}</div>
              <small className="text-muted">Canceladas</small>
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
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="REPROGRAMADA">Reprogramada</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <Calendar size={14} className="me-1" />
                Filtrar por Tipo
              </label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_AUDIENCIAS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <Video size={14} className="me-1" />
                Modalidad
              </label>
              <select 
                className="form-select"
                value={filtroModalidad}
                onChange={(e) => setFiltroModalidad(e.target.value)}
              >
                <option value="">Todas las modalidades</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="MIXTA">Mixta</option>
              </select>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFiltroEstado('')
                  setFiltroTipo('')
                  setFiltroModalidad('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Audiencias */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Audiencias ({audienciasOrdenadas.length})
          </h5>
        </div>
        <div className="card-body">
          {audienciasOrdenadas.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay audiencias</h5>
              <p className="text-secondary">
                {audiencias.length === 0 
                  ? 'Aún no se han programado audiencias para este caso.'
                  : 'No se encontraron audiencias con los filtros seleccionados.'
                }
              </p>
            </div>
          ) : (
            <div className="row">
              {audienciasOrdenadas.map((audiencia) => {
                const estadoConfig = ESTADO_CONFIG[audiencia.estado] || ESTADO_CONFIG.PROGRAMADA
                const modalidadConfig = MODALIDAD_CONFIG[audiencia.modalidad] || MODALIDAD_CONFIG.PRESENCIAL
                const IconoEstado = estadoConfig.icon
                const IconoModalidad = modalidadConfig.icon
                const diasHasta = getDaysUntilAudiencia(audiencia.fechaAudiencia)
                const esProxima = audiencia.estado === 'PROGRAMADA' && diasHasta <= 7 && diasHasta >= 0
                const esHoy = diasHasta === 0
                
                return (
                  <div key={audiencia.id} className="col-md-6 col-lg-4 mb-3">
                    <div className={`card h-100 ${esHoy ? 'border-warning shadow-sm' : ''}`}>
                      {esHoy && (
                        <div className="card-header bg-warning text-dark py-1 small text-center fw-bold">
                          AUDIENCIA HOY
                        </div>
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-light text-dark">
                            {TIPO_AUDIENCIAS[audiencia.tipo as keyof typeof TIPO_AUDIENCIAS] || audiencia.tipo}
                          </span>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </div>
                        
                        <h6 className="card-title mb-2">{audiencia.titulo}</h6>
                        
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Calendar size={14} className="text-muted" />
                          <span className="small">{formatDate(audiencia.fechaAudiencia)}</span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Clock size={14} className="text-muted" />
                          <span className="small">
                            {formatTime(audiencia.horaInicio)}
                            {audiencia.horaFin && ` - ${formatTime(audiencia.horaFin)}`}
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <IconoModalidad size={14} className="text-muted" />
                          <span className="small">{modalidadConfig.label}</span>
                          {audiencia.modalidad === 'PRESENCIAL' && audiencia.lugar && (
                            <small className="text-muted">• {audiencia.lugar}</small>
                          )}
                        </div>
                        
                        {audiencia.estado === 'PROGRAMADA' && (
                          <div className="mb-3">
                            {diasHasta < 0 ? (
                              <div className="text-danger small">
                                <AlertTriangle size={12} className="me-1" />
                                Vencida hace {Math.abs(diasHasta)} días
                              </div>
                            ) : diasHasta === 0 ? (
                              <div className="text-warning fw-bold small">
                                <Clock size={12} className="me-1" />
                                Hoy
                              </div>
                            ) : diasHasta <= 7 ? (
                              <div className="text-warning small">
                                <Clock size={12} className="me-1" />
                                En {diasHasta} días
                              </div>
                            ) : (
                              <div className="text-muted small">
                                En {diasHasta} días
                              </div>
                            )}
                          </div>
                        )}
                        
                        {audiencia.juez && (
                          <div className="mb-2">
                            <small className="text-muted">
                              <strong>Juez:</strong> {audiencia.juez}
                            </small>
                          </div>
                        )}
                        
                        {audiencia.asistentes && audiencia.asistentes.length > 0 && (
                          <div className="mb-2">
                            <small className="text-muted">
                              <Users size={12} className="me-1" />
                              {audiencia.asistentes.length} asistentes
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="card-footer bg-transparent">
                        <div className="btn-group w-100" role="group">
                          <Link
                            href={`/casos/${casoId}/audiencias/${audiencia.id}`}
                            className="btn btn-outline-primary btn-sm"
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/casos/${casoId}/audiencias/${audiencia.id}/editar`}
                            className="btn btn-outline-secondary btn-sm"
                            title="Editar"
                          >
                            <Edit3 size={14} />
                          </Link>
                          {audiencia.modalidad === 'VIRTUAL' && audiencia.enlaceVirtual && (
                            <a
                              href={audiencia.enlaceVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-info btn-sm"
                              title="Unirse a videollamada"
                            >
                              <Video size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}