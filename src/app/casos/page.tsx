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
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  Target,
  Flag,
  Play,
  Pause
} from 'lucide-react'
import { EstadoCaso, TipoInsolvencia, Prioridad } from '@prisma/client'

interface Caso {
  id: string
  numeroCaso: string
  tipoInsolvencia: TipoInsolvencia
  estado: EstadoCaso
  prioridad: Prioridad
  valorDeuda: number
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

const ESTADO_CONFIG = {
  ACTIVO: {
    color: 'success',
    icon: Play,
    label: 'Activo'
  },
  CERRADO: {
    color: 'secondary',
    icon: CheckCircle,
    label: 'Cerrado'
  },
  SUSPENDIDO: {
    color: 'warning',
    icon: Pause,
    label: 'Suspendido'
  },
  ARCHIVADO: {
    color: 'dark',
    icon: Archive,
    label: 'Archivado'
  }
}

const PRIORIDAD_CONFIG = {
  BAJA: {
    color: 'info',
    icon: Target,
    label: 'Baja'
  },
  MEDIA: {
    color: 'primary',
    icon: Target,
    label: 'Media'
  },
  ALTA: {
    color: 'warning',
    icon: Flag,
    label: 'Alta'
  },
  CRITICA: {
    color: 'danger',
    icon: AlertTriangle,
    label: 'Crítica'
  }
}

const TIPO_INSOLVENCIA_LABELS = {
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
          setCasos([]) // Asegurar que casos sea un array vacío
        }
      } else {
        console.error('Error al cargar casos')
        setCasos([]) // Asegurar que casos sea un array vacío
      }
    } catch (error) {
      console.error('Error al cargar casos:', error)
      setCasos([]) // Asegurar que casos sea un array vacío
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
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
    valorTotal: Array.isArray(casos) ? casos.reduce((sum, c) => sum + c.valorDeuda, 0) : 0
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Casos' }
        ]} 
      />
      
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Casos Jurídicos</h1>
          <p className="text-secondary mb-0">Gestión de procesos de insolvencia</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link href="/casos/nuevo" className="btn btn-primary d-flex align-items-center gap-2">
            <Plus size={16} />
            Nuevo Caso
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-light text-center">
            <div className="card-body py-3">
              <div className="h4 mb-0 text-dark">{estadisticas.total}</div>
              <small className="text-muted">Total Casos</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-success bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="h4 mb-0 text-success">{estadisticas.activos}</div>
              <small className="text-muted">Activos</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-secondary bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="h4 mb-0 text-secondary">{estadisticas.cerrados}</div>
              <small className="text-muted">Cerrados</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-warning bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="h4 mb-0 text-warning">{estadisticas.suspendidos}</div>
              <small className="text-muted">Suspendidos</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-danger bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="h4 mb-0 text-danger">{estadisticas.criticos}</div>
              <small className="text-muted">Críticos</small>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card bg-primary bg-opacity-10 text-center">
            <div className="card-body py-3">
              <div className="h6 mb-0 text-primary">{formatCurrency(estadisticas.valorTotal)}</div>
              <small className="text-muted">Valor Total</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                <Search size={14} className="me-1" />
                Buscar
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Número de caso, cliente, documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <Filter size={14} className="me-1" />
                Estado
              </label>
              <select 
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="CERRADO">Cerrado</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="ARCHIVADO">Archivado</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Prioridad</label>
              <select 
                className="form-select"
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo de Insolvencia</label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="REORGANIZACION">Reorganización</option>
                <option value="LIQUIDACION_JUDICIAL">Liquidación Judicial</option>
                <option value="INSOLVENCIA_PERSONA_NATURAL">Insolvencia Persona Natural</option>
                <option value="ACUERDO_REORGANIZACION">Acuerdo de Reorganización</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchTerm('')
                  setFiltroEstado('')
                  setFiltroPrioridad('')
                  setFiltroTipo('')
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <Briefcase size={20} />
            Casos ({casosFiltrados.length})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : casosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <Briefcase size={48} className="text-muted mb-3" />
              <h5 className="text-muted">
                {casos.length === 0 ? 'No hay casos registrados' : 'No se encontraron casos'}
              </h5>
              <p className="text-secondary">
                {casos.length === 0 
                  ? 'Los casos se crean automáticamente cuando una conciliación es aceptada por el juzgado.'
                  : 'Intenta con otros filtros de búsqueda.'
                }
              </p>
              {casos.length === 0 && (
                <Link href="/conciliaciones" className="btn btn-primary mt-3">
                  Ir a Conciliaciones
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Caso</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Valor Deuda</th>
                    <th>Responsable</th>
                    <th>Días Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {casosFiltrados.map((caso) => {
                    const estadoConfig = ESTADO_CONFIG[caso.estado] || ESTADO_CONFIG.ACTIVO
                    const prioridadConfig = PRIORIDAD_CONFIG[caso.prioridad] || PRIORIDAD_CONFIG.MEDIA
                    const IconoEstado = estadoConfig.icon
                    const IconoPrioridad = prioridadConfig.icon
                    const diasActivo = calculateDaysActive(caso.fechaInicio, caso.fechaCierre)
                    
                    return (
                      <tr key={caso.id}>
                        <td>
                          <div>
                            <Link href={`/casos/${caso.id}`} className="fw-semibold text-decoration-none">
                              {caso.numeroCaso}
                            </Link>
                            <div className="small text-muted">
                              Creado: {formatDate(caso.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {caso.cliente.nombre} {caso.cliente.apellido}
                            </div>
                            <div className="small text-muted">
                              Doc: {caso.cliente.documento}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {TIPO_INSOLVENCIA_LABELS[caso.tipoInsolvencia]}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`} style={{width: 'fit-content'}}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${prioridadConfig.color} d-flex align-items-center gap-1`} style={{width: 'fit-content'}}>
                            <IconoPrioridad size={12} />
                            {prioridadConfig.label}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {formatCurrency(caso.valorDeuda)}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {caso.responsable.nombre} {caso.responsable.apellido}
                          </div>
                        </td>
                        <td>
                          <div className="text-center">
                            <span className="badge bg-info">
                              {diasActivo} días
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/casos/${caso.id}`}
                              className="btn btn-outline-primary"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/casos/${caso.id}/actuaciones`}
                              className="btn btn-outline-secondary"
                              title="Actuaciones"
                            >
                              <Edit3 size={14} />
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
        </div>
      </div>
    </>
  )
}