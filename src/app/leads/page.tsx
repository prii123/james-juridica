'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { Users, Plus, Search, Filter, Eye, Edit, Phone, Mail } from 'lucide-react'
import { EstadoLead, TipoPersona } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert, type BadgeProps } from '@/components/ui'

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
}

interface LeadsFilters {
  estado?: EstadoLead
  tipoPersona?: TipoPersona
  search?: string
}

const ESTADO_BADGE_VARIANT: Record<EstadoLead, BadgeProps['variant']> = {
  NUEVO: 'primary',
  CONTACTADO: 'info',
  CALIFICADO: 'warning',
  CONVERTIDO: 'success',
  PERDIDO: 'danger',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<LeadsFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50
  })

  useEffect(() => {
    fetchLeads()
  }, [filters])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const queryParams = new URLSearchParams()

      if (filters.estado) queryParams.append('estado', filters.estado)
      if (filters.tipoPersona) queryParams.append('tipoPersona', filters.tipoPersona)
      if (filters.search) queryParams.append('search', filters.search)

      const response = await fetch(`/api/leads?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array response (old format) and object response (new format)
        if (Array.isArray(data)) {
          setLeads(data)
          setPagination({ total: data.length, page: 1, limit: 50 })
        } else if (data.leads && Array.isArray(data.leads)) {
          setLeads(data.leads)
          setPagination({
            total: data.total || data.leads.length,
            page: data.page || 1,
            limit: data.limit || 50
          })
        } else {
          console.error('Unexpected API response format:', data)
          setLeads([])
          setError('Formato de respuesta inesperado del servidor')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar los leads')
        setLeads([])
      }
    } catch (error) {
      console.error('Error al cargar leads:', error)
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const getTipoPersonaText = (tipo: TipoPersona) => {
    return tipo === 'NATURAL' ? 'Natural' : 'Jurídica'
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Leads' }]} />

      {/* Header */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-800">Leads</h1>
            <p className="mb-0 text-slate-500">Gestión de prospectos y oportunidades comerciales</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/leads/nuevo">
              <Button>
                <Plus size={16} />
                Nuevo Lead
              </Button>
            </Link>
          </div>
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
                <Select
                  value={filters.estado || ''}
                  onChange={(e) => setFilters({ ...filters, estado: (e.target.value as EstadoLead) || undefined })}
                >
                  <option value="">Todos los estados</option>
                  <option value="NUEVO">Nuevo</option>
                  <option value="CONTACTADO">Contactado</option>
                  <option value="CALIFICADO">Calificado</option>
                  <option value="CONVERTIDO">Convertido</option>
                  <option value="PERDIDO">Perdido</option>
                </Select>
                <Select
                  value={filters.tipoPersona || ''}
                  onChange={(e) => setFilters({ ...filters, tipoPersona: (e.target.value as TipoPersona) || undefined })}
                >
                  <option value="">Todos los tipos</option>
                  <option value="NATURAL">Persona Natural</option>
                  <option value="JURIDICA">Persona Jurídica</option>
                </Select>
                <Button variant="outlineDanger" onClick={() => setFilters({})}>
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
          <CardTitle>Lista de Leads</CardTitle>
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
              <h5 className="text-base font-semibold text-slate-700">No hay leads</h5>
              <p className="mb-3 text-slate-500">No se encontraron leads que coincidan con los filtros seleccionados.</p>
              <Link href="/leads/nuevo">
                <Button>Crear primer lead</Button>
              </Link>
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
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
