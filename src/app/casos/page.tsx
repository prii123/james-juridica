'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Pause
} from 'lucide-react'
import { EstadoCaso, TipoInsolvencia, Prioridad } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Label, Spinner, type BadgeProps } from '@/components/ui'

interface Caso {
  id: string
  numeroCaso: string
  tipoInsolvencia: TipoInsolvencia
  estado: EstadoCaso
  prioridad: Prioridad
  fechaInicio: string
  fechaCierre?: string
  createdAt: string
  cliente: {
    id: string
    nombre: string
    apellido?: string
    documento: string
  }
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
}

const ESTADO_CONFIG: Record<EstadoCaso, { badge: BadgeProps['variant']; icon: typeof Play; label: string; statText: string }> = {
  ACTIVO: { badge: 'success', icon: Play, label: 'Activo', statText: 'text-teal-700' },
  CERRADO: { badge: 'secondary', icon: CheckCircle, label: 'Cerrado', statText: 'text-slate-600' },
  SUSPENDIDO: { badge: 'warning', icon: Pause, label: 'Suspendido', statText: 'text-amber-600' },
  ARCHIVADO: { badge: 'secondary', icon: Archive, label: 'Archivado', statText: 'text-slate-600' },
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

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    fetchCasos()
  }, [])

  const fetchCasos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/casos')

      if (response.ok) {
        const data = await response.json()
        // La API devuelve un objeto con estructura { casos: [], total, page, limit, totalPages }
        if (data && Array.isArray(data.casos)) {
          setCasos(data.casos)
        } else if (Array.isArray(data)) {
          // Fallback por si la respuesta es directamente un array
          setCasos(data)
        } else {
          console.error('La respuesta no tiene el formato esperado:', data)
          setCasos([])
        }
      } else {
        console.error('Error al cargar casos')
        setCasos([])
      }
    } catch (error) {
      console.error('Error al cargar casos:', error)
      setCasos([])
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

  const calculateDaysActive = (fechaInicio: string, fechaCierre?: string) => {
    const inicio = new Date(fechaInicio)
    const fin = fechaCierre ? new Date(fechaCierre) : new Date()
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const casosFiltrados = Array.isArray(casos) ? casos.filter(caso => {
    const matchSearch = !searchTerm ||
      caso.numeroCaso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caso.cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      caso.cliente.documento.includes(searchTerm)

    const matchEstado = !filtroEstado || caso.estado === filtroEstado
    const matchPrioridad = !filtroPrioridad || caso.prioridad === filtroPrioridad
    const matchTipo = !filtroTipo || caso.tipoInsolvencia === filtroTipo

    return matchSearch && matchEstado && matchPrioridad && matchTipo
  }) : []

  const estadisticas = {
    total: Array.isArray(casos) ? casos.length : 0,
    activos: Array.isArray(casos) ? casos.filter(c => c.estado === 'ACTIVO').length : 0,
    cerrados: Array.isArray(casos) ? casos.filter(c => c.estado === 'CERRADO').length : 0,
    suspendidos: Array.isArray(casos) ? casos.filter(c => c.estado === 'SUSPENDIDO').length : 0,
    criticos: Array.isArray(casos) ? casos.filter(c => c.prioridad === 'CRITICA').length : 0,
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Casos' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Casos Jurídicos</h1>
          <p className="mb-0 text-slate-500">Gestión de procesos de insolvencia</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/casos/nuevo">
            <Button>
              <Plus size={16} />
              Nuevo Caso
            </Button>
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-slate-50 text-center">
          <CardBody className="py-3">
            <div className="mb-0 text-2xl font-bold text-slate-800">{estadisticas.total}</div>
            <small className="text-slate-500">Total Casos</small>
          </CardBody>
        </Card>
        <Card className="bg-teal-50 text-center">
          <CardBody className="py-3">
            <div className="mb-0 text-2xl font-bold text-teal-700">{estadisticas.activos}</div>
            <small className="text-slate-500">Activos</small>
          </CardBody>
        </Card>
        <Card className="bg-slate-100 text-center">
          <CardBody className="py-3">
            <div className="mb-0 text-2xl font-bold text-slate-600">{estadisticas.cerrados}</div>
            <small className="text-slate-500">Cerrados</small>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 text-center">
          <CardBody className="py-3">
            <div className="mb-0 text-2xl font-bold text-amber-600">{estadisticas.suspendidos}</div>
            <small className="text-slate-500">Suspendidos</small>
          </CardBody>
        </Card>
        <Card className="bg-red-50 text-center">
          <CardBody className="py-3">
            <div className="mb-0 text-2xl font-bold text-red-600">{estadisticas.criticos}</div>
            <small className="text-slate-500">Críticos</small>
          </CardBody>
        </Card>
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
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="CERRADO">Cerrado</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="ARCHIVADO">Archivado</option>
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
                  setFiltroEstado('')
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
            Casos ({casosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Spinner />
          ) : casosFiltrados.length === 0 ? (
            <div className="py-5 text-center">
              <Briefcase size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">
                {casos.length === 0 ? 'No hay casos registrados' : 'No se encontraron casos'}
              </h5>
              <p className="text-slate-500">
                {casos.length === 0
                  ? 'Los casos se crean automáticamente cuando una radicación es aceptada por el juzgado.'
                  : 'Intenta con otros filtros de búsqueda.'
                }
              </p>
              {casos.length === 0 && (
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
                  {casosFiltrados.map((caso) => {
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
                          <div className="font-medium text-slate-800">
                            {caso.cliente.nombre} {caso.cliente.apellido}
                          </div>
                          <div className="text-xs text-slate-500">
                            Doc: {caso.cliente.documento}
                          </div>
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
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
