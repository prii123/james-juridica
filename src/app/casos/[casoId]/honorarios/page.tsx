'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Filter,
  Clock
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Select, Label, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Honorario {
  id: string
  concepto: string
  descripcion?: string
  modalidad: 'CONTADO' | 'FINANCIADO'
  tipo: 'INICIAL' | 'POR_ETAPA' | 'CONTINGENTE' | 'MIXTO'
  valorTotal: number
  valorPagado: number
  valorPendiente: number
  porcentajeContingencia?: number
  fechaCreacion: string
  fechaVencimiento?: string
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
  pagos?: Array<{ id: string; monto: number; fecha: string; metodoPago: string }>
}

interface Caso {
  id: string
  numeroCaso: string
  valorDeuda: number
  cliente: {
    nombre: string
    apellido?: string
  }
}

const ESTADO_CONFIG: Record<Honorario['estado'], { badge: BadgeProps['variant']; icon: typeof Clock; label: string }> = {
  PENDIENTE: { badge: 'warning', icon: Clock, label: 'Pendiente' },
  PARCIAL: { badge: 'info', icon: AlertTriangle, label: 'Pago Parcial' },
  PAGADO: { badge: 'success', icon: CheckCircle, label: 'Pagado' },
  VENCIDO: { badge: 'danger', icon: XCircle, label: 'Vencido' },
}

const MODALIDAD_CONFIG: Record<Honorario['modalidad'], { badge: BadgeProps['variant']; label: string }> = {
  CONTADO: { badge: 'primary', label: 'Contado' },
  FINANCIADO: { badge: 'info', label: 'Financiado' },
}

const TIPO_HONORARIOS = {
  'INICIAL': 'Honorarios Iniciales',
  'POR_ETAPA': 'Por Etapa Procesal',
  'CONTINGENTE': 'Éxito/Contingente',
  'MIXTO': 'Mixto'
}

export default function HonorariosPage() {
  const params = useParams()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<Caso | null>(null)
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

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

      // Obtener honorarios (API endpoint que necesitamos crear)
      const honorariosResponse = await fetch(`/api/casos/${casoId}/honorarios`)
      if (honorariosResponse.ok) {
        const honorariosData = await honorariosResponse.json()
        setHonorarios(honorariosData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setHonorarios([])
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const calculatePercentagePaid = (honorario: Honorario) => {
    if (honorario.valorTotal === 0) return 0
    return (honorario.valorPagado / honorario.valorTotal) * 100
  }

  const isOverdue = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const getDaysUntilDue = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null
    const today = new Date()
    const due = new Date(fechaVencimiento)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const honorariosFiltrados = honorarios.filter(honorario => {
    const matchModalidad = !filtroModalidad || honorario.modalidad === filtroModalidad
    const matchTipo = !filtroTipo || honorario.tipo === filtroTipo
    const matchEstado = !filtroEstado || honorario.estado === filtroEstado
    return matchModalidad && matchTipo && matchEstado
  })

  const estadisticas = {
    totalHonorarios: honorarios.reduce((sum, h) => sum + h.valorTotal, 0),
    totalPagado: honorarios.reduce((sum, h) => sum + h.valorPagado, 0),
    totalPendiente: honorarios.reduce((sum, h) => sum + h.valorPendiente, 0),
    pendientes: honorarios.filter(h => h.estado === 'PENDIENTE').length,
    pagados: honorarios.filter(h => h.estado === 'PAGADO').length,
    vencidos: honorarios.filter(h => h.estado === 'VENCIDO').length
  }

  const porcentajePagado = estadisticas.totalHonorarios > 0
    ? (estadisticas.totalPagado / estadisticas.totalHonorarios) * 100
    : 0

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
      <Breadcrumb
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Honorarios' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/casos/${casoId}`}>
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-0 text-xl font-bold text-slate-800">Honorarios</h1>
            <p className="mb-0 text-slate-500">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/casos/${casoId}/honorarios/contado/nuevo`}>
            <Button variant="outlinePrimary">
              <Plus size={16} />
              Contado
            </Button>
          </Link>
          <Link href={`/casos/${casoId}/honorarios/financiado/nuevo`}>
            <Button>
              <Plus size={16} />
              Financiado
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-800">{formatCurrency(estadisticas.totalHonorarios)}</div>
                  <small className="text-slate-500">Total Honorarios</small>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-700">{formatCurrency(estadisticas.totalPagado)}</div>
                  <small className="text-slate-500">Total Pagado</small>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">{formatCurrency(estadisticas.totalPendiente)}</div>
                  <small className="text-slate-500">Pendiente</small>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-sky-700">{porcentajePagado.toFixed(1)}%</div>
                  <small className="text-slate-500">Progreso</small>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${porcentajePagado}%` }} />
                </div>
                <small className="text-slate-500">
                  Progreso de pagos: {porcentajePagado.toFixed(1)}% completado
                </small>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader><CardTitle>Estado de Honorarios</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-teal-700">{estadisticas.pagados}</div>
                  <small className="text-slate-500">Pagados</small>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-600">{estadisticas.pendientes}</div>
                  <small className="text-slate-500">Pendientes</small>
                </div>
              </div>
              {estadisticas.vencidos > 0 && (
                <div className="mt-2 text-center">
                  <div className="text-lg font-bold text-red-600">{estadisticas.vencidos}</div>
                  <small className="text-slate-500">Vencidos</small>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><Filter size={14} />Filtrar por Modalidad</Label>
              <Select value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)}>
                <option value="">Todas las modalidades</option>
                <option value="CONTADO">Contado</option>
                <option value="FINANCIADO">Financiado</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1"><DollarSign size={14} />Tipo</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_HONORARIOS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Estado</Label>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Pago Parcial</option>
                <option value="PAGADO">Pagado</option>
                <option value="VENCIDO">Vencido</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setFiltroModalidad(''); setFiltroTipo(''); setFiltroEstado('') }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Honorarios */}
      <Card>
        <CardHeader><CardTitle>Honorarios ({honorariosFiltrados.length})</CardTitle></CardHeader>
        <CardBody>
          {honorariosFiltrados.length === 0 ? (
            <div className="py-5 text-center">
              <DollarSign size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay honorarios</h5>
              <p className="mb-3 text-slate-500">
                {honorarios.length === 0
                  ? 'Aún no se han definido honorarios para este caso.'
                  : 'No se encontraron honorarios con los filtros seleccionados.'
                }
              </p>
              <div className="flex justify-center gap-2">
                <Link href={`/casos/${casoId}/honorarios/contado/nuevo`}>
                  <Button variant="outlinePrimary">
                    <Plus size={16} />
                    Honorarios Contado
                  </Button>
                </Link>
                <Link href={`/casos/${casoId}/honorarios/financiado/nuevo`}>
                  <Button>
                    <Plus size={16} />
                    Honorarios Financiados
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold">Modalidad/Tipo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Valor Total</th>
                    <th className="px-4 py-3 font-semibold">Pagado</th>
                    <th className="px-4 py-3 font-semibold">Pendiente</th>
                    <th className="px-4 py-3 font-semibold">Vencimiento</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {honorariosFiltrados.map((honorario) => {
                    const estadoConfig = ESTADO_CONFIG[honorario.estado] || ESTADO_CONFIG.PENDIENTE
                    const modalidadConfig = MODALIDAD_CONFIG[honorario.modalidad]
                    const IconoEstado = estadoConfig.icon
                    const porcentajePago = calculatePercentagePaid(honorario)
                    const diasVencimiento = getDaysUntilDue(honorario.fechaVencimiento)
                    const estaVencido = isOverdue(honorario.fechaVencimiento)

                    return (
                      <tr key={honorario.id} className={cn(estaVencido ? 'bg-red-50' : 'hover:bg-slate-50')}>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-medium text-slate-800">{honorario.concepto}</div>
                          {honorario.descripcion && (
                            <small className="block text-slate-500">
                              {honorario.descripcion.length > 50
                                ? `${honorario.descripcion.substring(0, 50)}...`
                                : honorario.descripcion
                              }
                            </small>
                          )}
                          {honorario.tipo === 'CONTINGENTE' && honorario.porcentajeContingencia && (
                            <small className="block text-sky-700">
                              {honorario.porcentajeContingencia}% sobre recuperación
                            </small>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="mb-1"><Badge variant={modalidadConfig.badge}>{modalidadConfig.label}</Badge></div>
                          <small className="text-slate-500">
                            {TIPO_HONORARIOS[honorario.tipo as keyof typeof TIPO_HONORARIOS] || honorario.tipo}
                          </small>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                          {honorario.estado === 'PARCIAL' && (
                            <div className="mt-1">
                              <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-sky-500" style={{ width: `${porcentajePago}%` }} />
                              </div>
                              <small className="text-slate-500">{porcentajePago.toFixed(0)}%</small>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-slate-800">{formatCurrency(honorario.valorTotal)}</div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="text-teal-700">{formatCurrency(honorario.valorPagado)}</div>
                          {honorario.pagos && honorario.pagos.length > 0 && (
                            <small className="text-slate-500">
                              {honorario.pagos.length} pago{honorario.pagos.length > 1 ? 's' : ''}
                            </small>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className={cn(honorario.valorPendiente > 0 ? 'font-semibold text-amber-600' : 'text-slate-500')}>
                            {formatCurrency(honorario.valorPendiente)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {honorario.fechaVencimiento ? (
                            <div>
                              <small className={cn(estaVencido ? 'font-bold text-red-600' : 'text-slate-500')}>
                                {formatDate(honorario.fechaVencimiento)}
                              </small>
                              {diasVencimiento !== null && (
                                <div>
                                  <small className={cn(
                                    diasVencimiento < 0 ? 'text-red-600' :
                                    diasVencimiento <= 7 ? 'text-amber-600' : 'text-slate-500'
                                  )}>
                                    {diasVencimiento < 0
                                      ? `Vencido hace ${Math.abs(diasVencimiento)} días`
                                      : diasVencimiento === 0
                                      ? 'Vence hoy'
                                      : `${diasVencimiento} días`
                                    }
                                  </small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1">
                            <Link href={`/casos/${casoId}/honorarios/${honorario.id}`}>
                              <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            <Link href={`/casos/${casoId}/honorarios/${honorario.id}/editar`}>
                              <Button variant="outline" size="icon" title="Editar">
                                <Edit3 size={14} />
                              </Button>
                            </Link>
                            {honorario.estado !== 'PAGADO' && (
                              <Link href={`/casos/${casoId}/honorarios/${honorario.id}/pagar`}>
                                <Button variant="outline" size="icon" className="border-teal-700 text-teal-700 hover:bg-teal-50" title="Registrar pago">
                                  <CreditCard size={14} />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
