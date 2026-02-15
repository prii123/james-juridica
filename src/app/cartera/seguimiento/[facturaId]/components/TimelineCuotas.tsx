'use client'

import { useState } from 'react'
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  X
} from 'lucide-react'

interface CuotaSeguimiento {
  id: string
  numeroCuota: number
  valor: number
  capital: number
  interes: number
  saldo: number
  fechaVencimiento: string
  fechaPago?: string
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA'
  observaciones?: string
  valorPagado: number
  saldoCuota: number
  diasVencido: number
  pagosAplicados: Array<{
    id: string
    valorAplicado: number
    fechaAplicacion: string
    observaciones?: string
    pago: {
      id: string
      valor: number
      fecha: string
      metodoPago: string
      referencia?: string
      observaciones?: string
    }
  }>
}

interface Props {
  cuotas: CuotaSeguimiento[]
  formatCurrency: (value: number) => string
}

export default function TimelineCuotas({ cuotas, formatCurrency }: Props) {
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<CuotaSeguimiento | null>(null)

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return <CheckCircle size={16} className="text-success" />
      case 'VENCIDA':
        return <AlertTriangle size={16} className="text-danger" />
      case 'PARCIAL':
        return <TrendingUp size={16} className="text-info" />
      default:
        return <Clock size={16} className="text-secondary" />
    }
  }

  const getEstadoBadge = (cuota: CuotaSeguimiento) => {
    const { estado, diasVencido } = cuota
    
    switch (estado) {
      case 'PAGADA':
        return <span className="badge bg-success">Pagada</span>
      case 'VENCIDA':
        return (
          <span className="badge bg-danger">
            Vencida {diasVencido > 0 && `(${diasVencido}d)`}
          </span>
        )
      case 'PARCIAL':
        return <span className="badge bg-info">Parcial</span>
      default:
        return <span className="badge bg-secondary">Pendiente</span>
    }
  }

  const getProgresoCuota = (cuota: CuotaSeguimiento) => {
    return cuota.valor > 0 ? (cuota.valorPagado / cuota.valor) * 100 : 0
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '80px' }}>Cuota</th>
              <th style={{ width: '120px' }}>Vencimiento</th>
              <th>Valor</th>
              <th>Progreso</th>
              <th style={{ width: '100px' }}>Estado</th>
              <th style={{ width: '60px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuotas.map((cuota) => (
              <tr 
                key={cuota.id} 
                className={cuota.estado === 'VENCIDA' ? 'table-danger' : ''}
              >
                <td>
                  <div className="d-flex align-items-center">
                    {getEstadoIcon(cuota.estado)}
                    <span className="ms-2 fw-bold">#{cuota.numeroCuota}</span>
                  </div>
                </td>
                
                <td>
                  <div className="small">
                    <Calendar size={14} className="me-1" />
                    {new Date(cuota.fechaVencimiento).toLocaleDateString()}
                  </div>
                  {cuota.fechaPago && (
                    <div className="small text-success">
                      Pagado: {new Date(cuota.fechaPago).toLocaleDateString()}
                    </div>
                  )}
                </td>
                
                <td>
                  <div>{formatCurrency(cuota.valor)}</div>
                  {cuota.valorPagado > 0 && (
                    <div className="small text-success">
                      Pagado: {formatCurrency(cuota.valorPagado)}
                    </div>
                  )}
                  {cuota.saldoCuota > 0 && (
                    <div className="small text-warning">
                      Saldo: {formatCurrency(cuota.saldoCuota)}
                    </div>
                  )}
                </td>
                
                <td>
                  <div className="progress" style={{ height: '6px' }}>
                    <div 
                      className={`progress-bar ${
                        getProgresoCuota(cuota) === 100 ? 'bg-success' : 
                        getProgresoCuota(cuota) > 0 ? 'bg-info' : 'bg-secondary'
                      }`}
                      style={{ width: `${getProgresoCuota(cuota)}%` }}
                    ></div>
                  </div>
                  <div className="small text-muted mt-1">
                    {getProgresoCuota(cuota).toFixed(0)}%
                  </div>
                </td>
                
                <td>
                  {getEstadoBadge(cuota)}
                </td>
                
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setCuotaSeleccionada(cuota)}
                    title="Ver detalles"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles de Cuota */}
      {cuotaSeleccionada && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalles de Cuota #{cuotaSeleccionada.numeroCuota}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setCuotaSeleccionada(null)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Información General */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Información General</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-2">
                          <strong>Valor Total:</strong> {formatCurrency(cuotaSeleccionada.valor)}
                        </div>
                        <div className="mb-2">
                          <strong>Capital:</strong> {formatCurrency(cuotaSeleccionada.capital)}
                        </div>
                        <div className="mb-2">
                          <strong>Interés:</strong> {formatCurrency(cuotaSeleccionada.interes)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <strong>Fecha Vencimiento:</strong> {new Date(cuotaSeleccionada.fechaVencimiento).toLocaleDateString()}
                        </div>
                        <div className="mb-2">
                          <strong>Estado:</strong> {getEstadoBadge(cuotaSeleccionada)}
                        </div>
                        {cuotaSeleccionada.fechaPago && (
                          <div className="mb-2">
                            <strong>Fecha Pago:</strong> {new Date(cuotaSeleccionada.fechaPago).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Progreso de Pago:</span>
                        <span className="fw-bold">{getProgresoCuota(cuotaSeleccionada).toFixed(1)}%</span>
                      </div>
                      <div className="progress">
                        <div 
                          className={`progress-bar ${
                            getProgresoCuota(cuotaSeleccionada) === 100 ? 'bg-success' : 'bg-info'
                          }`}
                          style={{ width: `${getProgresoCuota(cuotaSeleccionada)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historial de Pagos de esta Cuota */}
                {cuotaSeleccionada.pagosAplicados.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Pagos Aplicados ({cuotaSeleccionada.pagosAplicados.length})</h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Valor Aplicado</th>
                              <th>Método</th>
                              <th>Referencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuotaSeleccionada.pagosAplicados.map((aplicacion) => (
                              <tr key={aplicacion.id}>
                                <td>
                                  <small>{new Date(aplicacion.fechaAplicacion).toLocaleDateString()}</small>
                                </td>
                                <td>
                                  <strong className="text-success">
                                    {formatCurrency(aplicacion.valorAplicado)}
                                  </strong>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark">
                                    {aplicacion.pago.metodoPago}
                                  </span>
                                </td>
                                <td>
                                  <small>{aplicacion.pago.referencia || '-'}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td><strong>Total:</strong></td>
                              <td>
                                <strong className="text-success">
                                  {formatCurrency(cuotaSeleccionada.valorPagado)}
                                </strong>
                              </td>
                              <td colSpan={2}>
                                <strong className="text-warning">
                                  Saldo: {formatCurrency(cuotaSeleccionada.saldoCuota)}
                                </strong>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                
                {cuotaSeleccionada.pagosAplicados.length === 0 && (
                  <div className="alert alert-info">
                    <strong>Sin pagos aplicados</strong><br />
                    Esta cuota aún no tiene pagos registrados.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setCuotaSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}