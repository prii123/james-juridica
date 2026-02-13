'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  DollarSign,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  Archive,
  Target,
  Flag,
  AlertCircle,
  Play,
  Eye
} from 'lucide-react'
import { EstadoCaso, TipoInsolvencia, Prioridad } from '@prisma/client'

interface Caso {
  id: string
  numeroCaso: string
  tipoInsolvencia: TipoInsolvencia
  estado: EstadoCaso
  prioridad: Prioridad
  valorDeuda: number
  fechaInicio: string
  fechaCierre?: string
  observaciones?: string
  createdAt: string
  updatedAt: string
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email: string
    telefono: string
    documento: string
    tipoPersona: string
  }
  responsable: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  creadoPor: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  documentos?: Array<{
    id: string
    nombre: string
    tipo: string
    fechaCreacion: string
  }>
  actuaciones?: Array<{
    id: string
    tipo: string
    titulo: string
    estado: string
    fechaVencimiento?: string
  }>
  audiencias?: Array<{
    id: string
    tipo: string
    fecha: string
    estado: string
  }>
}

const ESTADO_CONFIG = {
  ACTIVO: {
    color: 'success',
    icon: Play,
    label: 'Activo'
  },
  CERRADO: {
    color: 'secondary', 
    icon: CheckCircle,
    label: 'Cerrado'
  },
  SUSPENDIDO: {
    color: 'warning',
    icon: Pause,
    label: 'Suspendido'
  },
  ARCHIVADO: {
    color: 'dark',
    icon: Archive,
    label: 'Archivado'
  }
}

const PRIORIDAD_CONFIG = {
  BAJA: {
    color: 'info',
    icon: Target,
    label: 'Baja'
  },
  MEDIA: {
    color: 'primary',
    icon: Target,
    label: 'Media'  
  },
  ALTA: {
    color: 'warning',
    icon: Flag,
    label: 'Alta'
  },
  CRITICA: {
    color: 'danger',
    icon: AlertTriangle,
    label: 'Crítica'
  }
}

const TIPO_INSOLVENCIA_LABELS = {
  REORGANIZACION: 'Reorganización',
  LIQUIDACION_JUDICIAL: 'Liquidación Judicial',
  INSOLVENCIA_PERSONA_NATURAL: 'Insolvencia Persona Natural',
  ACUERDO_REORGANIZACION: 'Acuerdo de Reorganización'
}

export default function CasoDetailPage({ params }: { params: { casoId: string } }) {
  const router = useRouter()
  const [caso, setCaso] = useState<Caso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchCaso()
  }, [])

  const fetchCaso = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/casos/${params.casoId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCaso(data)
      } else {
        setError('No se pudo cargar el caso')
      }
    } catch (error) {
      console.error('Error al cargar caso:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: EstadoCaso) => {
    if (!caso) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/casos/${params.casoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      })

      if (response.ok) {
        const updatedCaso = await response.json()
        setCaso(updatedCaso)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const calculateDaysActive = (fechaInicio: string, fechaCierre?: string) => {
    const inicio = new Date(fechaInicio)
    const fin = fechaCierre ? new Date(fechaCierre) : new Date()
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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

  const estadoConfig = ESTADO_CONFIG[caso.estado] || {
    color: 'secondary',
    icon: AlertCircle,
    label: caso.estado
  }
  const prioridadConfig = PRIORIDAD_CONFIG[caso.prioridad] || {
    color: 'secondary',
    icon: Target,
    label: caso.prioridad
  }
  
  const IconoEstado = estadoConfig.icon
  const IconoPrioridad = prioridadConfig.icon
  const diasActivo = calculateDaysActive(caso.fechaInicio, caso.fechaCierre)

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/casos" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0">{caso.numeroCaso}</h1>
            <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </span>
            <span className={`badge bg-${prioridadConfig.color} d-flex align-items-center gap-1`}>
              <IconoPrioridad size={12} />
              {prioridadConfig.label}
            </span>
          </div>
          <p className="text-secondary mb-0">
            {TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]} • Cliente: {caso.cliente.nombre} {caso.cliente.apellido}
          </p>
        </div>
        <Link 
          href={`/casos/${params.casoId}/editar`}
          className="btn btn-outline-primary d-flex align-items-center gap-2"
        >
          <Edit3 size={16} />
          Editar
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Información Principal */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Detalles del Caso</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Tipo de Insolvencia</h6>
                  <div className="mb-3">
                    <span className="badge bg-info text-white">
                      {TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]}
                    </span>
                  </div>
                  
                  <h6 className="text-muted mb-1">Valor de la Deuda</h6>
                  <div className="h4 text-danger mb-3">
                    {formatCurrency(caso.valorDeuda)}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Fecha de Inicio</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Calendar size={16} />
                    <span>{formatDate(caso.fechaInicio)}</span>
                    <small className="text-muted">({diasActivo} días)</small>
                  </div>

                  {caso.fechaCierre && (
                    <>
                      <h6 className="text-muted mb-1">Fecha de Cierre</h6>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Calendar size={16} />
                        <span>{formatDate(caso.fechaCierre)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {caso.observaciones && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Observaciones</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{caso.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información del Cliente</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-start gap-3">
                    <User size={20} className="text-primary mt-1" />
                    <div>
                      <h6 className="fw-semibold mb-1">
                        {caso.cliente.nombre} {caso.cliente.apellido}
                      </h6>
                      <div className="small text-muted mb-1">
                        <strong>Documento:</strong> {caso.cliente.documento}
                      </div>
                      <div className="small text-muted mb-1">
                        <strong>Tipo:</strong> {caso.cliente.tipoPersona === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="small text-muted">
                    <div className="mb-1">
                      <strong>Email:</strong> {caso.cliente.email}
                    </div>
                    <div className="mb-1">
                      <strong>Teléfono:</strong> {caso.cliente.telefono}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href={`/clientes/${caso.cliente.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Perfil del Cliente
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progreso y Estadísticas */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Progreso del Caso</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="h4 text-primary">{caso.documentos?.length || 0}</div>
                  <small className="text-muted">Documentos</small>
                </div>
                <div className="col-md-3">
                  <div className="h4 text-success">{caso.actuaciones?.length || 0}</div>
                  <small className="text-muted">Actuaciones</small>
                </div>
                <div className="col-md-3">
                  <div className="h4 text-warning">{caso.audiencias?.length || 0}</div>
                  <small className="text-muted">Audiencias</small>
                </div>
                <div className="col-md-3">
                  <div className="h4 text-info">{diasActivo}</div>
                  <small className="text-muted">Días {caso.estado === 'ACTIVO' ? 'activo' : 'total'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Acciones */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {caso.estado === 'ACTIVO' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('CERRADO')}
                      className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                      disabled={updating}
                    >
                      <CheckCircle size={16} />
                      Cerrar Caso
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('SUSPENDIDO')}
                      className="btn btn-warning d-flex align-items-center justify-content-center gap-2"
                      disabled={updating}
                    >
                      <Pause size={16} />
                      Suspender
                    </button>
                  </>
                )}
                
                {caso.estado === 'SUSPENDIDO' && (
                  <button
                    onClick={() => handleStatusUpdate('ACTIVO')}
                    className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                    disabled={updating}
                  >
                    <Play size={16} />
                    Reactivar Caso
                  </button>
                )}

                <Link 
                  href={`/casos/${params.casoId}/editar`}
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar Caso
                </Link>
                
                <Link 
                  href={`/casos/${params.casoId}/documentos`}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                >
                  <FileText size={16} />
                  Ver Documentos
                </Link>

                <Link 
                  href={`/casos/${params.casoId}/actuaciones`}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                >
                  <FileText size={16} />
                  Actuaciones
                </Link>

                <Link 
                  href={`/casos/${params.casoId}/audiencias`}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                >
                  <Calendar size={16} />
                  Audiencias
                </Link>
              </div>
            </div>
          </div>

          {/* Información del Responsable */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Responsable del Caso</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} />
                <span className="fw-semibold">
                  {caso.responsable.nombre} {caso.responsable.apellido}
                </span>
              </div>
              <div className="small text-muted">
                {caso.responsable.email}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Timeline</h5>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker bg-primary"></div>
                  <div className="timeline-content">
                    <h6 className="mb-1">Caso Creado</h6>
                    <small className="text-muted">
                      {formatDate(caso.createdAt)} por {caso.creadoPor.nombre} {caso.creadoPor.apellido}
                    </small>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-marker bg-info"></div>
                  <div className="timeline-content">
                    <h6 className="mb-1">Proceso Iniciado</h6>
                    <small className="text-muted">
                      {formatDate(caso.fechaInicio)}
                    </small>
                  </div>
                </div>

                {caso.fechaCierre && (
                  <div className="timeline-item">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <h6 className="mb-1">Caso Cerrado</h6>
                      <small className="text-muted">
                        {formatDate(caso.fechaCierre)}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
          margin-bottom: 1.5rem;
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
        .timeline-content {
          margin-left: 0.5rem;
        }
      `}</style>
    </>
  )
}