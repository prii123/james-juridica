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
import { EstadoConciliacion, ResultadoConciliacion } from '@prisma/client'

interface Conciliacion {
  id: string
  numero: string
  demandante: string
  demandado: string
  valor: number
  estado: EstadoConciliacion
  resultado?: ResultadoConciliacion
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

export default function ConciliacionDetailPage({ params }: { params: { conciliacionId: string } }) {
  const router = useRouter()
  const [conciliacion, setConciliacion] = useState<Conciliacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchConciliacion()
  }, [])

  const fetchConciliacion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conciliaciones/${params.conciliacionId}`)
      
      if (response.ok) {
        const data = await response.json()
        setConciliacion(data)
      } else {
        setError('No se pudo cargar la conciliación')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: EstadoConciliacion) => {
    if (!conciliacion) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/conciliaciones/${params.conciliacionId}`, {
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
        
        // Asegurar que tenemos la conciliación actualizada
        const updatedConciliacion = result.conciliacion || result
        console.log('Conciliación actualizada:', updatedConciliacion)
        setConciliacion(updatedConciliacion)
        
        // Si se creó un caso, redirigir a él
        if (result.casoCreado) {
          // Mostrar mensaje de éxito
          const confirmRedirect = confirm(
            `¡Conciliación aceptada exitosamente!\n\nSe ha creado automáticamente el caso: ${result.casoCreado.numeroCaso}\n\n¿Deseas ir al caso ahora?`
          )
          
          if (confirmRedirect) {
            router.push(`/casos/${result.casoCreado.id}`)
          }
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

  if (error || !conciliacion) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Conciliación no encontrada'}
        </div>
        <Link href="/conciliaciones" className="btn btn-primary">
          Volver a Conciliaciones
        </Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[conciliacion.estado] || {
    color: 'secondary',
    icon: AlertCircle,
    label: conciliacion.estado
  }
  const IconoEstado = estadoConfig.icon
  const resultadoConfig = conciliacion.resultado ? (RESULTADO_CONFIG[conciliacion.resultado] || {
    color: 'secondary',
    label: conciliacion.resultado
  }) : null

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Conciliaciones', href: '/conciliaciones' },
          { label: conciliacion.numero }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/conciliaciones" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0">{conciliacion.numero}</h1>
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
            {conciliacion.demandante} vs {conciliacion.demandado}
          </p>
        </div>
        {/* <Link 
          href={`/conciliaciones/${params.conciliacionId}/editar`}
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
                      <span className="fw-semibold">Demandante:</span>
                      <span>{conciliacion.demandante}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Building size={16} />
                      <span className="fw-semibold">Demandado:</span>
                      <span>{conciliacion.demandado}</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Valor</h6>
                  <div className="h4 text-success mb-3">
                    {formatCurrency(conciliacion.valor)}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Fecha de Solicitud</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Calendar size={16} />
                    <span>{formatDate(conciliacion.fechaSolicitud)}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  {conciliacion.fechaAudiencia && (
                    <>
                      <h6 className="text-muted mb-1">Fecha de Audiencia</h6>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <Calendar size={16} />
                        <span>{formatDate(conciliacion.fechaAudiencia)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {conciliacion.observaciones && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Observaciones</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{conciliacion.observaciones}</p>
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
                  <h6 className="fw-semibold mb-1">{conciliacion.asesoria.tema}</h6>
                  <p className="text-muted mb-2">
                    Realizada el {formatDate(conciliacion.asesoria.fecha)}
                  </p>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <User size={14} />
                    <span>Cliente: {conciliacion.asesoria.lead.nombre}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <User size={14} />
                    <span>
                      Asesor: {conciliacion.asesoria.asesor.nombre} {conciliacion.asesoria.asesor.apellido}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/asesorias/${conciliacion.asesoria.id}`}
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
                  disabled={updating || conciliacion.estado === 'REALIZADA'}
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
                  href={`/conciliaciones/${params.conciliacionId}/editar`}
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar Conciliación
                </Link>
                
                <Link 
                  href={`/leads/${conciliacion.asesoria.lead.id}/archivos`}
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
                <span className="fw-semibold">{conciliacion.asesoria.lead.nombre}</span>
              </div>
              <div className="small text-muted mb-2">
                <div>{conciliacion.asesoria.lead.email}</div>
                <div>{conciliacion.asesoria.lead.telefono}</div>
              </div>
              <div className="mt-3">
                <Link 
                  href={`/leads/${conciliacion.asesoria.lead.id}`}
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
                      {formatDate(conciliacion.createdAt)}
                    </small>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-marker bg-info"></div>
                  <div className="timeline-content">
                    <h6 className="mb-1">Solicitud Presentada</h6>
                    <small className="text-muted">
                      {formatDate(conciliacion.fechaSolicitud)}
                    </small>
                  </div>
                </div>

                {conciliacion.fechaAudiencia && (
                  <div className="timeline-item">
                    <div className={`timeline-marker bg-${estadoConfig.color}`}></div>
                    <div className="timeline-content">
                      <h6 className="mb-1">Audiencia Programada</h6>
                      <small className="text-muted">
                        {formatDate(conciliacion.fechaAudiencia)}
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