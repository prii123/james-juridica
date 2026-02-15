'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  Search, 
  Filter, 
  Eye, 
  CreditCard,
  AlertTriangle,
  DollarSign,
  Calendar,
  Percent,
  Calculator,
  BarChart3
} from 'lucide-react'

interface FacturaCartera {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  total: number
  saldoPendiente: number
  diasVencida: number
  estado: string
  modalidadPago: string // 'CONTADO' | 'FINANCIADO'
  numeroCuotas?: number
  valorCuota?: number
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email: string
  }
  caso: {
    id: string
    numeroCaso: string
  }
}

interface EstadisticasCartera {
  totalFacturas: number
  montoTotal: number
  montoVencido: number
  facturasMasVencidas: number
}

export default function CarteraPage() {
  const [facturas, setFacturas] = useState<FacturaCartera[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasCartera>({
    totalFacturas: 0,
    montoTotal: 0,
    montoVencido: 0,
    facturasMasVencidas: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODAS')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchCartera()
  }, [filtroEstado])

  // Efecto separado para búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCartera()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [busqueda])

  const fetchCartera = async () => {
    try {
      setLoading(true)
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams()
      if (busqueda) params.append('search', busqueda)
      if (filtroEstado !== 'TODAS') params.append('estado', filtroEstado)
      
      const response = await fetch(`/api/cartera?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar las facturas de cartera')
      }
      
      const data = await response.json()
      const facturasFiltradas = data.facturas

      setFacturas(facturasFiltradas)
      
      // Calculate statistics - solo facturas a crédito
      const facturasPendientes = facturasFiltradas.filter((f: FacturaCartera) => f.saldoPendiente > 0)
      setEstadisticas({
        totalFacturas: facturasPendientes.length,
        montoTotal: facturasPendientes.reduce((sum: number, f: FacturaCartera) => sum + f.saldoPendiente, 0),
        montoVencido: facturasPendientes.filter((f: FacturaCartera) => f.diasVencida > 0).reduce((sum: number, f: FacturaCartera) => sum + f.saldoPendiente, 0),
        facturasMasVencidas: facturasPendientes.filter((f: FacturaCartera) => f.diasVencida > 30).length
      })

    } catch (error) {
      console.error('Error al cargar cartera:', error)
      // En caso de error, mantener la vista limpia
      setFacturas([])
      setEstadisticas({
        totalFacturas: 0,
        montoTotal: 0,
        montoVencido: 0,
        facturasMasVencidas: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getEstadoBadge = (diasVencida: number, saldoPendiente: number) => {
    if (saldoPendiente === 0) {
      return <span className="badge bg-success">Pagada</span>
    } else if (diasVencida === 0) {
      return <span className="badge bg-info">Al día</span>
    } else if (diasVencida <= 30) {
      return <span className="badge bg-warning">Vencida {diasVencida}d</span>
    } else {
      return <span className="badge bg-danger">Crítica {diasVencida}d</span>
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

  return (
    <>
      <Breadcrumb items={[{ label: 'Cartera Financiada' }]} />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Cartera Financiada</h1>
          <p className="text-secondary mb-0">
            Gestión de facturas financiadas y financiación
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <CreditCard size={32} />
                </div>
                <div>
                  <div className="h4 mb-0">{estadisticas.totalFacturas}</div>
                  <small>Facturas Pendientes</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <DollarSign size={32} />
                </div>
                <div>
                  <div className="h4 mb-0">{formatCurrency(estadisticas.montoTotal)}</div>
                  <small>Saldo Pendiente</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <div className="h4 mb-0">{formatCurrency(estadisticas.montoVencido)}</div>
                  <small>Monto Vencido</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Calendar size={32} />
                </div>
                <div>
                  <div className="h4 mb-0">{estadisticas.facturasMasVencidas}</div>
                  <small>Críticas (+30d)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por factura, cliente o caso..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODAS">Todas las facturas financiadas</option>
                <option value="PROXIMAS">Por vencer/al día</option>
                <option value="VENCIDAS">Vencidos</option>
                <option value="PAGADAS">Pagados</option>
              </select>
            </div>
            <div className="col-md-5 text-end">
              <span className="text-muted">
                Mostrando {facturas.length} facturas financiadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Caso</th>
                <th>Modalidad</th>
                <th>Total</th>
                <th>Saldo</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="text-muted">
                      <CreditCard size={48} className="mb-2" />
                      <p>No hay facturas financiadas que coincidan con los filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                facturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>
                      <div>
                        <strong>{factura.numero}</strong>
                        <br />
                        <small className="text-muted">
                          {new Date(factura.fecha).toLocaleDateString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{factura.cliente.nombre} {factura.cliente.apellido}</strong>
                        <br />
                        <small className="text-muted">{factura.cliente.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{factura.caso.numeroCaso}</span>
                    </td>
                    <td>
                      <span className="badge bg-warning">Financiado</span>
                      <br />
                      <small className="text-muted">
                        {(factura.numeroCuotas ?? 1) === 1 ? (
                          <span className="text-info">Sin financiar</span>
                        ) : (
                          `${factura.numeroCuotas} cuotas de ${formatCurrency(factura.valorCuota || 0)}`
                        )}
                      </small>
                    </td>
                    <td>
                      <strong>{formatCurrency(factura.total)}</strong>
                    </td>
                    <td>
                      {factura.saldoPendiente === 0 ? (
                        <span className="badge bg-success">Pagada</span>
                      ) : (
                        <>
                          <strong className="text-warning">{formatCurrency(factura.saldoPendiente)}</strong>
                          {factura.saldoPendiente < factura.total && (
                            <>
                              <br />
                              <small className="text-success">
                                Pagado: {formatCurrency(factura.total - factura.saldoPendiente)}
                              </small>
                            </>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <div>{new Date(factura.fechaVencimiento).toLocaleDateString()}</div>
                      {factura.diasVencida > 0 && (
                        <small className="text-danger">Vencida hace {factura.diasVencida} días</small>
                      )}
                    </td>
                    <td>
                      {getEstadoBadge(factura.diasVencida, factura.saldoPendiente)}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Link 
                          href={`/facturacion/${factura.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="Ver factura"
                        >
                          <Eye size={14} />
                        </Link>
                        {factura.saldoPendiente > 0 ? (
                          <Link 
                            href={`/cartera/pagos/${factura.id}`}
                            className="btn btn-sm btn-outline-success"
                            title="Registrar pago"
                          >
                            <DollarSign size={14} />
                          </Link>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-success"
                            title="Factura ya pagada"
                            disabled
                          >
                            <DollarSign size={14} />
                          </button>
                        )}
                        {(factura.numeroCuotas ?? 1) === 1 && factura.saldoPendiente > 0 && (
                          <Link 
                            href={`/cartera/financiacion/${factura.id}`}
                            className="btn btn-sm btn-outline-info"
                            title="Configurar financiación"
                          >
                            <Calculator size={14} />
                          </Link>
                        )}
                        {(factura.numeroCuotas ?? 1) > 1 && (
                          <>
                            <Link 
                              href={`/cartera/financiacion/${factura.id}`}
                              className="btn btn-sm btn-outline-warning"
                              title="Ver plan de cuotas"
                            >
                              <Percent size={14} />
                            </Link>
                            <Link 
                              href={`/cartera/seguimiento/${factura.id}`}
                              className="btn btn-sm btn-outline-info"
                              title="Seguimiento de cuotas"
                            >
                              <BarChart3 size={14} />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}