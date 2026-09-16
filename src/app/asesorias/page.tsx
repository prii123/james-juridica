'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Scale,
  Plus,
  Calendar,
  Search,
  Filter,
  Eye,
  Clock,
  Phone,
  Video,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria, ResultadoAsesoria } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert, type BadgeProps } from '@/components/ui'

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

interface AsesoriaFilters {
  estado?: EstadoAsesoria
  tipo?: TipoAsesoria
  modalidad?: ModalidadAsesoria
  asesorId?: string
  search?: string
  fechaInicio?: string
  fechaFin?: string
}

const ESTADO_BADGE: Record<EstadoAsesoria, BadgeProps['variant']> = {
  PENDIENTE: 'secondary',
  PROGRAMADA: 'warning',
  REALIZADA: 'success',
  CANCELADA: 'danger',
  REPROGRAMADA: 'info',
}

export default function AsesoriaPage() {
  const [asesorias, setAsesorias] = useState<Asesoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AsesoriaFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    realizadas: 0,
    canceladas: 0,
    pendientesHoy: 0
  })

  useEffect(() => {
    fetchAsesorias()
  }, [filters])

  const fetchAsesorias = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()

      if (filters.estado) queryParams.append('estado', filters.estado)
      if (filters.tipo) queryParams.append('tipo', filters.tipo)
      if (filters.modalidad) queryParams.append('modalidad', filters.modalidad)
      if (filters.asesorId) queryParams.append('asesorId', filters.asesorId)
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin)

      const response = await fetch(`/api/asesorias?${queryParams.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setAsesorias(data.asesorias || data)

        const list: Asesoria[] = data.asesorias || data
        const total = list.length
        const programadas = list.filter((a) => a.estado === 'PROGRAMADA').length
        const realizadas = list.filter((a) => a.estado === 'REALIZADA').length
        const canceladas = list.filter((a) => a.estado === 'CANCELADA').length

        const hoy = new Date().toDateString()
        const pendientesHoy = list.filter((a) =>
          new Date(a.fecha).toDateString() === hoy && a.estado === 'PROGRAMADA'
        ).length

        setStats({ total, programadas, realizadas, canceladas, pendientesHoy })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al cargar las asesorías')
        setAsesorias([])
      }
    } catch (error) {
      console.error('Error al cargar asesorías:', error)
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setAsesorias([])
    } finally {
      setLoading(false)
    }
  }

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

  const statCards: Array<{ icon: typeof Scale; value: number; label: string; bg: string }> = [
    { icon: Scale, value: stats.total, label: 'Total Asesorías', bg: 'bg-blue-800' },
    { icon: Clock, value: stats.programadas, label: 'Programadas', bg: 'bg-amber-500' },
    { icon: CheckCircle, value: stats.realizadas, label: 'Realizadas', bg: 'bg-teal-700' },
    { icon: AlertCircle, value: stats.pendientesHoy, label: 'Pendientes Hoy', bg: 'bg-sky-600' },
  ]

  return (
    <>
      <Breadcrumb items={[{ label: 'Asesorías' }]} />

      {/* Header */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-800">Asesorías</h1>
            <p className="mb-0 text-slate-500">Gestión de asesorías y consultas jurídicas</p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Estadísticas */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className={`${stat.bg} border-0 text-white`}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="mb-1 text-2xl font-bold">{stat.value}</h4>
                    <small>{stat.label}</small>
                  </div>
                  <stat.icon size={32} />
                </div>
              </CardBody>
            </Card>
          ))}
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
                <Select
                  value={filters.estado || ''}
                  onChange={(e) => setFilters({ ...filters, estado: (e.target.value as EstadoAsesoria) || undefined })}
                >
                  <option value="">Todos los estados</option>
                  <option value="PROGRAMADA">Programada</option>
                  <option value="REALIZADA">Realizada</option>
                  <option value="CANCELADA">Cancelada</option>
                  <option value="REPROGRAMADA">Reprogramada</option>
                </Select>
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
                <Button variant="outlineDanger" onClick={() => setFilters({})}>
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
          <CardTitle>Lista de Asesorías</CardTitle>
          <Badge variant="primary">{asesorias.length} asesorías</Badge>
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
              <h5 className="text-base font-semibold text-slate-700">No hay asesorías</h5>
              <p className="mb-3 text-slate-500">No se encontraron asesorías que coincidan con los filtros.</p>
              <Link href="/asesorias/nueva">
                <Button>Crear primera asesoría</Button>
              </Link>
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
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
