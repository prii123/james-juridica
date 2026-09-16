'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Eye,
  X,
  UserPlus
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Select, Label, Alert, Spinner, Modal, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Responsable {
  id: string
  usuario: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono?: string
    cargo?: string
  }
  rol: 'PRINCIPAL' | 'SECUNDARIO' | 'CONSULTOR' | 'EXTERNO'
  fechaAsignacion: string
  fechaInicio?: string
  fechaFin?: string
  estado: 'ACTIVO' | 'INACTIVO' | 'TEMPORAL'
  responsabilidades: string[]
  observaciones?: string
  asignadoPor: {
    id: string
    nombre: string
    apellido: string
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

const ROL_CONFIG: Record<Responsable['rol'], { badge: BadgeProps['variant']; icon: typeof Shield; label: string; avatarBg: string; avatarText: string }> = {
  PRINCIPAL: { badge: 'primary', icon: Shield, label: 'Principal', avatarBg: 'bg-blue-50', avatarText: 'text-blue-800' },
  SECUNDARIO: { badge: 'info', icon: User, label: 'Secundario', avatarBg: 'bg-sky-50', avatarText: 'text-sky-700' },
  CONSULTOR: { badge: 'warning', icon: Users, label: 'Consultor', avatarBg: 'bg-amber-50', avatarText: 'text-amber-600' },
  EXTERNO: { badge: 'secondary', icon: UserPlus, label: 'Externo', avatarBg: 'bg-slate-100', avatarText: 'text-slate-600' },
}

const ESTADO_CONFIG: Record<Responsable['estado'], { badge: BadgeProps['variant']; icon: typeof CheckCircle; label: string }> = {
  ACTIVO: { badge: 'success', icon: CheckCircle, label: 'Activo' },
  INACTIVO: { badge: 'secondary', icon: Clock, label: 'Inactivo' },
  TEMPORAL: { badge: 'warning', icon: AlertTriangle, label: 'Temporal' },
}

const RESPONSABILIDADES_OPCIONES = [
  'Representación legal',
  'Elaboración de documentos',
  'Asistencia a audiencias',
  'Coordinación con cliente',
  'Seguimiento procesal',
  'Investigación jurídica',
  'Negociación',
  'Facturación',
  'Supervisión general',
  'Consultoría especializada'
]

export default function ResponsablesPage() {
  const params = useParams()
  const casoId = params.casoId as string

  const [caso, setCaso] = useState<Caso | null>(null)
  const [responsables, setResponsables] = useState<Responsable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filtroRol, setFiltroRol] = useState('')
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

      // Obtener responsables (API endpoint que necesitamos crear)
      const responsablesResponse = await fetch(`/api/casos/${casoId}/responsables`)
      if (responsablesResponse.ok) {
        const responsablesData = await responsablesResponse.json()
        setResponsables(responsablesData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setResponsables([])
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

  const calculateDaysActive = (fechaInicio?: string, fechaFin?: string) => {
    if (!fechaInicio) return 0
    const inicio = new Date(fechaInicio)
    const fin = fechaFin ? new Date(fechaFin) : new Date()
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const responsablesFiltrados = responsables.filter(responsable => {
    const matchRol = !filtroRol || responsable.rol === filtroRol
    const matchEstado = !filtroEstado || responsable.estado === filtroEstado
    return matchRol && matchEstado
  })

  const estadisticas = {
    total: responsables.length,
    activos: responsables.filter(r => r.estado === 'ACTIVO').length,
    principales: responsables.filter(r => r.rol === 'PRINCIPAL').length,
    secundarios: responsables.filter(r => r.rol === 'SECUNDARIO').length,
    consultores: responsables.filter(r => r.rol === 'CONSULTOR').length
  }

  const handleRemoveResponsable = async (responsableId: string) => {
    if (!confirm('¿Estás seguro de remover este responsable del caso?')) {
      return
    }

    try {
      // API call para remover responsable
      console.log('Removiendo responsable:', responsableId)
      // TODO: Implementar API call
      fetchData()
    } catch (error) {
      console.error('Error al remover responsable:', error)
    }
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
      <Breadcrumb
        items={[
          { label: 'Casos', href: '/casos' },
          { label: caso.numeroCaso, href: `/casos/${casoId}` },
          { label: 'Responsables' }
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/casos/${casoId}`}>
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-0 text-xl font-bold text-slate-800">Responsables</h1>
            <p className="mb-0 text-slate-500">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>

        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Asignar Responsable
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Card className="bg-slate-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-slate-800">{estadisticas.total}</div>
            <small className="text-slate-500">Total</small>
          </CardBody>
        </Card>
        <Card className="bg-teal-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-teal-700">{estadisticas.activos}</div>
            <small className="text-slate-500">Activos</small>
          </CardBody>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-blue-800">{estadisticas.principales}</div>
            <small className="text-slate-500">Principales</small>
          </CardBody>
        </Card>
        <Card className="bg-sky-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-sky-700">{estadisticas.secundarios}</div>
            <small className="text-slate-500">Secundarios</small>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 text-center">
          <CardBody className="py-2">
            <div className="mb-0 text-xl font-bold text-amber-600">{estadisticas.consultores}</div>
            <small className="text-slate-500">Consultores</small>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><Shield size={14} />Filtrar por Rol</Label>
              <Select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="SECUNDARIO">Secundario</option>
                <option value="CONSULTOR">Consultor</option>
                <option value="EXTERNO">Externo</option>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Label className="flex items-center gap-1"><CheckCircle size={14} />Estado</Label>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="TEMPORAL">Temporal</option>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setFiltroRol(''); setFiltroEstado('') }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Responsables */}
      <Card>
        <CardHeader><CardTitle>Responsables Asignados ({responsablesFiltrados.length})</CardTitle></CardHeader>
        <CardBody>
          {responsablesFiltrados.length === 0 ? (
            <div className="py-5 text-center">
              <Users size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay responsables</h5>
              <p className="mb-3 text-slate-500">
                {responsables.length === 0
                  ? 'Aún no se han asignado responsables para este caso.'
                  : 'No se encontraron responsables con los filtros seleccionados.'
                }
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Asignar Primer Responsable
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {responsablesFiltrados.map((responsable) => {
                const rolConfig = ROL_CONFIG[responsable.rol] || ROL_CONFIG.SECUNDARIO
                const estadoConfig = ESTADO_CONFIG[responsable.estado] || ESTADO_CONFIG.ACTIVO
                const IconoRol = rolConfig.icon
                const IconoEstado = estadoConfig.icon
                const diasActivo = calculateDaysActive(responsable.fechaInicio, responsable.fechaFin)

                return (
                  <Card key={responsable.id} className="flex h-full flex-col">
                    <CardBody className="flex-1">
                      <div className="mb-3 flex items-start justify-between">
                        <Badge variant={rolConfig.badge}>
                          <IconoRol size={12} />
                          {rolConfig.label}
                        </Badge>
                        <Badge variant={estadoConfig.badge}>
                          <IconoEstado size={12} />
                          {estadoConfig.label}
                        </Badge>
                      </div>

                      <div className="mb-3 flex items-start gap-3">
                        <div className={cn('rounded-full p-2', rolConfig.avatarBg)}>
                          <User size={20} className={rolConfig.avatarText} />
                        </div>
                        <div className="flex-1">
                          <h6 className="mb-1 font-semibold text-slate-800">
                            {responsable.usuario.nombre} {responsable.usuario.apellido}
                          </h6>
                          {responsable.usuario.cargo && (
                            <small className="block text-slate-500">{responsable.usuario.cargo}</small>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <small>{responsable.usuario.email}</small>
                        </div>
                        {responsable.usuario.telefono && (
                          <div className="mb-1 flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <small>{responsable.usuario.telefono}</small>
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <small>Asignado: {formatDate(responsable.fechaAsignacion)}</small>
                        </div>
                        {responsable.fechaInicio && (
                          <small className="text-slate-500">
                            {responsable.estado === 'ACTIVO'
                              ? `Activo desde hace ${diasActivo} días`
                              : `Trabajó ${diasActivo} días`
                            }
                          </small>
                        )}
                      </div>

                      {responsable.responsabilidades.length > 0 && (
                        <div className="mb-3">
                          <h6 className="mb-1 text-xs font-semibold text-slate-500">Responsabilidades:</h6>
                          <div className="flex flex-wrap gap-1">
                            {responsable.responsabilidades.slice(0, 3).map((resp, index) => (
                              <Badge key={index} variant="outline">{resp}</Badge>
                            ))}
                            {responsable.responsabilidades.length > 3 && (
                              <Badge variant="secondary">+{responsable.responsabilidades.length - 3} más</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {responsable.observaciones && (
                        <div className="mb-3">
                          <small className="text-slate-500">
                            <strong>Observaciones:</strong> {responsable.observaciones.length > 60
                              ? `${responsable.observaciones.substring(0, 60)}...`
                              : responsable.observaciones
                            }
                          </small>
                        </div>
                      )}
                    </CardBody>

                    <div className="border-t border-slate-100 px-4 py-3">
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          <Link href={`/casos/${casoId}/responsables/${responsable.id}`}>
                            <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Link href={`/casos/${casoId}/responsables/${responsable.id}/editar`}>
                            <Button variant="outline" size="icon" title="Editar">
                              <Edit3 size={14} />
                            </Button>
                          </Link>
                        </div>

                        <Button variant="outlineDanger" size="icon" onClick={() => handleRemoveResponsable(responsable.id)} title="Remover del caso">
                          <X size={14} />
                        </Button>
                      </div>

                      <div className="mt-2 text-center">
                        <small className="text-slate-500">
                          Asignado por: {responsable.asignadoPor.nombre} {responsable.asignadoPor.apellido}
                        </small>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal para Asignar Responsable */}
      {showAddModal && (
        <Modal
          onClose={() => setShowAddModal(false)}
          title="Asignar Responsable"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button>
                <UserPlus size={16} />
                Asignar Responsable
              </Button>
            </>
          }
        >
          <div className="mb-3">
            <Label>Usuario *</Label>
            <Select required>
              <option value="">Selecciona un usuario</option>
              {/* TODO: Cargar usuarios disponibles */}
              <option value="1">Juan Pérez - Abogado Senior</option>
              <option value="2">María García - Paralegal</option>
              <option value="3">Carlos López - Consultor</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Rol *</Label>
              <Select required>
                <option value="">Selecciona rol</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="SECUNDARIO">Secundario</option>
                <option value="CONSULTOR">Consultor</option>
                <option value="EXTERNO">Externo</option>
              </Select>
            </div>
            <div>
              <Label>Fecha de Inicio</Label>
              <input type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20" />
            </div>
          </div>

          <div className="mt-3">
            <Label>Responsabilidades</Label>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
              {RESPONSABILIDADES_OPCIONES.map((resp, index) => (
                <label key={index} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" id={`resp-${index}`} className="h-4 w-4 accent-blue-800" />
                  {resp}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Label>Observaciones</Label>
            <textarea
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              rows={3}
              placeholder="Observaciones sobre la asignación..."
            />
          </div>
        </Modal>
      )}
    </>
  )
}
