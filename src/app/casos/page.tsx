'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Archive,
  Target,
  Flag,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { EstadoCaso, TipoInsolvencia, Prioridad } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Label, Spinner, Alert, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Caso {
  id: string
  numeroCaso: string
  tipoInsolvencia: TipoInsolvencia
  estado: EstadoCaso
  prioridad: Prioridad
  fechaInicio: string
  fechaCierre?: string
  createdAt: string
  cliente?: {
    id: string
    nombre: string
    apellido?: string
    documento: string
  } | null
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
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

// "Activos" es el trabajo del día a día (incluye Suspendidos: siguen abiertos, solo en pausa).
// "Cerrados" agrupa lo que ya terminó o se archivó, para no estorbar en la vista principal.
type Vista = 'activos' | 'cerrados'

const VISTAS: Record<Vista, { label: string; estados: EstadoCaso[] }> = {
  activos: { label: 'Activos', estados: ['ACTIVO', 'SUSPENDIDO'] },
  cerrados: { label: 'Cerrados', estados: ['CERRADO', 'ARCHIVADO'] },
}

function esVista(v: string | null): v is Vista {
  return v === 'activos' || v === 'cerrados'
}

export default function CasosPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CasosPageContent />
    </Suspense>
  )
}

function CasosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vistaParam = searchParams.get('vista')
  const vista: Vista = esVista(vistaParam) ? vistaParam : 'activos'

  const [casos, setCasos] = useState<Caso[]>([])
  const [conteos, setConteos] = useState<Record<Vista, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [subEstado, setSubEstado] = useState<EstadoCaso | ''>('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 })

  const cambiarVista = (v: Vista) => {
    setSubEstado('')
    router.push(`/casos?vista=${v}`)
  }

  // Cambiar de pestaña, sub-estado o filtros vuelve a la página 1.
  useEffect(() => {
    setPage(1)
  }, [vista, subEstado, searchTerm, filtroPrioridad, filtroTipo])

  const fetchCasos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append('estado', subEstado || VISTAS[vista].estados.join(','))
      params.append('page', String(page))
      params.append('limit', '20')
      if (searchTerm) params.append('search', searchTerm)
      if (filtroPrioridad) params.append('prioridad', filtroPrioridad)
      if (filtroTipo) params.append('tipoInsolvencia', filtroTipo)

      const response = await fetch(`/api/casos?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Error al cargar los casos')
        setCasos([])
        return
      }
      const lista: Caso[] = Array.isArray(data.casos) ? data.casos : Array.isArray(data) ? data : []
      setCasos(lista)
      setPagination({
        total: data.total ?? lista.length,
        page: data.page ?? 1,
        limit: data.limit ?? 20,
      })
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setCasos([])
    } finally {
      setLoading(false)
    }
  }, [vista, subEstado, searchTerm, filtroPrioridad, filtroTipo, page])

  const fetchConteos = useCallback(async () => {
    try {
      const res = await fetch('/api/casos/stats')
      if (!res.ok) return
      const stats = await res.json()
      setConteos({
        activos: (stats.porEstado?.ACTIVO ?? 0) + (stats.porEstado?.SUSPENDIDO ?? 0),
        cerrados: (stats.porEstado?.CERRADO ?? 0) + (stats.porEstado?.ARCHIVADO ?? 0),
      })
    } catch {
      // Los contadores de las pestañas no son críticos.
    }
  }, [])

  useEffect(() => {
    fetchCasos()
  }, [fetchCasos])

  useEffect(() => {
    fetchConteos()
  }, [fetchConteos, casos])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })

  const calculateDaysActive = (fechaInicio: string, fechaCierre?: string) => {
    const inicio = new Date(fechaInicio)
    const fin = fechaCierre ? new Date(fechaCierre) : new Date()
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Casos' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Casos Jurídicos</h1>
          <p className="mb-0 text-slate-500">Gestión de procesos de insolvencia</p>
        </div>
        <Link href="/casos/nueva">
          <Button>
            <Plus size={16} />
            Nuevo Caso
          </Button>
        </Link>
      </div>

      {/* Pestañas de estado */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {(Object.keys(VISTAS) as Vista[]).map((v) => (
          <button
            key={v}
            onClick={() => cambiarVista(v)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              vista === v ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {VISTAS[v].label}
            {conteos && <Badge variant={vista === v ? 'primary' : 'secondary'}>{conteos[v]}</Badge>}
          </button>
        ))}
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Label className="flex items-center gap-1">
                <Search size={14} />
                Buscar
              </Label>
              <Input
                type="text"
                placeholder="Número de caso, cliente, documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="flex items-center gap-1">
                <Filter size={14} />
                Estado
              </Label>
              <Select value={subEstado} onChange={(e) => setSubEstado(e.target.value as EstadoCaso | '')}>
                <option value="">{VISTAS[vista].estados.map((e) => ESTADO_CONFIG[e].label).join(' y ')}</option>
                {VISTAS[vista].estados.map((e) => (
                  <option key={e} value={e}>Solo {ESTADO_CONFIG[e].label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Prioridad</Label>
              <Select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}>
                <option value="">Todas</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Tipo de Insolvencia</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="REORGANIZACION">Reorganización</option>
                <option value="LIQUIDACION_JUDICIAL">Liquidación Judicial</option>
                <option value="INSOLVENCIA_PERSONA_NATURAL">Insolvencia Persona Natural</option>
                <option value="ACUERDO_REORGANIZACION">Acuerdo de Reorganización</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setSearchTerm('')
                  setSubEstado('')
                  setFiltroPrioridad('')
                  setFiltroTipo('')
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Casos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase size={20} />
            {VISTAS[vista].label} ({pagination.total > 0 ? pagination.total : casos.length})
          </CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="py-5 text-center">
              <Alert variant="danger" title="Error al cargar casos" className="mx-4 mb-4 text-left">
                {error}
              </Alert>
              <Button onClick={() => { setError(null); fetchCasos() }}>Reintentar</Button>
            </div>
          ) : casos.length === 0 ? (
            <div className="py-5 text-center">
              <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">Sin casos en &quot;{VISTAS[vista].label}&quot;</h5>
              <p className="text-slate-500">
                {vista === 'activos'
                  ? 'Los casos se crean automáticamente cuando una radicación es aceptada por el juzgado.'
                  : 'Intenta con otros filtros de búsqueda.'}
              </p>
              {vista === 'activos' && (
                <Link href="/radicaciones">
                  <Button className="mt-3">Ir a Radicaciones</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Caso</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Prioridad</th>
                    <th className="px-4 py-3 font-semibold">Responsable</th>
                    <th className="px-4 py-3 font-semibold">Días Activo</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {casos.map((caso) => {
                    const estadoConfig = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.ACTIVO
                    const prioridadConfig = PRIORIDAD_CONFIG[caso.prioridad] || PRIORIDAD_CONFIG.MEDIA
                    const IconoEstado = estadoConfig.icon
                    const IconoPrioridad = prioridadConfig.icon
                    const diasActivo = calculateDaysActive(caso.fechaInicio, caso.fechaCierre)

                    return (
                      <tr key={caso.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle">
                          <Link href={`/casos/${caso.id}`} className="font-semibold text-slate-800 no-underline hover:text-blue-800">
                            {caso.numeroCaso}
                          </Link>
                          <div className="text-xs text-slate-500">
                            Creado: {formatDate(caso.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {caso.cliente ? (
                            <>
                              <div className="font-medium text-slate-800">
                                {caso.cliente.nombre} {caso.cliente.apellido}
                              </div>
                              <div className="text-xs text-slate-500">
                                Doc: {caso.cliente.documento}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">Sin cliente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant="outline">
                            {TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={prioridadConfig.badge}>
                            <IconoPrioridad size={12} />
                            {prioridadConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle text-sm">
                          {caso.responsable.nombre} {caso.responsable.apellido}
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <Badge variant="info">{diasActivo} días</Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1">
                            <Link href={`/casos/${caso.id}`}>
                              <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            <Link href={`/casos/${caso.id}/actuaciones`}>
                              <Button variant="outline" size="icon" title="Actuaciones">
                                <Edit3 size={14} />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="mb-0 text-xs text-slate-500">
                    Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)} · {pagination.total} casos
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={14} />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(pagination.total / pagination.limit)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
