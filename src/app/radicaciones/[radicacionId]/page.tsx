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
  AlertCircle,
  Eye
} from 'lucide-react'
import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'

interface Radicacion {
  id: string
  numero: string
  demandante: string
  demandado: string
  estado: EstadoRadicacion
  resultado?: ResultadoRadicacion
  fechaSolicitud: string
  fechaAudiencia?: string
  observaciones?: string
  createdAt: string
  updatedAt: string
  asesoria: {
    id: string
    tema: string
    fecha: string
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
      email: string
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

const RESULTADO_CONFIG = {
  ACUERDO_TOTAL: {
    color: 'success',
    label: 'Acuerdo Total'
  },
  ACUERDO_PARCIAL: {
    color: 'warning',
    label: 'Acuerdo Parcial'
  },
  SIN_ACUERDO: {
    color: 'danger',
    label: 'Sin Acuerdo'
  }
}

export default function RadicacionDetailPage({ params }: { params: { radicacionId: string } }) {
  const router = useRouter()
  const [radicacion, setRadicacion] = useState<Radicacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchRadicacion()
  }, [])

  const fetchRadicacion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/radicaciones/${params.radicacionId}`)
      
      if (response.ok) {
        const data = await response.json()
        setRadicacion(data)
      } else {
        setError('No se pudo cargar la conciliación')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: EstadoRadicacion) => {
    if (!radicacion) return
    
    try {
      setUpdating(true)
      setError('')
      setSuccessMessage('')
      
      const response = await fetch(`/api/radicaciones/${params.radicacionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          estado: newStatus,
          createCase: newStatus === 'REALIZADA' // Crear caso automáticamente cuando se acepta
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Resultado de actualización:', result)
        
        // Asegurar que tenemos la radicación actualizada
        const updatedRadicacion = result.radicacion || result
        console.log('Radicación actualizada:', updatedRadicacion)
        setRadicacion(updatedRadicacion)
        
        // Si se creó un caso, mostrar mensaje de éxito
        if (result.casoCreado) {
          setSuccessMessage(
            `✓ Radicación aceptada exitosamente. Se ha creado el caso ${result.casoCreado.numeroCaso}. Puedes visualizarlo en la sección de Casos Activos.`
          )
          setError('')
        }
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error || !radicacion) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Conciliación no encontrada'}
        </div>
        <Link href="/radicaciones" className="btn btn-primary">
          Volver a Radicaciones
        </Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[radicacion.estado] || {
    color: 'secondary',
    icon: AlertCircle,
    label: radicacion.estado
  }
  const IconoEstado = estadoConfig.icon
  const resultadoConfig = radicacion.resultado ? (RESULTADO_CONFIG[radicacion.resultado] || {
    color: 'secondary',
    label: radicacion.resultado
  }) : null

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Radicaciones', href: '/radicaciones' },
          { label: radicacion.numero }
        ]} 
      />

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
          <CheckCircle size={20} />
          <div className="flex-grow-1">{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
          <AlertCircle size={20} />
          <div className="flex-grow-1">{error}</div>
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/radicaciones" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0">{radicacion.numero}</h1>
            <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </span>
            {resultadoConfig && (
              <span className={`badge bg-${resultadoConfig.color}`}>
                {resultadoConfig.label}
              </span>
            )}
          </div>
          <p className="text-secondary mb-0">
            {radicacion.demandante} vs {radicacion.demandado}
          </p>
        </div>
        {/* <Link 
          href={`/radicaciones/${params.radicacionId}/editar`}
          className="btn btn-outline-primary d-flex align-items-center gap-2"
        >
          <Edit3 size={16} />
          Editar
        </Link> */}
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Información Principal */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Detalles de la Conciliación</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Partes</h6>
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <User size={16} />
                      <span className="fw-semibold">Insolvente:</span>
                      <span>{radicacion.demandante}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Building size={16} />
                      <span className="fw-semibold">Centro de Conciliación:</span>
                      <span>{radicacion.demandado}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Fecha de Solicitud</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Calendar size={16} />
                    <span>{formatDate(radicacion.fechaSolicitud)}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  {radicacion.fechaAudiencia && (
                    <>
                      <h6 className="text-muted mb-1">Fecha de Audiencia</h6>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Calendar size={16} />
                        <span>{formatDate(radicacion.fechaAudiencia)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {radicacion.observaciones && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Observaciones</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{radicacion.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asesoría Origen */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Asesoría de Origen</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start gap-3">
                <div className="flex-grow-1">
                  <h6 className="fw-semibold mb-1">{radicacion.asesoria.tema}</h6>
                  <p className="text-muted mb-2">
                    Realizada el {formatDate(radicacion.asesoria.fecha)}
                  </p>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <User size={14} />
                    <span>Cliente: {radicacion.asesoria.lead.nombre}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <User size={14} />
                    <span>
                      Asesor: {radicacion.asesoria.asesor.nombre} {radicacion.asesoria.asesor.apellido}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/asesorias/${radicacion.asesoria.id}`}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                >
                  <Eye size={14} />
                  Ver Asesoría
                </Link>
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
                <button
                  onClick={() => handleStatusUpdate('REALIZADA')}
                  className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                  disabled={updating || radicacion.estado === 'REALIZADA'}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Aceptada por Juzgado
                    </>
                  )}
                </button>
                
                <Link 
                  href={`/radicaciones/${params.radicacionId}/editar`}
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar Conciliación
                </Link>
                
                <Link 
                  href={`/leads/${radicacion.asesoria.lead.id}/archivos`}
                  className="btn btn-info d-flex align-items-center justify-content-center gap-2"
                >
                  <FileText size={16} />
                  Ver Archivos
                </Link>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información del Cliente</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} />
                <span className="fw-semibold">{radicacion.asesoria.lead.nombre}</span>
              </div>
              <div className="small text-muted mb-2">
                <div>{radicacion.asesoria.lead.email}</div>
                <div>{radicacion.asesoria.lead.telefono}</div>
              </div>
              <div className="mt-3">
                <Link 
                  href={`/leads/${radicacion.asesoria.lead.id}`}
                  className="btn btn-outline-primary btn-sm w-100"
                >
                  Ver Perfil del Cliente
                </Link>
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
                    <h6 className="mb-1">Conciliación Creada</h6>
                    <small className="text-muted">
                      {formatDate(radicacion.createdAt)}
                    </small>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-marker bg-info"></div>
                  <div className="timeline-content">
                    <h6 className="mb-1">Solicitud Presentada</h6>
                    <small className="text-muted">
                      {formatDate(radicacion.fechaSolicitud)}
                    </small>
                  </div>
                </div>

                {radicacion.fechaAudiencia && (
                  <div className="timeline-item">
                    <div className={`timeline-marker bg-${estadoConfig.color}`}></div>
                    <div className="timeline-content">
                      <h6 className="mb-1">Audiencia Programada</h6>
                      <small className="text-muted">
                        {formatDate(radicacion.fechaAudiencia)}
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
        .w-fit {
          width: fit-content !important;
        }
      `}</style>
    </>
  )
}