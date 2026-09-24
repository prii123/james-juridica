'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Edit3,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Pause,
  Archive,
  Target,
  Flag,
  AlertTriangle,
  Play,
} from 'lucide-react'
import { EstadoCaso, TipoInsolvencia, Prioridad } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Caso {
  id: string
  numeroCaso: string
  tipoInsolvencia: TipoInsolvencia
  estado: EstadoCaso
  prioridad: Prioridad
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
  documentos?: Array<{ id: string; nombre: string; tipo: string; fechaCreacion: string }>
  actuaciones?: Array<{ id: string; tipo: string; titulo: string; estado: string; fechaVencimiento?: string }>
  audiencias?: Array<{ id: string; tipo: string; fecha: string; estado: string }>
}

const ESTADO_CONFIG: Record<EstadoCaso, { badge: BadgeProps['variant']; icon: typeof Play; label: string }> = {
  ACTIVO: { badge: 'success', icon: Play, label: 'Activo' },
  CERRADO: { badge: 'secondary', icon: CheckCircle, label: 'Cerrado' },
  SUSPENDIDO: { badge: 'warning', icon: Pause, label: 'Suspendido' },
  ARCHIVADO: { badge: 'secondary', icon: Archive, label: 'Archivado' },
}

const PRIORIDAD_CONFIG: Record<Prioridad, { badge: BadgeProps['variant']; icon: typeof Target; label: string }> = {
  BAJA: { badge: 'info', icon: Target, label: 'Baja' },
  MEDIA: { badge: 'primary', icon: Target, label: 'Media' },
  ALTA: { badge: 'warning', icon: Flag, label: 'Alta' },
  CRITICA: { badge: 'danger', icon: AlertTriangle, label: 'Crítica' },
}

const TIPO_INSOLVENCIA_LABELS: Record<TipoInsolvencia, string> = {
  REORGANIZACION: 'Reorganización',
  LIQUIDACION_JUDICIAL: 'Liquidación Judicial',
  INSOLVENCIA_PERSONA_NATURAL: 'Insolvencia Persona Natural',
  ACUERDO_REORGANIZACION: 'Acuerdo de Reorganización'
}

export default function CasoDetailPage({ params }: { params: { casoId: string } }) {
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

  const calculateDaysActive = (fechaInicio: string, fechaCierre?: string) => {
    const inicio = new Date(fechaInicio)
    const fin = fechaCierre ? new Date(fechaCierre) : new Date()
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return <Spinner />
  }

  if (error || !caso) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Caso no encontrado'}</Alert>
        <Link href="/casos"><Button>Volver a Casos</Button></Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[caso.estado] || { badge: 'secondary' as const, icon: AlertCircle, label: caso.estado }
  const prioridadConfig = PRIORIDAD_CONFIG[caso.prioridad] || { badge: 'secondary' as const, icon: Target, label: caso.prioridad }

  const IconoEstado = estadoConfig.icon
  const IconoPrioridad = prioridadConfig.icon
  const diasActivo = calculateDaysActive(caso.fechaInicio, caso.fechaCierre)

  const timelineItems = [
    { color: 'bg-blue-800', title: 'Caso Creado', date: `${formatDate(caso.createdAt)} por ${caso.creadoPor.nombre} ${caso.creadoPor.apellido}` },
    { color: 'bg-sky-600', title: 'Proceso Iniciado', date: formatDate(caso.fechaInicio) },
    ...(caso.fechaCierre ? [{ color: 'bg-teal-600', title: 'Caso Cerrado', date: formatDate(caso.fechaCierre) }] : []),
  ]

  return (
    <>
      <Breadcrumb items={[{ label: 'Casos', href: '/casos' }, { label: caso.numeroCaso }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/casos">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="mb-0 text-xl font-bold text-slate-800">{caso.numeroCaso}</h1>
            <Badge variant={estadoConfig.badge}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </Badge>
            <Badge variant={prioridadConfig.badge}>
              <IconoPrioridad size={12} />
              {prioridadConfig.label}
            </Badge>
          </div>
          <p className="mb-0 text-slate-500">
            {TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]}
            {caso.cliente && <> • Cliente: {caso.cliente.nombre} {caso.cliente.apellido}</>}
          </p>
        </div>
        <Link href={`/casos/${params.casoId}/editar`}>
          <Button variant="outlinePrimary">
            <Edit3 size={16} />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información Principal */}
          <Card>
            <CardHeader><CardTitle>Detalles del Caso</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Tipo de Insolvencia</h6>
                  <div className="mb-3">
                    <Badge variant="info">{TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]}</Badge>
                  </div>
                </div>
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Fecha de Inicio</h6>
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{formatDate(caso.fechaInicio)}</span>
                    <small className="text-slate-500">({diasActivo} días)</small>
                  </div>

                  {caso.fechaCierre && (
                    <>
                      <h6 className="mb-1 text-sm text-slate-500">Fecha de Cierre</h6>
                      <div className="mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{formatDate(caso.fechaCierre)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {caso.observaciones && (
                <div className="mt-3">
                  <h6 className="mb-2 text-sm text-slate-500">Observaciones</h6>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-0">{caso.observaciones}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardBody>
              {!caso.cliente ? (
                <p className="mb-0 text-sm text-slate-500">Este caso no tiene un cliente asociado.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <User size={20} className="mt-1 text-blue-800" />
                    <div>
                      <h6 className="mb-1 font-semibold text-slate-800">
                        {caso.cliente.nombre} {caso.cliente.apellido}
                      </h6>
                      <div className="mb-1 text-sm text-slate-500">
                        <strong>Documento:</strong> {caso.cliente.documento}
                      </div>
                      <div className="mb-1 text-sm text-slate-500">
                        <strong>Tipo:</strong> {caso.cliente.tipoPersona === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">
                      <div className="mb-1"><strong>Email:</strong> {caso.cliente.email}</div>
                      <div className="mb-1"><strong>Teléfono:</strong> {caso.cliente.telefono}</div>
                    </div>
                    <div className="mt-3">
                      <Link href={`/clientes/${caso.cliente.id}`}>
                        <Button variant="outlinePrimary" size="sm">Ver Perfil del Cliente</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Progreso y Estadísticas */}
          <Card>
            <CardHeader><CardTitle>Progreso del Caso</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-blue-800">{caso.documentos?.length || 0}</div>
                  <small className="text-slate-500">Documentos</small>
                </div>
                <div>
                  <div className="text-2xl font-bold text-teal-700">{caso.actuaciones?.length || 0}</div>
                  <small className="text-slate-500">Actuaciones</small>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">{caso.audiencias?.length || 0}</div>
                  <small className="text-slate-500">Audiencias</small>
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-700">{diasActivo}</div>
                  <small className="text-slate-500">Días {caso.estado === 'ACTIVO' ? 'activo' : 'total'}</small>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Acciones */}
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardBody className="grid gap-2">
              {caso.estado === 'ACTIVO' && (
                <>
                  <Button
                    variant="success"
                    className="justify-center"
                    onClick={() => handleStatusUpdate('CERRADO')}
                    disabled={updating}
                  >
                    <CheckCircle size={16} />
                    Cerrar Caso
                  </Button>
                  <Button
                    className="justify-center bg-amber-500 hover:bg-amber-600"
                    onClick={() => handleStatusUpdate('SUSPENDIDO')}
                    disabled={updating}
                  >
                    <Pause size={16} />
                    Suspender
                  </Button>
                </>
              )}

              {caso.estado === 'SUSPENDIDO' && (
                <Button
                  variant="success"
                  className="justify-center"
                  onClick={() => handleStatusUpdate('ACTIVO')}
                  disabled={updating}
                >
                  <Play size={16} />
                  Reactivar Caso
                </Button>
              )}

              <Link href={`/casos/${params.casoId}/editar`}>
                <Button variant="outlinePrimary" className="w-full justify-center">
                  <Edit3 size={16} />
                  Editar Caso
                </Button>
              </Link>

              <Link href={`/casos/${params.casoId}/documentos`}>
                <Button variant="outline" className="w-full justify-center">
                  <FileText size={16} />
                  Ver Documentos
                </Button>
              </Link>

              <Link href={`/casos/${params.casoId}/actuaciones`}>
                <Button variant="outline" className="w-full justify-center">
                  <FileText size={16} />
                  Actuaciones
                </Button>
              </Link>

              <Link href={`/casos/${params.casoId}/audiencias`}>
                <Button variant="outline" className="w-full justify-center">
                  <Calendar size={16} />
                  Audiencias
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Información del Responsable */}
          <Card>
            <CardHeader><CardTitle>Responsable del Caso</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold text-slate-800">
                  {caso.responsable.nombre} {caso.responsable.apellido}
                </span>
              </div>
              <div className="text-sm text-slate-500">{caso.responsable.email}</div>
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
