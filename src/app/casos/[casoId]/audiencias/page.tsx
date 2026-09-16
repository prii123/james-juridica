'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ModalProcesosLiquidacion } from '@/components/ModalProcesosLiquidacion'
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
  Video,
  AlertCircle
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Select, Label, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Audiencia {
  id: string
  tipo: string
  fechaHora: string
  estado: 'PROGRAMADA' | 'REALIZADA' | 'APLAZADA' | 'CANCELADA'
  resultadoAudiencia: 'CONCILIACION' | 'FRACASO' | 'OTRA_AUDIENCIA' | 'PENDIENTE'
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'MIXTA'
  direccion?: string
  enlace?: string
  observaciones?: string
  resultado?: string
  responsable: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
}

interface Caso {
  id: string
  numeroCaso: string
  cliente: {
    nombre: string
    apellido?: string
  }
}

const ESTADO_CONFIG: Record<Audiencia['estado'], { badge: BadgeProps['variant']; icon: typeof Calendar; label: string }> = {
  PROGRAMADA: { badge: 'primary', icon: Calendar, label: 'Programada' },
  REALIZADA: { badge: 'success', icon: CheckCircle, label: 'Realizada' },
  APLAZADA: { badge: 'warning', icon: Clock, label: 'Aplazada' },
  CANCELADA: { badge: 'danger', icon: XCircle, label: 'Cancelada' },
}

const RESULTADO_CONFIG: Record<Audiencia['resultadoAudiencia'], { badge: BadgeProps['variant']; label: string; icon: typeof Calendar }> = {
  PENDIENTE: { badge: 'secondary', label: 'Pendiente', icon: AlertTriangle },
  CONCILIACION: { badge: 'success', label: 'Conciliación Lograda', icon: CheckCircle },
  FRACASO: { badge: 'danger', label: 'Fracaso', icon: XCircle },
  OTRA_AUDIENCIA: { badge: 'info', label: 'Otra Audiencia', icon: Calendar },
}

const MODALIDAD_CONFIG: Record<Audiencia['modalidad'], { icon: typeof MapPin; label: string }> = {
  PRESENCIAL: { icon: MapPin, label: 'Presencial' },
  VIRTUAL: { icon: Video, label: 'Virtual' },
  MIXTA: { icon: Users, label: 'Mixta' },
}

const TIPO_AUDIENCIAS = {
  'RADICACION': 'Radicación',
  'ADMISORIA': 'Admisoria',
  'VERIFICACION_CREDITOS': 'Verificación de Créditos',
  'CATEGORIA_CREDITOS': 'Categoría de Créditos',
  'CONCORDATO': 'Concordato',
  'OTRA': 'Otra'
}

export default function AudienciasPage() {
  const params = useParams()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<Caso | null>(null)
  const [audiencias, setAudiencias] = useState<Audiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [audienciaSeleccionada, setAudienciaSeleccionada] = useState<Audiencia | null>(null)

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

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilAudiencia = (fechaHora: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const audienciaDate = new Date(fechaHora)
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
    const dateA = new Date(a.fechaHora)
    const dateB = new Date(b.fechaHora)
    return dateA.getTime() - dateB.getTime()
  })

  const estadisticas = {
    total: audiencias.length,
    programadas: audiencias.filter(a => a.estado === 'PROGRAMADA').length,
    completadas: audiencias.filter(a => a.estado === 'REALIZADA').length,
    canceladas: audiencias.filter(a => a.estado === 'CANCELADA').length,
    proximas: audiencias.filter(a =>
      a.estado === 'PROGRAMADA' &&
      getDaysUntilAudiencia(a.fechaHora) <= 7
    ).length
  }

  const abrirModalLiquidacion = (audiencia: Audiencia) => {
    setAudienciaSeleccionada(audiencia)
    setModalOpen(true)
  }

  const cerrarModalLiquidacion = () => {
    setModalOpen(false)
    setAudienciaSeleccionada(null)
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

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-blink {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .btn-parpadeante {
          animation: pulse-blink 1s infinite;
          box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
        }
      `}</style>
      <Breadcrumb
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Audiencias' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/casos/${casoId}`}>
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-0 text-xl font-bold text-slate-800">Audiencias</h1>
            <p className="mb-0 text-slate-500">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>

        <Link href={`/casos/${casoId}/audiencias/nueva`}>
          <Button>
            <Plus size={16} />
            Nueva Audiencia
          </Button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Card className="bg-slate-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-slate-800">{estadisticas.total}</div>
            <small className="text-slate-500">Total</small>
          </CardBody>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-blue-800">{estadisticas.programadas}</div>
            <small className="text-slate-500">Programadas</small>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-amber-600">{estadisticas.proximas}</div>
            <small className="text-slate-500">Próximas (7 días)</small>
          </CardBody>
        </Card>
        <Card className="bg-teal-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-teal-700">{estadisticas.completadas}</div>
            <small className="text-slate-500">Completadas</small>
          </CardBody>
        </Card>
        <Card className="bg-red-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-red-600">{estadisticas.canceladas}</div>
            <small className="text-slate-500">Canceladas</small>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1"><Filter size={14} />Filtrar por Estado</Label>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="REPROGRAMADA">Reprogramada</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1"><Calendar size={14} />Filtrar por Tipo</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_AUDIENCIAS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1"><Video size={14} />Modalidad</Label>
              <Select value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)}>
                <option value="">Todas las modalidades</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="MIXTA">Mixta</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setFiltroEstado(''); setFiltroTipo(''); setFiltroModalidad('') }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Audiencias */}
      <Card>
        <CardHeader><CardTitle>Audiencias ({audienciasOrdenadas.length})</CardTitle></CardHeader>
        <CardBody>
          {audienciasOrdenadas.length === 0 ? (
            <div className="py-5 text-center">
              <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay audiencias</h5>
              <p className="text-slate-500">
                {audiencias.length === 0
                  ? 'Aún no se han programado audiencias para este caso.'
                  : 'No se encontraron audiencias con los filtros seleccionados.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {audienciasOrdenadas.map((audiencia) => {
                const estadoConfig = ESTADO_CONFIG[audiencia.estado] || ESTADO_CONFIG.PROGRAMADA
                const modalidadConfig = MODALIDAD_CONFIG[audiencia.modalidad] || MODALIDAD_CONFIG.PRESENCIAL
                const IconoEstado = estadoConfig.icon
                const IconoModalidad = modalidadConfig.icon
                const diasHasta = getDaysUntilAudiencia(audiencia.fechaHora)
                const esHoy = diasHasta === 0
                const resultadoConfig = RESULTADO_CONFIG[audiencia.resultadoAudiencia] || RESULTADO_CONFIG.PENDIENTE
                const IconoResultado = resultadoConfig.icon

                return (
                  <Card key={audiencia.id} className={cn('flex h-full flex-col', esHoy && 'border-amber-400 shadow-sm')}>
                    {esHoy && (
                      <div className="rounded-t-xl bg-amber-400 py-1 text-center text-xs font-bold text-slate-900">
                        AUDIENCIA HOY
                      </div>
                    )}
                    <CardBody className="flex flex-1 flex-col">
                      <div className="mb-2 flex items-start justify-between">
                        <Badge variant="outline">
                          {TIPO_AUDIENCIAS[audiencia.tipo as keyof typeof TIPO_AUDIENCIAS] || audiencia.tipo}
                        </Badge>
                        <Badge variant={estadoConfig.badge}>
                          <IconoEstado size={12} />
                          {estadoConfig.label}
                        </Badge>
                      </div>

                      {audiencia.estado === 'REALIZADA' && (
                        <div className="mb-2">
                          <Badge variant={resultadoConfig.badge}>
                            <IconoResultado size={12} />
                            {resultadoConfig.label}
                          </Badge>
                        </div>
                      )}

                      {audiencia.estado === 'REALIZADA' && audiencia.resultadoAudiencia === 'FRACASO' && (
                        <div className="mb-3">
                          <Button
                            variant="danger"
                            size="sm"
                            className="btn-parpadeante w-full justify-center"
                            onClick={() => abrirModalLiquidacion(audiencia)}
                            title="Iniciar proceso de liquidación"
                          >
                            <AlertCircle size={16} />
                            Iniciar Liquidación
                          </Button>
                        </div>
                      )}

                      <div className="mb-2 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm">{formatDateTime(audiencia.fechaHora)}</span>
                      </div>

                      <div className="mb-2 flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-sm">{formatTime(audiencia.fechaHora)}</span>
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <IconoModalidad size={14} className="text-slate-400" />
                        <span className="text-sm">{modalidadConfig.label}</span>
                        {audiencia.modalidad === 'PRESENCIAL' && audiencia.direccion && (
                          <small className="text-slate-500">• {audiencia.direccion}</small>
                        )}
                      </div>

                      {audiencia.estado === 'PROGRAMADA' && (
                        <div className="mb-3">
                          {diasHasta < 0 ? (
                            <div className="flex items-center gap-1 text-sm text-red-600">
                              <AlertTriangle size={12} />
                              Vencida hace {Math.abs(diasHasta)} días
                            </div>
                          ) : diasHasta === 0 ? (
                            <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                              <Clock size={12} />
                              Hoy
                            </div>
                          ) : diasHasta <= 7 ? (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Clock size={12} />
                              En {diasHasta} días
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">En {diasHasta} días</div>
                          )}
                        </div>
                      )}

                      {audiencia.responsable && (
                        <div className="mb-2">
                          <small className="text-slate-500">
                            <strong>Responsable:</strong> {audiencia.responsable.nombre} {audiencia.responsable.apellido}
                          </small>
                        </div>
                      )}

                      <div className="mt-auto flex gap-1 border-t border-slate-100 pt-3">
                        <Link href={`/casos/${casoId}/audiencias/${audiencia.id}`} className="flex-1">
                          <Button variant="outlinePrimary" size="sm" className="w-full justify-center" title="Ver detalles">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        <Link href={`/casos/${casoId}/audiencias/${audiencia.id}/editar`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full justify-center" title="Editar">
                            <Edit3 size={14} />
                          </Button>
                        </Link>
                        {audiencia.modalidad === 'VIRTUAL' && audiencia.enlace && (
                          <a href={audiencia.enlace} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full justify-center border-sky-700 text-sky-700 hover:bg-sky-50" title="Unirse a videollamada">
                              <Video size={14} />
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Procesos de Liquidación */}
      {audienciaSeleccionada && (
        <ModalProcesosLiquidacion
          isOpen={modalOpen}
          onClose={cerrarModalLiquidacion}
          audienciaId={audienciaSeleccionada.id}
          casoId={casoId}
        />
      )}
    </>
  )
}
