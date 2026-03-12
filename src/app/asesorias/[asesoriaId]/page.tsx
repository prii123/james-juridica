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
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock3, 
  XCircle, 
  RotateCcw,
  FileText,
  ArrowRight,
  Building,
  Scale
} from 'lucide-react'
import { EstadoAsesoria, TipoAsesoria, ModalidadAsesoria } from '@prisma/client'

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  notas?: string
  createdAt: string
  updatedAt: string
  lead: {
    id: string
    nombre: string
    email: string
    telefono: string
    estado: string
  }
  asesor: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  radicaciones?: Array<{
    id: string
    fechaAudiencia?: string
    fechaSolicitud: string
    estado: string
  }>
}

const ESTADO_CONFIG = {
  PROGRAMADA: {
    color: 'primary',
    icon: Clock3,
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
  },
  REPROGRAMADA: {
    color: 'warning',
    icon: RotateCcw,
    label: 'Reprogramada'
  }
}

const TIPO_LABELS = {
  INICIAL: 'Consulta Inicial',
  SEGUIMIENTO: 'Seguimiento', 
  ESPECIALIZADA: 'Asesoría Especializada'
}

const MODALIDAD_LABELS = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  TELEFONICA: 'Telefónica'
}

export default function AsesoriaDetailPage({ params }: { params: { asesoriaId: string } }) {
  const router = useRouter()
  const [asesoria, setAsesoria] = useState<Asesoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [creandoRadicacion, setCreandoRadicacion] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchAsesoria()
  }, [])

  const fetchAsesoria = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/asesorias/${params.asesoriaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setAsesoria(data)
      } else {
        setError('No se pudo cargar la asesoría')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: EstadoAsesoria) => {
    if (!asesoria) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/asesorias/${params.asesoriaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      })

      if (response.ok) {
        const updatedAsesoria = await response.json()
        setAsesoria(updatedAsesoria)
      } else {
        setError('No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const handleCrearRadicacion = async () => {
    if (!asesoria) return
    
    try {
      setCreandoRadicacion(true)
      setError('')
      setSuccessMessage('')

      // Generar número de radicación temporal (se validará en el servidor)
      const year = new Date().getFullYear()
      const tempNumero = `RAD-${year}-TEMP-${Date.now()}`

      // Crear la radicación con datos por defecto
      const response = await fetch('/api/radicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: tempNumero,
          demandante: asesoria.lead.nombre,
          demandado: 'Por definir',
          valor: 0,
          estado: 'SOLICITADA',
          fechaSolicitud: new Date().toISOString(),
          observaciones: 'Radicación creada desde asesoría',
          asesoriaId: asesoria.id
        }),
      })

      if (response.ok) {
        setSuccessMessage('✓ Asesoría en estado de radicación')
        // Recargar los datos de la asesoría para mostrar la radicación
        await fetchAsesoria()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'No se pudo crear la radicación')
      }
    } catch (error) {
      setError('Error de conexión al crear la radicación')
    } finally {
      setCreandoRadicacion(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error || !asesoria) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Asesoría no encontrada'}
        </div>
        <Link href="/asesorias" className="btn btn-primary">
          Volver a Asesorías
        </Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[asesoria.estado]
  const IconoEstado = estadoConfig.icon

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Asesorías', href: '/asesorias' },
          { label: asesoria.tema }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/asesorias" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0">{asesoria.tema}</h1>
            <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </span>
          </div>
          <p className="text-secondary mb-0">
            {TIPO_LABELS[asesoria.tipo]} • {formatDate(asesoria.fecha)} • {formatTime(asesoria.fecha)}
          </p>
        </div>
        <Link 
          href={`/asesorias/${params.asesoriaId}/editar`}
          className="btn btn-outline-primary d-flex align-items-center gap-2"
        >
          <Edit3 size={16} />
          Editar
        </Link>
      </div>

      {/* Mensajes de éxito y error */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* Información Principal */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Detalles de la Asesoría</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Fecha y Hora</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Calendar size={16} />
                    <span>{formatDate(asesoria.fecha)}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Clock size={16} />
                    <span>{formatTime(asesoria.fecha)} ({asesoria.duracion} minutos)</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Modalidad</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <MapPin size={16} />
                    <span>{MODALIDAD_LABELS[asesoria.modalidad]}</span>
                  </div>
                </div>
              </div>

              {asesoria.descripcion && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Descripción</h6>
                  <p className="mb-0">{asesoria.descripcion}</p>
                </div>
              )}

              {asesoria.notas && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Notas</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{asesoria.notas}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Histórico y Seguimiento */}
          {asesoria.radicaciones && asesoria.radicaciones.length > 0 ? (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Seguimiento del Proceso</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6 className="text-muted mb-2">Radicaciones</h6>
                  {asesoria.radicaciones.map((radicacion) => (
                    <div key={radicacion.id} className="d-flex align-items-center gap-2 mb-1">
                      <Scale size={14} />
                      <Link href={`/radicaciones/${radicacion.id}`} className="text-decoration-none">
                        Radicación del {new Date(radicacion.fechaAudiencia || radicacion.fechaSolicitud).toLocaleDateString('es-CO')}
                      </Link>
                      <span className="badge bg-primary">{radicacion.estado}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Acciones de Workflow */
            asesoria.estado === 'REALIZADA' && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Siguiente Paso</h5>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3">
                    La asesoría fue completada. ¿Cuál es el siguiente paso en el proceso?
                  </p>
                  <div className="d-flex gap-2">
                    <button 
                      onClick={handleCrearRadicacion}
                      className="btn btn-outline-primary d-flex align-items-center gap-2"
                      disabled={creandoRadicacion}
                    >
                      {creandoRadicacion ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creando radicación...
                        </>
                      ) : (
                        <>
                          Estado Radicación
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    {/* <Link 
                      href={`/casos/nuevo?asesoriaId=${asesoria.id}`}
                      className="btn btn-outline-success d-flex align-items-center gap-2"
                    >
                      Crear Caso
                      <ArrowRight size={16} />
                    </Link> */}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div className="col-lg-4">
          {/* Acciones */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {asesoria.estado === 'PROGRAMADA' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('REALIZADA')}
                      className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                      disabled={updating}
                    >
                      <CheckCircle size={16} />
                      Marcar como Realizada
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('REPROGRAMADA')}
                      className="btn btn-warning d-flex align-items-center justify-content-center gap-2"
                      disabled={updating}
                    >
                      <RotateCcw size={16} />
                      Reprogramar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('CANCELADA')}
                      className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                      disabled={updating}
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  </>
                )}
                
                {asesoria.estado !== 'PROGRAMADA' && (
                  <button
                    onClick={() => handleStatusUpdate('PROGRAMADA')}
                    className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={updating}
                  >
                    <Clock3 size={16} />
                    Reprogramar
                  </button>
                )}

                <Link 
                  href={`/asesorias/${params.asesoriaId}/editar`}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                >
                  <Edit3 size={16} />
                  Editar Detalles
                </Link>

                {/* Sistema de archivos - Solo disponible si la asesoría está realizada */}
                {asesoria.estado === 'REALIZADA' && (
                  <Link 
                    href={`/leads/${asesoria.lead.id}/archivos`}
                    className="btn btn-info d-flex align-items-center justify-content-center gap-2"
                  >
                    <FileText size={16} />
                    Ver Archivos
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Cliente</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} />
                <span className="fw-semibold">{asesoria.lead.nombre}</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
                <Mail size={14} />
                <span>{asesoria.lead.email}</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-3 text-muted small">
                <Phone size={14} />
                <span>{asesoria.lead.telefono}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">Estado del Lead:</span>
                <span className="badge bg-secondary">{asesoria.lead.estado}</span>
              </div>
              <div className="mt-3">
                <Link 
                  href={`/leads/${asesoria.lead.id}`}
                  className="btn btn-outline-primary btn-sm w-100"
                >
                  Ver Perfil del Cliente
                </Link>
              </div>
            </div>
          </div>

          {/* Información del Asesor */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Asesor Asignado</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} />
                <span className="fw-semibold">
                  {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted small">
                <Mail size={14} />
                <span>{asesoria.asesor.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}