'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit3,
  Filter
} from 'lucide-react'

interface Honorario {
  id: string
  concepto: string
  descripcion?: string
  modalidad: 'CONTADO' | 'FINANCIADO'
  tipo: 'INICIAL' | 'POR_ETAPA' | 'CONTINGENTE' | 'MIXTO'
  valorTotal: number
  valorPagado: number
  valorPendiente: number
  porcentajeContingencia?: number
  fechaCreacion: string
  fechaVencimiento?: string
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'
  responsable: {
    id: string
    nombre: string
    apellido: string
  }
  pagos?: Array<{
    id: string
    monto: number
    fecha: string
    metodoPago: string
  }>
}

interface Caso {
  id: string
  numeroCaso: string
  valorDeuda: number
  cliente: {
    nombre: string
    apellido?: string
  }
}

const ESTADO_CONFIG = {
  PENDIENTE: {
    color: 'warning',
    icon: Clock,
    label: 'Pendiente'
  },
  PARCIAL: {
    color: 'info',
    icon: AlertTriangle,
    label: 'Pago Parcial'
  },
  PAGADO: {
    color: 'success',
    icon: CheckCircle,
    label: 'Pagado'
  },
  VENCIDO: {
    color: 'danger',
    icon: XCircle,
    label: 'Vencido'
  }
}

const MODALIDAD_CONFIG = {
  CONTADO: {
    color: 'primary',
    label: 'Contado'
  },
  FINANCIADO: {
    color: 'info',
    label: 'Financiado'
  }
}

const TIPO_HONORARIOS = {
  'INICIAL': 'Honorarios Iniciales',
  'POR_ETAPA': 'Por Etapa Procesal',
  'CONTINGENTE': 'Éxito/Contingente',
  'MIXTO': 'Mixto'
}

export default function HonorariosPage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.casoId as string
  
  const [caso, setCaso] = useState<Caso | null>(null)
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroModalidad, setFiltroModalidad] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
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

      // Obtener honorarios (API endpoint que necesitamos crear)
      const honorariosResponse = await fetch(`/api/casos/${casoId}/honorarios`)
      if (honorariosResponse.ok) {
        const honorariosData = await honorariosResponse.json()
        setHonorarios(honorariosData)
      } else {
        // Por ahora, datos mock hasta que tengamos el endpoint
        setHonorarios([])
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const calculatePercentagePaid = (honorario: Honorario) => {
    if (honorario.valorTotal === 0) return 0
    return (honorario.valorPagado / honorario.valorTotal) * 100
  }

  const isOverdue = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    return new Date(fechaVencimiento) < new Date()
  }

  const getDaysUntilDue = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null
    const today = new Date()
    const due = new Date(fechaVencimiento)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const honorariosFiltrados = honorarios.filter(honorario => {
    const matchModalidad = !filtroModalidad || honorario.modalidad === filtroModalidad
    const matchTipo = !filtroTipo || honorario.tipo === filtroTipo
    const matchEstado = !filtroEstado || honorario.estado === filtroEstado
    return matchModalidad && matchTipo && matchEstado
  })

  const estadisticas = {
    totalHonorarios: honorarios.reduce((sum, h) => sum + h.valorTotal, 0),
    totalPagado: honorarios.reduce((sum, h) => sum + h.valorPagado, 0),
    totalPendiente: honorarios.reduce((sum, h) => sum + h.valorPendiente, 0),
    pendientes: honorarios.filter(h => h.estado === 'PENDIENTE').length,
    pagados: honorarios.filter(h => h.estado === 'PAGADO').length,
    vencidos: honorarios.filter(h => h.estado === 'VENCIDO').length
  }

  const porcentajePagado = estadisticas.totalHonorarios > 0 
    ? (estadisticas.totalPagado / estadisticas.totalHonorarios) * 100 
    : 0

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
          { label: 'Honorarios' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/casos/${casoId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">Honorarios</h1>
            <p className="text-secondary mb-0">
              {caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}
            </p>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Link
            href={`/casos/${casoId}/honorarios/contado/nuevo`}
            className="btn btn-outline-primary d-flex align-items-center gap-2"
          >
            <Plus size={16} />
            Contado
          </Link>
          <Link
            href={`/casos/${casoId}/honorarios/financiado/nuevo`}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <Plus size={16} />
            Financiado
          </Link>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="row mb-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <TrendingUp size={20} />
                Resumen Financiero
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-primary">{formatCurrency(estadisticas.totalHonorarios)}</div>
                    <small className="text-muted">Total Honorarios</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-success">{formatCurrency(estadisticas.totalPagado)}</div>
                    <small className="text-muted">Total Pagado</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-warning">{formatCurrency(estadisticas.totalPendiente)}</div>
                    <small className="text-muted">Pendiente</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-info">{porcentajePagado.toFixed(1)}%</div>
                    <small className="text-muted">Progreso</small>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${porcentajePagado}%`}}
                    role="progressbar"
                  ></div>
                </div>
                <small className="text-muted">
                  Progreso de pagos: {porcentajePagado.toFixed(1)}% completado
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Estado de Honorarios</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <div className="h5 text-success">{estadisticas.pagados}</div>
                  <small className="text-muted">Pagados</small>
                </div>
                <div className="col-6">
                  <div className="h5 text-warning">{estadisticas.pendientes}</div>
                  <small className="text-muted">Pendientes</small>
                </div>
              </div>
              {estadisticas.vencidos > 0 && (
                <div className="mt-2 text-center">
                  <div className="h5 text-danger">{estadisticas.vencidos}</div>
                  <small className="text-muted">Vencidos</small>
                </div>
              )}
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
                <Filter size={14} className="me-1" />
                Filtrar por Modalidad
              </label>
              <select 
                className="form-select"
                value={filtroModalidad}
                onChange={(e) => setFiltroModalidad(e.target.value)}
              >
                <option value="">Todas las modalidades</option>
                <option value="CONTADO">Contado</option>
                <option value="FINANCIADO">Financiado</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <DollarSign size={14} className="me-1" />
                Tipo
              </label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_HONORARIOS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">
                Estado
              </label>
              <select 
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Pago Parcial</option>
                <option value="PAGADO">Pagado</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFiltroModalidad('')
                  setFiltroTipo('')
                  setFiltroEstado('')
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Honorarios */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Honorarios ({honorariosFiltrados.length})
          </h5>
        </div>
        <div className="card-body">
          {honorariosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <DollarSign size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay honorarios</h5>
              <p className="text-secondary">
                {honorarios.length === 0 
                  ? 'Aún no se han definido honorarios para este caso.'
                  : 'No se encontraron honorarios con los filtros seleccionados.'
                }
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Link
                  href={`/casos/${casoId}/honorarios/contado/nuevo`}
                  className="btn btn-outline-primary"
                >
                  <Plus size={16} className="me-2" />
                  Honorarios Contado
                </Link>
                <Link
                  href={`/casos/${casoId}/honorarios/financiado/nuevo`}
                  className="btn btn-primary"
                >
                  <Plus size={16} className="me-2" />
                  Honorarios Financiados
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Modalidad/Tipo</th>
                    <th>Estado</th>
                    <th>Valor Total</th>
                    <th>Pagado</th>
                    <th>Pendiente</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {honorariosFiltrados.map((honorario) => {
                    const estadoConfig = ESTADO_CONFIG[honorario.estado] || ESTADO_CONFIG.PENDIENTE
                    const modalidadConfig = MODALIDAD_CONFIG[honorario.modalidad]
                    const IconoEstado = estadoConfig.icon
                    const porcentajePago = calculatePercentagePaid(honorario)
                    const diasVencimiento = getDaysUntilDue(honorario.fechaVencimiento)
                    const estaVencido = isOverdue(honorario.fechaVencimiento)
                    
                    return (
                      <tr key={honorario.id} className={estaVencido ? 'table-danger' : ''}>
                        <td>
                          <div className="fw-medium">{honorario.concepto}</div>
                          {honorario.descripcion && (
                            <small className="text-muted d-block">
                              {honorario.descripcion.length > 50 
                                ? `${honorario.descripcion.substring(0, 50)}...`
                                : honorario.descripcion
                              }
                            </small>
                          )}
                          {honorario.tipo === 'CONTINGENTE' && honorario.porcentajeContingencia && (
                            <small className="text-info d-block">
                              {honorario.porcentajeContingencia}% sobre recuperación
                            </small>
                          )}
                        </td>
                        <td>
                          <div>
                            <span className={`badge bg-${modalidadConfig.color} mb-1`}>
                              {modalidadConfig.label}
                            </span>
                          </div>
                          <small className="text-muted">
                            {TIPO_HONORARIOS[honorario.tipo as keyof typeof TIPO_HONORARIOS] || honorario.tipo}
                          </small>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`} style={{width: 'fit-content'}}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                          {honorario.estado === 'PARCIAL' && (
                            <div className="mt-1">
                              <div className="progress" style={{height: '4px', width: '80px'}}>
                                <div 
                                  className="progress-bar bg-info" 
                                  style={{width: `${porcentajePago}%`}}
                                ></div>
                              </div>
                              <small className="text-muted">{porcentajePago.toFixed(0)}%</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">{formatCurrency(honorario.valorTotal)}</div>
                        </td>
                        <td>
                          <div className="text-success">{formatCurrency(honorario.valorPagado)}</div>
                          {honorario.pagos && honorario.pagos.length > 0 && (
                            <small className="text-muted">
                              {honorario.pagos.length} pago{honorario.pagos.length > 1 ? 's' : ''}
                            </small>
                          )}
                        </td>
                        <td>
                          <div className={honorario.valorPendiente > 0 ? 'text-warning fw-semibold' : 'text-muted'}>
                            {formatCurrency(honorario.valorPendiente)}
                          </div>
                        </td>
                        <td>
                          {honorario.fechaVencimiento ? (
                            <div>
                              <small className={estaVencido ? 'text-danger fw-bold' : 'text-muted'}>
                                {formatDate(honorario.fechaVencimiento)}
                              </small>
                              {diasVencimiento !== null && (
                                <div>
                                  <small className={
                                    diasVencimiento < 0 ? 'text-danger' :
                                    diasVencimiento <= 7 ? 'text-warning' : 'text-muted'
                                  }>
                                    {diasVencimiento < 0 
                                      ? `Vencido hace ${Math.abs(diasVencimiento)} días`
                                      : diasVencimiento === 0
                                      ? 'Vence hoy'
                                      : `${diasVencimiento} días`
                                    }
                                  </small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/casos/${casoId}/honorarios/${honorario.id}`}
                              className="btn btn-outline-primary"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/casos/${casoId}/honorarios/${honorario.id}/editar`}
                              className="btn btn-outline-secondary"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </Link>
                            {honorario.estado !== 'PAGADO' && (
                              <Link
                                href={`/casos/${casoId}/honorarios/${honorario.id}/pagar`}
                                className="btn btn-outline-success"
                                title="Registrar pago"
                              >
                                <CreditCard size={14} />
                              </Link>
                            )}
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