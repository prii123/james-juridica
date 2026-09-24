'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { Users, Plus, Search, Filter, Eye, Edit, Phone, Mail, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { EstadoLead, TipoPersona } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa?: string | null
  tipoPersona: TipoPersona
  estado: EstadoLead
  origen?: string | null
  fechaSeguimiento?: Date | null
  createdAt: Date
  responsable?: {
    nombre: string
    apellido: string
  } | null
  // Se calcula en el servidor: existe un Cliente con el mismo email que este lead.
  cliente?: { id: string; documento: string } | null
}

interface Filters {
  tipoPersona?: TipoPersona
  search?: string
}

const ESTADO_BADGE_VARIANT: Record<EstadoLead, BadgeProps['variant']> = {
  NUEVO: 'primary',
  CONTACTADO: 'info',
  CALIFICADO: 'success',
  PERDIDO: 'danger',
}

// Las tres pantallas de trabajo: "Nuevos" es la bandeja de entrada, "En gestión" agrupa a
// quienes ya se les hizo seguimiento, y "Perdidos" queda aparte para no estorbar el día a día.
type Vista = 'nuevos' | 'gestion' | 'perdidos'

const VISTAS: Record<Vista, { label: string; estados: EstadoLead[]; orden: 'asc' | 'desc' }> = {
  nuevos: { label: 'Nuevos', estados: ['NUEVO'], orden: 'asc' },
  gestion: { label: 'En gestión', estados: ['CONTACTADO', 'CALIFICADO'], orden: 'desc' },
  perdidos: { label: 'Perdidos', estados: ['PERDIDO'], orden: 'desc' },
}

function esVista(v: string | null): v is Vista {
  return v === 'nuevos' || v === 'gestion' || v === 'perdidos'
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LeadsPageContent />
    </Suspense>
  )
}

function LeadsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vistaParam = searchParams.get('vista')
  const vista: Vista = esVista(vistaParam) ? vistaParam : 'nuevos'

  const [leads, setLeads] = useState<Lead[]>([])
  const [conteos, setConteos] = useState<Record<Vista, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [subEstado, setSubEstado] = useState<EstadoLead | ''>('') // solo aplica en "En gestión"
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 })

  const cambiarVista = (v: Vista) => {
    setSubEstado('')
    router.push(`/leads?vista=${v}`)
  }

  // Cambiar de pestaña, sub-estado o filtros vuelve a la página 1: seguir en la página 3 de
  // "Nuevos" al saltar a "Perdidos" no tendría sentido.
  useEffect(() => {
    setPage(1)
  }, [vista, subEstado, filters])

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { estados, orden } = VISTAS[vista]
      const params = new URLSearchParams()
      params.append('estado', subEstado || estados.join(','))
      params.append('orden', orden)
      params.append('page', String(page))
      params.append('limit', '50')
      if (filters.tipoPersona) params.append('tipoPersona', filters.tipoPersona)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/leads?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Error al cargar los leads')
        setLeads([])
        return
      }
      if (Array.isArray(data)) {
        setLeads(data)
        setPagination({ total: data.length, page: 1, limit: 50 })
      } else if (Array.isArray(data.leads)) {
        setLeads(data.leads)
        setPagination({ total: data.total ?? data.leads.length, page: data.page ?? 1, limit: data.limit ?? 50 })
      } else {
        setLeads([])
        setError('Formato de respuesta inesperado del servidor')
      }
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [vista, subEstado, filters, page])

  const fetchConteos = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/stats')
      if (!res.ok) return
      const stats = await res.json()
      setConteos({
        nuevos: stats.porEstado?.NUEVO ?? 0,
        gestion: (stats.porEstado?.CONTACTADO ?? 0) + (stats.porEstado?.CALIFICADO ?? 0),
        perdidos: stats.porEstado?.PERDIDO ?? 0,
      })
    } catch {
      // Los contadores de las pestañas no son críticos.
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetchConteos()
  }, [fetchConteos, leads])

  const getTipoPersonaText = (tipo: TipoPersona) => (tipo === 'NATURAL' ? 'Natural' : 'Jurídica')

  return (
    <>
      <Breadcrumb items={[{ label: 'Leads' }]} />

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
        <div className="mb-3 flex items-center justify-end">
          <Link href="/leads/nuevo">
            <Button>
              <Plus size={16} />
              Nuevo Lead
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardBody className="p-3">
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  className="pl-9"
                  placeholder="Buscar leads..."
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
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {vista === 'gestion' && (
                  <Select value={subEstado} onChange={(e) => setSubEstado(e.target.value as EstadoLead | '')}>
                    <option value="">Contactado y Calificado</option>
                    <option value="CONTACTADO">Solo Contactado</option>
                    <option value="CALIFICADO">Solo Calificado</option>
                  </Select>
                )}
                <Select
                  value={filters.tipoPersona || ''}
                  onChange={(e) => setFilters({ ...filters, tipoPersona: (e.target.value as TipoPersona) || undefined })}
                >
                  <option value="">Todos los tipos</option>
                  <option value="NATURAL">Persona Natural</option>
                  <option value="JURIDICA">Persona Jurídica</option>
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

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{VISTAS[vista].label}</CardTitle>
          <Badge variant="primary">
            {pagination.total > 0 ? pagination.total : leads.length} leads
          </Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="py-5 text-center">
              <Alert variant="danger" title="Error al cargar leads" className="mx-4 mb-4 text-left">
                {error}
              </Alert>
              <Button
                onClick={() => {
                  setError(null)
                  fetchLeads()
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : leads.length === 0 ? (
            <div className="py-5 text-center">
              <Users size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-700">Sin leads en &quot;{VISTAS[vista].label}&quot;</h5>
              <p className="mb-3 text-slate-500">No se encontraron leads que coincidan con los filtros seleccionados.</p>
              {vista === 'nuevos' && (
                <Link href="/leads/nuevo">
                  <Button>Crear primer lead</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Responsable</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/leads/${lead.id}`} className="font-semibold text-slate-800 no-underline hover:text-blue-800">
                          {lead.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle">{lead.empresa || '-'}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="flex items-center gap-1 text-slate-700">
                            <Mail size={12} />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone size={12} />
                            {lead.telefono}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">{getTipoPersonaText(lead.tipoPersona)}</td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant={ESTADO_BADGE_VARIANT[lead.estado]}>{lead.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {lead.cliente ? (
                          <Badge variant="success" title={`Doc: ${lead.cliente.documento}`}>
                            <CheckCircle2 size={12} />
                            Cliente
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {lead.responsable ?
                          `${lead.responsable.nombre} ${lead.responsable.apellido}` :
                          <span className="text-slate-500">Sin asignar</span>
                        }
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs text-slate-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1">
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="outline" size="icon" title="Ver detalles">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Link href={`/leads/${lead.id}/editar`}>
                            <Button variant="outline" size="icon" title="Editar">
                              <Edit size={14} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="mb-0 text-xs text-slate-500">
                    Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)} · {pagination.total} leads
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
