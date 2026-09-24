'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Plus,
  Search,
  Calendar,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { EstadoRadicacion } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Radicacion {
  id: string
  numero: string
  estado: EstadoRadicacion
  fechaSolicitud: string
  fechaAudiencia?: string
  createdAt: string
  // Puede ser null: alguna radicación anterior a este campo no pudo resolverse en la migración.
  cliente: {
    id: string
    nombre: string
    apellido?: string | null
    documento: string
  } | null
  // Puede ser null: una radicación se puede crear directamente, sin pasar por una asesoría.
  asesoria: {
    id: string
    tema: string
    lead: {
      id: string
      nombre: string
      email: string
    }
    asesor: {
      id: string
      nombre: string
      apellido: string
    }
  } | null
}

const ESTADO_CONFIG: Record<EstadoRadicacion, { badge: BadgeProps['variant']; icon: typeof Clock; label: string }> = {
  SOLICITADA: { badge: 'warning', icon: Clock, label: 'Solicitada' },
  PROGRAMADA: { badge: 'primary', icon: Calendar, label: 'Programada' },
  REALIZADA: { badge: 'success', icon: CheckCircle, label: 'Realizada' },
  CANCELADA: { badge: 'danger', icon: XCircle, label: 'Cancelada' },
}

export default function RadicacionesPage() {
  const [radicaciones, setRadicaciones] = useState<Radicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoRadicacion | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRadicaciones()
  }, [search, estadoFilter, currentPage])

  const fetchRadicaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (search) params.append('search', search)
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/radicaciones?${params}`)

      if (response.ok) {
        const data = await response.json()
        setRadicaciones(data.radicaciones)
        setTotalPages(data.pagination.pages)
      } else {
        console.error('Error al cargar radicaciones')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const calculateDaysElapsed = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = now.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: EstadoRadicacion | '') => {
    setEstadoFilter(value)
    setCurrentPage(1)
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Radicaciones' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Radicaciones</h1>
          <p className="mb-0 text-slate-500">Gestiona todas las radicaciones del sistema</p>
        </div>
        <Link href="/radicaciones/nueva">
          <Button>
            <Plus size={16} />
            Nueva Conciliación
          </Button>
        </Link>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-9">
            <div className="relative md:col-span-6">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por número, cliente o documento..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="relative md:col-span-3">
              <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Select
                className="pl-9"
                value={estadoFilter}
                onChange={(e) => handleFilterChange(e.target.value as EstadoRadicacion)}
              >
                <option value="">Todos los estados</option>
                <option value="SOLICITADA">Solicitada</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="REALIZADA">Realizada</option>
                <option value="CANCELADA">Cancelada</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de radicaciones */}
      <Card>
        <CardHeader><CardTitle>Listado de Radicaciones</CardTitle></CardHeader>
        <CardBody>
          {loading ? (
            <Spinner />
          ) : radicaciones.length === 0 ? (
            <div className="py-5 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay radicaciones</h5>
              <p className="mb-3 text-slate-500">
                {search || estadoFilter
                  ? 'No se encontraron radicaciones con los criterios de búsqueda.'
                  : 'Aún no se han creado radicaciones en el sistema.'
                }
              </p>
              <Link href="/radicaciones/nueva">
                <Button>
                  <Plus size={16} />
                  Crear Primera Conciliación
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Número</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Fecha Solicitud</th>
                    <th className="px-4 py-3 font-semibold">Días</th>
                    <th className="px-4 py-3 font-semibold">Asesoría Origen</th>
                    <th className="px-4 py-3 font-semibold">Asesor</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {radicaciones.map((radicacion) => {
                    const estadoConfig = ESTADO_CONFIG[radicacion.estado]
                    const IconoEstado = estadoConfig.icon
                    const diasTranscurridos = calculateDaysElapsed(radicacion.fechaSolicitud)
                    const isOverdue = diasTranscurridos > 10

                    return (
                      <tr key={radicacion.id} className={cn(isOverdue ? 'bg-red-50' : 'hover:bg-slate-50')}>
                        <td className="px-4 py-3 align-middle">
                          <Link href={`/radicaciones/${radicacion.id}`} className="font-semibold text-slate-800 no-underline hover:text-blue-800">
                            {radicacion.numero}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          {radicacion.cliente ? (
                            <>
                              <div className="font-semibold text-slate-800">
                                {radicacion.cliente.nombre} {radicacion.cliente.apellido || ''}
                              </div>
                              <div className="text-slate-500">Doc: {radicacion.cliente.documento}</div>
                            </>
                          ) : (
                            <span className="text-amber-600">Sin cliente asignado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          <div>{formatDate(radicacion.fechaSolicitud)}</div>
                          {radicacion.fechaAudiencia && (
                            <div className="text-slate-500">Audiencia: {formatDate(radicacion.fechaAudiencia)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center align-middle text-xs">
                          <div className={cn('flex items-center justify-center gap-1 font-semibold', isOverdue ? 'text-red-600' : 'text-blue-800')}>
                            {isOverdue && <AlertCircle size={14} />}
                            {diasTranscurridos} días
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs">
                          {radicacion.asesoria ? (
                            <>
                              <Link href={`/asesorias/${radicacion.asesoria.id}`} className="text-blue-800 no-underline hover:underline">
                                {radicacion.asesoria.tema}
                              </Link>
                              <div className="text-slate-500">Cliente: {radicacion.asesoria.lead.nombre}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">Directa (sin asesoría)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-xs font-semibold text-slate-800">
                          {radicacion.asesoria
                            ? `${radicacion.asesoria.asesor.nombre} ${radicacion.asesoria.asesor.apellido}`
                            : <span className="font-normal text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Link href={`/radicaciones/${radicacion.id}`}>
                            <Button variant="outlinePrimary" size="sm">Ver</Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
