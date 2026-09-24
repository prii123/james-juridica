'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Scale,
  Plus,
  Calendar,
  Search,
  Filter,
  Eye,
  Phone,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria, ResultadoAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: Date
  duracion?: number | null
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string | null
  notas?: string | null
  resultado?: ResultadoAsesoria | null
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
  }
  createdAt: Date
}

interface Filters {
  tipo?: TipoAsesoria
  modalidad?: ModalidadAsesoria
  asesorId?: string
  search?: string
}

const ESTADO_BADGE: Record<EstadoAsesoria, BadgeProps['variant']> = {
  PENDIENTE: 'secondary',
  PROGRAMADA: 'warning',
  REALIZADA: 'success',
  CANCELADA: 'danger',
  REPROGRAMADA: 'info',
}

// "Agenda" agrupa lo que aún necesita atención (por venir o por reprogramar) y se ordena por
// fecha ascendente para que lo más próximo salga primero. Las otras dos son historial.
type Vista = 'agenda' | 'realizadas' | 'canceladas'

const VISTAS: Record<Vista, { label: string; estados: EstadoAsesoria[]; orden: 'asc' | 'desc' }> = {
  agenda: { label: 'Agenda', estados: ['PENDIENTE', 'PROGRAMADA', 'REPROGRAMADA'], orden: 'asc' },
  realizadas: { label: 'Realizadas', estados: ['REALIZADA'], orden: 'desc' },
  canceladas: { label: 'Canceladas', estados: ['CANCELADA'], orden: 'desc' },
}

function esVista(v: string | null): v is Vista {
  return v === 'agenda' || v === 'realizadas' || v === 'canceladas'
}

export default function AsesoriaPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AsesoriaPageContent />
    </Suspense>
  )
}

function AsesoriaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vistaParam = searchParams.get('vista')
  const vista: Vista = esVista(vistaParam) ? vistaParam : 'agenda'

  const [asesorias, setAsesorias] = useState<Asesoria[]>([])
  const [conteos, setConteos] = useState<Record<Vista, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [subEstado, setSubEstado] = useState<EstadoAsesoria | ''>('') // solo aplica en "Agenda"
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 })

  const cambiarVista = (v: Vista) => {
    setSubEstado('')
    router.push(`/asesorias?vista=${v}`)
  }

  // Cambiar de pestaña, sub-estado o filtros vuelve a la página 1.
  useEffect(() => {
    setPage(1)
  }, [vista, subEstado, filters])

  const fetchAsesorias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { estados, orden } = VISTAS[vista]
      const params = new URLSearchParams()
      params.append('estado', subEstado || estados.join(','))
      params.append('orden', orden)
      params.append('page', String(page))
      params.append('limit', '50')
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.modalidad) params.append('modalidad', filters.modalidad)
      if (filters.asesorId) params.append('asesorId', filters.asesorId)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/asesorias?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Error al cargar las asesorías')
        setAsesorias([])
        return
      }
      const lista: Asesoria[] = data.asesorias ?? data
      setAsesorias(lista)
      setPagination({
        total: data.total ?? lista.length,
        page: data.page ?? 1,
        limit: data.limit ?? 50,
      })
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setAsesorias([])
    } finally {
      setLoading(false)
    }
  }, [vista, subEstado, filters, page])

  const fetchConteos = useCallback(async () => {
    try {
      const res = await fetch('/api/asesorias/stats')
      if (!res.ok) return
      const stats = await res.json()
      setConteos({
        agenda: (stats.porEstado?.PENDIENTE ?? 0) + (stats.porEstado?.PROGRAMADA ?? 0) + (stats.porEstado?.REPROGRAMADA ?? 0),
        realizadas: stats.porEstado?.REALIZADA ?? 0,
        canceladas: stats.porEstado?.CANCELADA ?? 0,
      })
    } catch {
      // Los contadores de las pestañas no son críticos.
    }
  }, [])

  useEffect(() => {
    fetchAsesorias()
  }, [fetchAsesorias])

  useEffect(() => {
    fetchConteos()
  }, [fetchConteos, asesorias])

  const getTipoText = (tipo: TipoAsesoria) => {
    switch (tipo) {
      case 'INICIAL': return 'Inicial'
      case 'SEGUIMIENTO': return 'Seguimiento'
      case 'ESPECIALIZADA': return 'Especializada'
      default: return tipo
    }
  }

  const getModalidadIcon = (modalidad: ModalidadAsesoria) => {
    switch (modalidad) {
      case 'PRESENCIAL': return <Users size={14} />
      case 'VIRTUAL': return <Video size={14} />
      case 'TELEFONICA': return <Phone size={14} />
      default: return <Users size={14} />
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Asesorías' }]} />

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
            {conteos && (
              <Badge variant={vista === v ? 'primary' : 'secondary'}>{conteos[v]}</Badge>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="mb-3 flex items-center justify-end gap-2">
          <Link href="/asesorias/nueva">
            <Button>
              <Plus size={16} />
              Nueva Asesoría
            </Button>
          </Link>
          <Link href="/calendario">
            <Button variant="outline">
              <Calendar size={16} />
              Calendario
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card>
          <CardBody className="p-3">
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  className="pl-9"
                  placeholder="Buscar por tema, lead o asesor..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:self-end">
                <Filter size={16} />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                {vista === 'agenda' && (
                  <Select value={subEstado} onChange={(e) => setSubEstado(e.target.value as EstadoAsesoria | '')}>
                    <option value="">Pendiente, Programada y Reprogramada</option>
                    <option value="PENDIENTE">Solo Pendiente</option>
                    <option value="PROGRAMADA">Solo Programada</option>
                    <option value="REPROGRAMADA">Solo Reprogramada</option>
                  </Select>
                )}
                <Select
                  value={filters.tipo || ''}
                  onChange={(e) => setFilters({ ...filters, tipo: (e.target.value as TipoAsesoria) || undefined })}
                >
                  <option value="">Todos los tipos</option>
                  <option value="INICIAL">Inicial</option>
                  <option value="SEGUIMIENTO">Seguimiento</option>
                  <option value="ESPECIALIZADA">Especializada</option>
                </Select>
                <Select
                  value={filters.modalidad || ''}
                  onChange={(e) => setFilters({ ...filters, modalidad: (e.target.value as ModalidadAsesoria) || undefined })}
                >
                  <option value="">Todas las modalidades</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="TELEFONICA">Telefónica</option>
                </Select>
                <Button
                  variant="outlineDanger"
                  onClick={() => {
                    setFilters({})
                    setSubEstado('')
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Lista de Asesorías */}
      <Card>
        <CardHeader>
          <CardTitle>{VISTAS[vista].label}</CardTitle>
          <Badge variant="primary">
            {pagination.total > 0 ? pagination.total : asesorias.length} asesorías
          </Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="py-5 text-center">
              <Alert variant="danger" title="Error al cargar asesorías" className="mx-4 mb-4 text-left">
                {error}
              </Alert>
              <Button
                onClick={() => {
                  setError(null)
                  fetchAsesorias()
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : asesorias.length === 0 ? (
            <div className="py-5 text-center">
              <Scale size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-700">Sin asesorías en &quot;{VISTAS[vista].label}&quot;</h5>
              <p className="mb-3 text-slate-500">No se encontraron asesorías que coincidan con los filtros.</p>
              {vista === 'agenda' && (
                <Link href="/asesorias/nueva">
                  <Button>Crear primera asesoría</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tema</th>
                    <th className="px-4 py-3 font-semibold">Lead</th>
                    <th className="px-4 py-3 font-semibold">Asesor</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Modalidad</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asesorias.map((asesoria) => (
                    <tr key={asesoria.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold text-slate-800">{asesoria.tema}</div>
                        {asesoria.descripcion && (
                          <small className="text-slate-500">{asesoria.descripcion.substring(0, 50)}...</small>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/leads/${asesoria.lead.id}`} className="text-blue-800 no-underline hover:underline">
                          {asesoria.lead.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle">{asesoria.asesor.nombre} {asesoria.asesor.apellido}</td>
                      <td className="px-4 py-3 align-middle">{getTipoText(asesoria.tipo)}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          {getModalidadIcon(asesoria.modalidad)}
                          <small>{asesoria.modalidad}</small>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-xs">
                        <div>{new Date(asesoria.fecha).toLocaleDateString()}</div>
                        <div className="text-slate-500">{new Date(asesoria.fecha).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant={ESTADO_BADGE[asesoria.estado]}>{asesoria.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/asesorias/${asesoria.id}`}>
                          <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                            <Eye size={14} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="mb-0 text-xs text-slate-500">
                    Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)} · {pagination.total} asesorías
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
