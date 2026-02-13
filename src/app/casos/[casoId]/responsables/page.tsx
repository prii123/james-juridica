'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

const ROL_CONFIG = {
  PRINCIPAL: {
    color: 'primary',
    icon: Shield,
    label: 'Principal'
  },
  SECUNDARIO: {
    color: 'info',
    icon: User,
    label: 'Secundario'
  },
  CONSULTOR: {
    color: 'warning',
    icon: Users,
    label: 'Consultor'
  },
  EXTERNO: {
    color: 'secondary',
    icon: UserPlus,
    label: 'Externo'
  }
}

const ESTADO_CONFIG = {
  ACTIVO: {
    color: 'success',
    icon: CheckCircle,
    label: 'Activo'
  },
  INACTIVO: {
    color: 'secondary',
    icon: Clock,
    label: 'Inactivo'
  },
  TEMPORAL: {
    color: 'warning',
    icon: AlertTriangle,
    label: 'Temporal'
  }
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
  const router = useRouter()
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
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error || !caso) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Caso no encontrado'}
        </div>
        <Link href="/casos" className="btn btn-primary">
          Volver a Casos
        </Link>
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

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/casos/${casoId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">Responsables</h1>
            <p className="text-secondary mb-0">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Plus size={16} />
          Asignar Responsable
        </button>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-2 col-sm-6">
          <div className="card bg-light text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-dark">{estadisticas.total}</div>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-success">{estadisticas.activos}</div>
              <small className="text-muted">Activos</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-primary">{estadisticas.principales}</div>
              <small className="text-muted">Principales</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-info bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-info">{estadisticas.secundarios}</div>
              <small className="text-muted">Secundarios</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-sm-6">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-2">
              <div className="h4 mb-0 text-warning">{estadisticas.consultores}</div>
              <small className="text-muted">Consultores</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                <Shield size={14} className="me-1" />
                Filtrar por Rol
              </label>
              <select 
                className="form-select"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="SECUNDARIO">Secundario</option>
                <option value="CONSULTOR">Consultor</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <CheckCircle size={14} className="me-1" />
                Estado
              </label>
              <select 
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="TEMPORAL">Temporal</option>
              </select>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFiltroRol('')
                  setFiltroEstado('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Responsables */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Responsables Asignados ({responsablesFiltrados.length})
          </h5>
        </div>
        <div className="card-body">
          {responsablesFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <Users size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay responsables</h5>
              <p className="text-secondary">
                {responsables.length === 0 
                  ? 'Aún no se han asignado responsables para este caso.'
                  : 'No se encontraron responsables con los filtros seleccionados.'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus size={16} className="me-2" />
                Asignar Primer Responsable
              </button>
            </div>
          ) : (
            <div className="row">
              {responsablesFiltrados.map((responsable) => {
                const rolConfig = ROL_CONFIG[responsable.rol] || ROL_CONFIG.SECUNDARIO
                const estadoConfig = ESTADO_CONFIG[responsable.estado] || ESTADO_CONFIG.ACTIVO
                const IconoRol = rolConfig.icon
                const IconoEstado = estadoConfig.icon
                const diasActivo = calculateDaysActive(responsable.fechaInicio, responsable.fechaFin)
                
                return (
                  <div key={responsable.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className={`badge bg-${rolConfig.color} d-flex align-items-center gap-1`}>
                            <IconoRol size={12} />
                            {rolConfig.label}
                          </span>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div className={`bg-${rolConfig.color} bg-opacity-10 rounded-circle p-2`}>
                            <User size={20} className={`text-${rolConfig.color}`} />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="fw-semibold mb-1">
                              {responsable.usuario.nombre} {responsable.usuario.apellido}
                            </h6>
                            {responsable.usuario.cargo && (
                              <small className="text-muted d-block">
                                {responsable.usuario.cargo}
                              </small>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Mail size={14} className="text-muted" />
                            <small>{responsable.usuario.email}</small>
                          </div>
                          {responsable.usuario.telefono && (
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Phone size={14} className="text-muted" />
                              <small>{responsable.usuario.telefono}</small>
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Calendar size={14} className="text-muted" />
                            <small>
                              Asignado: {formatDate(responsable.fechaAsignacion)}
                            </small>
                          </div>
                          {responsable.fechaInicio && (
                            <small className="text-muted">
                              {responsable.estado === 'ACTIVO' 
                                ? `Activo desde hace ${diasActivo} días`
                                : `Trabajó ${diasActivo} días`
                              }
                            </small>
                          )}
                        </div>
                        
                        {responsable.responsabilidades.length > 0 && (
                          <div className="mb-3">
                            <h6 className="small fw-semibold text-muted mb-1">Responsabilidades:</h6>
                            <div className="d-flex flex-wrap gap-1">
                              {responsable.responsabilidades.slice(0, 3).map((resp, index) => (
                                <span key={index} className="badge bg-light text-dark small">
                                  {resp}
                                </span>
                              ))}
                              {responsable.responsabilidades.length > 3 && (
                                <span className="badge bg-secondary small">
                                  +{responsable.responsabilidades.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {responsable.observaciones && (
                          <div className="mb-3">
                            <small className="text-muted">
                              <strong>Observaciones:</strong> {responsable.observaciones.length > 60 
                                ? `${responsable.observaciones.substring(0, 60)}...`
                                : responsable.observaciones
                              }
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-footer bg-transparent">
                        <div className="d-flex justify-content-between">
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/casos/${casoId}/responsables/${responsable.id}`}
                              className="btn btn-outline-primary"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/casos/${casoId}/responsables/${responsable.id}/editar`}
                              className="btn btn-outline-secondary"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </Link>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveResponsable(responsable.id)}
                            className="btn btn-outline-danger btn-sm"
                            title="Remover del caso"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="mt-2 text-center">
                          <small className="text-muted">
                            Asignado por: {responsable.asignadoPor.nombre} {responsable.asignadoPor.apellido}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Asignar Responsable */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Asignar Responsable</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Usuario *</label>
                  <select className="form-select" required>
                    <option value="">Selecciona un usuario</option>
                    {/* TODO: Cargar usuarios disponibles */}
                    <option value="1">Juan Pérez - Abogado Senior</option>
                    <option value="2">María García - Paralegal</option>
                    <option value="3">Carlos López - Consultor</option>
                  </select>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Rol *</label>
                    <select className="form-select" required>
                      <option value="">Selecciona rol</option>
                      <option value="PRINCIPAL">Principal</option>
                      <option value="SECUNDARIO">Secundario</option>
                      <option value="CONSULTOR">Consultor</option>
                      <option value="EXTERNO">Externo</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Fecha de Inicio</label>
                    <input type="date" className="form-control" />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="form-label">Responsabilidades</label>
                  <div className="row">
                    {RESPONSABILIDADES_OPCIONES.map((resp, index) => (
                      <div key={index} className="col-md-6 mb-1">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id={`resp-${index}`} />
                          <label className="form-check-label small" htmlFor={`resp-${index}`}>
                            {resp}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="form-label">Observaciones</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="Observaciones sobre la asignación..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                >
                  <UserPlus size={16} className="me-2" />
                  Asignar Responsable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}