'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Select, Label, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Actuacion {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  estado: 'PENDIENTE' | 'TRAMITE' | 'COMPLETADA' | 'VENCIDA'
  fechaCreacion: string
  fechaVencimiento?: string
  fechaCompletada?: string
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
  documentos?: Array<{ id: string; nombre: string; url: string }>
}

interface Caso {
  id: string
  numeroCaso: string
  cliente: {
    nombre: string
    apellido?: string
  }
}

const ESTADO_CONFIG: Record<Actuacion['estado'], { badge: BadgeProps['variant']; icon: typeof Clock; label: string }> = {
  PENDIENTE: { badge: 'warning', icon: Clock, label: 'Pendiente' },
  TRAMITE: { badge: 'primary', icon: AlertTriangle, label: 'En Trámite' },
  COMPLETADA: { badge: 'success', icon: CheckCircle, label: 'Completada' },
  VENCIDA: { badge: 'danger', icon: XCircle, label: 'Vencida' },
}

const TIPO_ACTUACIONES = {
  'DERECHO_PETICION': 'Derecho de Petición',
  'LEVANTAMIENTO_EMBARGO': 'Levantamiento de Embargos',
  'RESPUESTA_JUZGADO': 'Respuesta del Juzgado',
  'MEMORIAL': 'Memorial',
  'PODER': 'Poder',
  'DEMANDA': 'Demanda',
  'CONTESTACION': 'Contestación',
  'ALEGATOS': 'Alegatos',
  'RECURSO': 'Recurso',
  'OTROS': 'Otros'
}

export default function ActuacionesPage() {
  const params = useParams()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<Caso | null>(null)
  const [actuaciones, setActuaciones] = useState<Actuacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [casoId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Obtener información del caso
      const casoResponse = await fetch(`/api/casos/${casoId}`)
      if (casoResponse.ok) {
        const casoData = await casoResponse.json()
        setCaso(casoData)
      }

      // Obtener actuaciones (API endpoint que necesitamos crear)
      const actuacionesResponse = await fetch(`/api/casos/${casoId}/actuaciones`)
      if (actuacionesResponse.ok) {
        const actuacionesData = await actuacionesResponse.json()
        setActuaciones(actuacionesData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setActuaciones([])
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

  const isVencida = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const getDaysUntilDeadline = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null
    const today = new Date()
    const deadline = new Date(fechaVencimiento)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const actuacionesFiltradas = actuaciones.filter(actuacion => {
    const matchEstado = !filtroEstado || actuacion.estado === filtroEstado
    const matchTipo = !filtroTipo || actuacion.tipo === filtroTipo
    return matchEstado && matchTipo
  })

  const estadisticas = {
    total: actuaciones.length,
    pendientes: actuaciones.filter(a => a.estado === 'PENDIENTE').length,
    tramite: actuaciones.filter(a => a.estado === 'TRAMITE').length,
    completadas: actuaciones.filter(a => a.estado === 'COMPLETADA').length,
    vencidas: actuaciones.filter(a => a.estado === 'VENCIDA').length
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

  const nuevaActuacionLinks = [
    { href: `/casos/${casoId}/actuaciones/memorial/nuevo`, label: 'Memorial' },
    { href: `/casos/${casoId}/actuaciones/poder/nuevo`, label: 'Poder' },
    { href: `/casos/${casoId}/actuaciones/demanda/nuevo`, label: 'Demanda' },
    { href: `/casos/${casoId}/actuaciones/recurso/nuevo`, label: 'Recurso' },
  ]

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Actuaciones' }
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/casos/${casoId}`}>
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-0 text-xl font-bold text-slate-800">Actuaciones</h1>
            <p className="mb-0 text-slate-500">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/casos/${casoId}/actuaciones/derecho-peticion/nuevo`}>
            <Button variant="outlinePrimary">
              <Plus size={16} />
              Derecho de Petición
            </Button>
          </Link>
          <Link href={`/casos/${casoId}/actuaciones/levantamiento-embargos/nuevo`}>
            <Button variant="outlinePrimary">
              <Plus size={16} />
              Levantamiento Embargos
            </Button>
          </Link>
          <div className="relative" ref={dropdownRef}>
            <Button onClick={() => setShowDropdown((v) => !v)}>
              <Plus size={16} />
              Nueva Actuación
              <ChevronDown size={14} />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {nuevaActuacionLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <hr className="my-1 border-slate-200" />
                <Link
                  href={`/casos/${casoId}/actuaciones/general/nuevo`}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowDropdown(false)}
                >
                  Otra Actuación
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Card className="bg-slate-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-slate-800">{estadisticas.total}</div>
            <small className="text-slate-500">Total</small>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-amber-600">{estadisticas.pendientes}</div>
            <small className="text-slate-500">Pendientes</small>
          </CardBody>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-blue-800">{estadisticas.tramite}</div>
            <small className="text-slate-500">En Trámite</small>
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
            <div className="mb-0 text-xl font-bold text-red-600">{estadisticas.vencidas}</div>
            <small className="text-slate-500">Vencidas</small>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><Filter size={14} />Filtrar por Estado</Label>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="TRAMITE">En Trámite</option>
                <option value="COMPLETADA">Completada</option>
                <option value="VENCIDA">Vencida</option>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><FileText size={14} />Filtrar por Tipo</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_ACTUACIONES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-4">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setFiltroEstado(''); setFiltroTipo('') }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Actuaciones */}
      <Card>
        <CardHeader><CardTitle>Actuaciones ({actuacionesFiltradas.length})</CardTitle></CardHeader>
        <CardBody>
          {actuacionesFiltradas.length === 0 ? (
            <div className="py-5 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay actuaciones</h5>
              <p className="text-slate-500">
                {actuaciones.length === 0
                  ? 'Aún no se han creado actuaciones para este caso.'
                  : 'No se encontraron actuaciones con los filtros seleccionados.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Título</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Responsable</th>
                    <th className="px-4 py-3 font-semibold">Creada</th>
                    <th className="px-4 py-3 font-semibold">Vencimiento</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actuacionesFiltradas.map((actuacion) => {
                    const estadoConfig = ESTADO_CONFIG[actuacion.estado] || ESTADO_CONFIG.PENDIENTE
                    const IconoEstado = estadoConfig.icon
                    const diasVencimiento = getDaysUntilDeadline(actuacion.fechaVencimiento)
                    const estaVencida = isVencida(actuacion.fechaVencimiento)

                    return (
                      <tr key={actuacion.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle">
                          <Badge variant="outline">
                            {TIPO_ACTUACIONES[actuacion.tipo as keyof typeof TIPO_ACTUACIONES] || actuacion.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-medium text-slate-800">{actuacion.titulo}</div>
                          {actuacion.descripcion && (
                            <small className="block text-slate-500">
                              {actuacion.descripcion.length > 50
                                ? `${actuacion.descripcion.substring(0, 50)}...`
                                : actuacion.descripcion
                              }
                            </small>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <small>{actuacion.responsable.nombre} {actuacion.responsable.apellido}</small>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <small>{formatDate(actuacion.fechaCreacion)}</small>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {actuacion.fechaVencimiento ? (
                            <div>
                              <small className={cn(estaVencida ? 'font-bold text-red-600' : 'text-slate-500')}>
                                {formatDate(actuacion.fechaVencimiento)}
                              </small>
                              {diasVencimiento !== null && (
                                <div>
                                  <small className={cn(
                                    diasVencimiento < 0 ? 'text-red-600' :
                                    diasVencimiento <= 5 ? 'text-amber-600' : 'text-slate-500'
                                  )}>
                                    {diasVencimiento < 0
                                      ? `Vencida hace ${Math.abs(diasVencimiento)} días`
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
                            <Link href={`/casos/${casoId}/actuaciones/${actuacion.id}`}>
                              <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            <Link href={`/casos/${casoId}/actuaciones/${actuacion.id}/editar`}>
                              <Button variant="outline" size="icon" title="Editar">
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
