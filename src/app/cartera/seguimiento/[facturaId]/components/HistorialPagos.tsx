'use client'

import { 
  DollarSign, 
  Calendar, 
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

interface PagoHistorial {
  id: string
  valor: number
  fecha: string
  metodoPago: string
  referencia?: string
  observaciones?: string
  distribucion: Array<{
    cuotaNumero: number
    valorAplicado: number
    fechaAplicacion: string
  }>
}

interface Props {
  pagos: PagoHistorial[]
  formatCurrency: (value: number) => string
}

export default function HistorialPagos({ pagos, formatCurrency }: Props) {
  const [pagoExpanded, setPagoExpanded] = useState<string | null>(null)

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'TRANSFERENCIA':
      case 'CONSIGNACION':
        return <CreditCard size={14} />
      case 'EFECTIVO':
        return <DollarSign size={14} />
      default:
        return <FileText size={14} />
    }
  }

  const getMetodoPagoBadge = (metodo: string) => {
    const badges: { [key: string]: string } = {
      'EFECTIVO': 'bg-success',
      'TRANSFERENCIA': 'bg-primary',
      'CONSIGNACION': 'bg-info',
      'CHEQUE': 'bg-warning',
      'TARJETA_CREDITO': 'bg-secondary',
      'TARJETA_DEBITO': 'bg-dark'
    }
    
    return badges[metodo] || 'bg-light text-dark'
  }

  const toggleExpanded = (pagoId: string) => {
    setPagoExpanded(pagoExpanded === pagoId ? null : pagoId)
  }

  if (pagos.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Historial de Pagos</h5>
        </div>
        <div className="card-body text-center py-4">
          <DollarSign size={48} className="text-muted mb-3" />
          <p className="text-muted">No hay pagos registrados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Historial de Pagos</h5>
        <span className="badge bg-primary">{pagos.length} pagos</span>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {pagos.map((pago, index) => (
            <div key={pago.id} className="list-group-item">
              <div 
                className="d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => toggleExpanded(pago.id)}
                role="button"
              >
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    {getMetodoPagoIcon(pago.metodoPago)}
                    <span className="fw-bold">{formatCurrency(pago.valor)}</span>
                    <span className={`badge ${getMetodoPagoBadge(pago.metodoPago)}`}>
                      {pago.metodoPago.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="d-flex align-items-center text-muted small">
                    <Calendar size={12} className="me-1" />
                    {new Date(pago.fecha).toLocaleDateString()}
                    {pago.referencia && (
                      <>
                        <span className="mx-1">•</span>
                        <span>Ref: {pago.referencia}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark">
                    {pago.distribucion.length} cuota{pago.distribucion.length !== 1 ? 's' : ''}
                  </span>
                  {pagoExpanded === pago.id ? (
                    <ChevronUp size={16} className="text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-muted" />
                  )}
                </div>
              </div>

              {/* Detalle Expandido */}
              {pagoExpanded === pago.id && (
                <div className="mt-3 pt-3 border-top">
                  {pago.observaciones && (
                    <div className="mb-3">
                      <small className="text-muted">Observaciones:</small>
                      <div className="small">{pago.observaciones}</div>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <small className="text-muted fw-bold">Distribución por Cuotas:</small>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        {pago.distribucion.map((dist, i) => (
                          <tr key={i}>
                            <td className="py-1">
                              <span className="badge bg-light text-dark">
                                Cuota #{dist.cuotaNumero}
                              </span>
                            </td>
                            <td className="py-1 text-end">
                              <strong className="text-success">
                                {formatCurrency(dist.valorAplicado)}
                              </strong>
                            </td>
                            <td className="py-1 text-muted small">
                              {new Date(dist.fechaAplicacion).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-top">
                          <td className="py-2 fw-bold">TOTAL:</td>
                          <td className="py-2 text-end fw-bold text-success">
                            {formatCurrency(pago.valor)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumen Total */}
      <div className="card-footer bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted">Total Pagado:</span>
          <span className="fw-bold text-success h6 mb-0">
            {formatCurrency(
              pagos.reduce((sum, pago) => sum + pago.valor, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  )
}