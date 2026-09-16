'use client'

import { useState, useEffect } from 'react'
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
  Scale
} from 'lucide-react'
import { EstadoAsesoria, TipoAsesoria, ModalidadAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'

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

const ESTADO_CONFIG: Record<EstadoAsesoria, { badge: BadgeProps['variant']; icon: typeof Clock3; label: string }> = {
  PENDIENTE: { badge: 'secondary', icon: Clock3, label: 'Pendiente' },
  PROGRAMADA: { badge: 'primary', icon: Clock3, label: 'Programada' },
  REALIZADA: { badge: 'success', icon: CheckCircle, label: 'Realizada' },
  CANCELADA: { badge: 'danger', icon: XCircle, label: 'Cancelada' },
  REPROGRAMADA: { badge: 'warning', icon: RotateCcw, label: 'Reprogramada' },
}

const TIPO_LABELS: Record<TipoAsesoria, string> = {
  INICIAL: 'Consulta Inicial',
  SEGUIMIENTO: 'Seguimiento',
  ESPECIALIZADA: 'Asesoría Especializada'
}

const MODALIDAD_LABELS: Record<ModalidadAsesoria, string> = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  TELEFONICA: 'Telefónica'
}

export default function AsesoriaDetailPage({ params }: { params: { asesoriaId: string } }) {
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

      const year = new Date().getFullYear()
      const tempNumero = `RAD-${year}-TEMP-${Date.now()}`

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
    return <Spinner />
  }

  if (error || !asesoria) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Asesoría no encontrada'}</Alert>
        <Link href="/asesorias"><Button>Volver a Asesorías</Button></Link>
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

      <div className="mb-4 flex items-center gap-3">
        <Link href="/asesorias">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="mb-0 text-xl font-bold text-slate-800">{asesoria.tema}</h1>
            <Badge variant={estadoConfig.badge}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </Badge>
          </div>
          <p className="mb-0 text-slate-500">
            {TIPO_LABELS[asesoria.tipo]} • {formatDate(asesoria.fecha)} • {formatTime(asesoria.fecha)}
          </p>
        </div>
        <Link href={`/asesorias/${params.asesoriaId}/editar`}>
          <Button variant="outlinePrimary">
            <Edit3 size={16} />
            Editar
          </Button>
        </Link>
      </div>

      {/* Mensajes de éxito y error */}
      {successMessage && (
        <Alert variant="success" className="mb-4 flex items-center justify-between">
          {successMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información Principal */}
          <Card>
            <CardHeader><CardTitle>Detalles de la Asesoría</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Fecha y Hora</h6>
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{formatDate(asesoria.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span>{formatTime(asesoria.fecha)} ({asesoria.duracion} minutos)</span>
                  </div>
                </div>
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Modalidad</h6>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{MODALIDAD_LABELS[asesoria.modalidad]}</span>
                  </div>
                </div>
              </div>

              {asesoria.descripcion && (
                <div className="mt-3">
                  <h6 className="mb-2 text-sm text-slate-500">Descripción</h6>
                  <p className="mb-0">{asesoria.descripcion}</p>
                </div>
              )}

              {asesoria.notas && (
                <div className="mt-3">
                  <h6 className="mb-2 text-sm text-slate-500">Notas</h6>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-0">{asesoria.notas}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Histórico y Seguimiento */}
          {asesoria.radicaciones && asesoria.radicaciones.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Seguimiento del Proceso</CardTitle></CardHeader>
              <CardBody>
                <h6 className="mb-2 text-sm text-slate-500">Radicaciones</h6>
                <div className="space-y-1">
                  {asesoria.radicaciones.map((radicacion) => (
                    <div key={radicacion.id} className="flex items-center gap-2">
                      <Scale size={14} className="text-slate-400" />
                      <Link href={`/radicaciones/${radicacion.id}`} className="text-blue-800 no-underline hover:underline">
                        Radicación del {new Date(radicacion.fechaAudiencia || radicacion.fechaSolicitud).toLocaleDateString('es-CO')}
                      </Link>
                      <Badge variant="primary">{radicacion.estado}</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            asesoria.estado === 'REALIZADA' && (
              <Card>
                <CardHeader><CardTitle>Siguiente Paso</CardTitle></CardHeader>
                <CardBody>
                  <p className="mb-3 text-slate-500">
                    La asesoría fue completada. ¿Cuál es el siguiente paso en el proceso?
                  </p>
                  <Button variant="outlinePrimary" onClick={handleCrearRadicacion} loading={creandoRadicacion}>
                    {!creandoRadicacion && <>Estado Radicación <ArrowRight size={16} /></>}
                    {creandoRadicacion && 'Creando radicación...'}
                  </Button>
                </CardBody>
              </Card>
            )
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones */}
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardBody className="grid gap-2">
              {asesoria.estado === 'PROGRAMADA' && (
                <>
                  <Button
                    variant="success"
                    className="justify-center"
                    onClick={() => handleStatusUpdate('REALIZADA')}
                    disabled={updating}
                  >
                    <CheckCircle size={16} />
                    Marcar como Realizada
                  </Button>
                  <Button
                    className="justify-center bg-amber-500 hover:bg-amber-600"
                    onClick={() => handleStatusUpdate('REPROGRAMADA')}
                    disabled={updating}
                  >
                    <RotateCcw size={16} />
                    Reprogramar
                  </Button>
                  <Button
                    variant="outlineDanger"
                    className="justify-center"
                    onClick={() => handleStatusUpdate('CANCELADA')}
                    disabled={updating}
                  >
                    <XCircle size={16} />
                    Cancelar
                  </Button>
                </>
              )}

              {asesoria.estado !== 'PROGRAMADA' && (
                <Button
                  variant="outlinePrimary"
                  className="justify-center"
                  onClick={() => handleStatusUpdate('PROGRAMADA')}
                  disabled={updating}
                >
                  <Clock3 size={16} />
                  Reprogramar
                </Button>
              )}

              <Link href={`/asesorias/${params.asesoriaId}/editar`}>
                <Button variant="outline" className="w-full justify-center">
                  <Edit3 size={16} />
                  Editar Detalles
                </Button>
              </Link>

              {asesoria.estado === 'REALIZADA' && (
                <Link href={`/leads/${asesoria.lead.id}/archivos`}>
                  <Button className="w-full justify-center bg-sky-600 hover:bg-sky-700">
                    <FileText size={16} />
                    Ver Archivos
                  </Button>
                </Link>
              )}
            </CardBody>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold text-slate-800">{asesoria.lead.nombre}</span>
              </div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <Mail size={14} />
                <span>{asesoria.lead.email}</span>
              </div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                <Phone size={14} />
                <span>{asesoria.lead.telefono}</span>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-slate-500">Estado del Lead:</span>
                <Badge variant="secondary">{asesoria.lead.estado}</Badge>
              </div>
              <Link href={`/leads/${asesoria.lead.id}`}>
                <Button variant="outlinePrimary" size="sm" className="w-full justify-center">
                  Ver Perfil del Cliente
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Información del Asesor */}
          <Card>
            <CardHeader><CardTitle>Asesor Asignado</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold text-slate-800">
                  {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail size={14} />
                <span>{asesoria.asesor.email}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
