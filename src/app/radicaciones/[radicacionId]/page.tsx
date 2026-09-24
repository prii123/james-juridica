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
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X
} from 'lucide-react'
import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Radicacion {
  id: string
  numero: string
  estado: EstadoRadicacion
  resultado?: ResultadoRadicacion
  fechaSolicitud: string
  fechaAudiencia?: string
  observaciones?: string
  createdAt: string
  updatedAt: string
  // Puede ser null: alguna radicación anterior a este campo no pudo resolverse en la migración.
  cliente: {
    id: string
    nombre: string
    apellido?: string | null
    email: string
    telefono: string
    documento: string
  } | null
  // Puede ser null: una radicación se puede crear directamente, sin pasar por una asesoría.
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
  } | null
}

const ESTADO_CONFIG: Record<EstadoRadicacion, { badge: BadgeProps['variant']; icon: typeof Clock; label: string; dot: string }> = {
  SOLICITADA: { badge: 'warning', icon: Clock, label: 'Solicitada', dot: 'bg-amber-500' },
  PROGRAMADA: { badge: 'primary', icon: Calendar, label: 'Programada', dot: 'bg-blue-800' },
  REALIZADA: { badge: 'success', icon: CheckCircle, label: 'Realizada', dot: 'bg-teal-600' },
  CANCELADA: { badge: 'danger', icon: XCircle, label: 'Cancelada', dot: 'bg-red-600' },
}

const RESULTADO_CONFIG: Record<ResultadoRadicacion, { badge: BadgeProps['variant']; label: string }> = {
  ACUERDO_TOTAL: { badge: 'success', label: 'Acuerdo Total' },
  ACUERDO_PARCIAL: { badge: 'warning', label: 'Acuerdo Parcial' },
  SIN_ACUERDO: { badge: 'danger', label: 'Sin Acuerdo' },
}

export default function RadicacionDetailPage({ params }: { params: { radicacionId: string } }) {
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
          createCase: newStatus === 'REALIZADA'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const updatedRadicacion = result.radicacion || result
        setRadicacion(updatedRadicacion)

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

  if (loading) {
    return <Spinner />
  }

  if (error || !radicacion) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Conciliación no encontrada'}</Alert>
        <Link href="/radicaciones"><Button>Volver a Radicaciones</Button></Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[radicacion.estado] || { badge: 'secondary' as const, icon: AlertCircle, label: radicacion.estado, dot: 'bg-slate-400' }
  const IconoEstado = estadoConfig.icon
  const resultadoConfig = radicacion.resultado ? (RESULTADO_CONFIG[radicacion.resultado] || { badge: 'secondary' as const, label: radicacion.resultado }) : null

  const timelineItems = [
    { color: 'bg-blue-800', title: 'Conciliación Creada', date: formatDate(radicacion.createdAt) },
    { color: 'bg-sky-600', title: 'Solicitud Presentada', date: formatDate(radicacion.fechaSolicitud) },
    ...(radicacion.fechaAudiencia ? [{ color: estadoConfig.dot, title: 'Audiencia Programada', date: formatDate(radicacion.fechaAudiencia) }] : []),
  ]

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
        <Alert variant="success" className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle size={20} />{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')}><X size={16} /></button>
        </Alert>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert variant="danger" className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle size={20} />{error}</span>
          <button type="button" onClick={() => setError('')}><X size={16} /></button>
        </Alert>
      )}

      <div className="mb-4 flex items-center gap-3">
        <Link href="/radicaciones">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="mb-0 text-xl font-bold text-slate-800">{radicacion.numero}</h1>
            <Badge variant={estadoConfig.badge}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </Badge>
            {resultadoConfig && (
              <Badge variant={resultadoConfig.badge}>{resultadoConfig.label}</Badge>
            )}
          </div>
          <p className="mb-0 text-slate-500">
            {radicacion.cliente
              ? `${radicacion.cliente.nombre} ${radicacion.cliente.apellido || ''}`.trim()
              : 'Sin cliente asignado'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información Principal */}
          <Card>
            <CardHeader><CardTitle>Detalles de la Conciliación</CardTitle></CardHeader>
            <CardBody>
              <div>
                <h6 className="mb-1 text-sm text-slate-500">Insolvente</h6>
                <div className="mb-3 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="font-semibold">
                    {radicacion.cliente
                      ? `${radicacion.cliente.nombre} ${radicacion.cliente.apellido || ''}`.trim()
                      : 'Sin cliente asignado'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Fecha de Solicitud</h6>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{formatDate(radicacion.fechaSolicitud)}</span>
                  </div>
                </div>
                {radicacion.fechaAudiencia && (
                  <div>
                    <h6 className="mb-1 text-sm text-slate-500">Fecha de Audiencia</h6>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      <span>{formatDate(radicacion.fechaAudiencia)}</span>
                    </div>
                  </div>
                )}
              </div>

              {radicacion.observaciones && (
                <div className="mt-3">
                  <h6 className="mb-2 text-sm text-slate-500">Observaciones</h6>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-0">{radicacion.observaciones}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Asesoría Origen */}
          <Card>
            <CardHeader><CardTitle>Asesoría de Origen</CardTitle></CardHeader>
            <CardBody>
              {!radicacion.asesoria ? (
                <p className="mb-0 text-sm text-slate-500">
                  Esta radicación se creó directamente, sin una asesoría de origen.
                </p>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h6 className="mb-1 font-semibold text-slate-800">{radicacion.asesoria.tema}</h6>
                    <p className="mb-2 text-slate-500">
                      Realizada el {formatDate(radicacion.asesoria.fecha)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User size={14} />
                      <span>Cliente: {radicacion.asesoria.lead.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User size={14} />
                      <span>
                        Asesor: {radicacion.asesoria.asesor.nombre} {radicacion.asesoria.asesor.apellido}
                      </span>
                    </div>
                  </div>
                  <Link href={`/asesorias/${radicacion.asesoria.id}`}>
                    <Button variant="outlinePrimary" size="sm">
                      <Eye size={14} />
                      Ver Asesoría
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones */}
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardBody className="grid gap-2">
              <Button
                variant="success"
                className="justify-center"
                onClick={() => handleStatusUpdate('REALIZADA')}
                loading={updating}
                disabled={radicacion.estado === 'REALIZADA'}
              >
                {!updating && <CheckCircle size={16} />}
                {updating ? 'Actualizando...' : 'Aceptada por centro de conciliación'}
              </Button>

              <Link href={`/radicaciones/${params.radicacionId}/editar`}>
                <Button variant="outlinePrimary" className="w-full justify-center">
                  <Edit3 size={16} />
                  Editar Conciliación
                </Button>
              </Link>

              {radicacion.asesoria && (
                <Link href={`/leads/${radicacion.asesoria.lead.id}/archivos`}>
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
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardBody>
              {!radicacion.cliente ? (
                <p className="mb-0 text-sm text-amber-600">
                  Esta radicación no tiene un cliente asignado. Asígnalo desde &quot;Editar Conciliación&quot;.
                </p>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {radicacion.cliente.nombre} {radicacion.cliente.apellido || ''}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <div>Doc: {radicacion.cliente.documento}</div>
                    <div>{radicacion.cliente.email}</div>
                    <div>{radicacion.cliente.telefono}</div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardBody>
              <div className="relative pl-8">
                <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-slate-200" />
                {timelineItems.map((item, i) => (
                  <div key={i} className={cn('relative', i < timelineItems.length - 1 && 'mb-6')}>
                    <div className={cn('absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white', item.color)} />
                    <div className="ml-2">
                      <h6 className="mb-1 font-semibold text-slate-800">{item.title}</h6>
                      <small className="text-slate-500">{item.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
