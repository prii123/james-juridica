'use client'

import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Calendar
} from 'lucide-react'

interface ResumenSeguimiento {
  totalPagado: number
  saldoPendiente: number
  cuotasPagadas: number
  cuotasVencidas: number
  cuotasParciales: number
  cuotasPendientes: number
  progresoPago: number
}

interface FacturaSeguimiento {
  id: string
  numero: string
  fecha: string
  total: number
  modalidadPago: string
  numeroCuotas?: number
  valorCuota?: number
  tasaInteres?: number
  cliente: {
    nombre: string
    apellido?: string
  }
  caso: {
    numeroCaso: string
  }
}

interface Props {
  resumen: ResumenSeguimiento
  factura: FacturaSeguimiento
  formatCurrency: (value: number) => string
}

export default function ResumenCuotas({ resumen, factura, formatCurrency }: Props) {
  const totalCuotas = factura.numeroCuotas || 0

  return (
    <div className="row mb-4">
      {/* Progress General */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body text-center">
            <div className="mb-3">
              <div 
                className="progress mx-auto mb-2"
                style={{ width: '120px', height: '8px' }}
              >
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${resumen.progresoPago}%` }}
                ></div>
              </div>
              <div className="h4 text-success mb-1">{resumen.progresoPago.toFixed(1)}%</div>
              <div className="text-muted small">Progreso de Pago</div>
            </div>
            
            <div className="row text-center">
              <div className="col-6">
                <div className="h5 text-success">{formatCurrency(resumen.totalPagado)}</div>
                <div className="text-muted small">Pagado</div>
              </div>
              <div className="col-6">
                <div className="h5 text-warning">{formatCurrency(resumen.saldoPendiente)}</div>
                <div className="text-muted small">Pendiente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estados de Cuotas */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <h6 className="card-title mb-3">Estado de Cuotas</h6>
            
            <div className="row">
              <div className="col-6 mb-3">
                <div className="d-flex align-items-center">
                  <CheckCircle size={16} className="text-success me-2" />
                  <div>
                    <div className="fw-bold">{resumen.cuotasPagadas}</div>
                    <div className="text-muted small">Pagadas</div>
                  </div>
                </div>
              </div>
              
              <div className="col-6 mb-3">
                <div className="d-flex align-items-center">
                  <AlertTriangle size={16} className="text-danger me-2" />
                  <div>
                    <div className="fw-bold">{resumen.cuotasVencidas}</div>
                    <div className="text-muted small">Vencidas</div>
                  </div>
                </div>
              </div>
              
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <TrendingUp size={16} className="text-info me-2" />
                  <div>
                    <div className="fw-bold">{resumen.cuotasParciales}</div>
                    <div className="text-muted small">Parciales</div>
                  </div>
                </div>
              </div>
              
              <div className="col-6">
                <div className="d-flex align-items-center">
                  <Clock size={16} className="text-secondary me-2" />
                  <div>
                    <div className="fw-bold">{resumen.cuotasPendientes}</div>
                    <div className="text-muted small">Pendientes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la Factura */}
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="row">
                  <div className="col-sm-3">
                    <div className="text-muted small">Total Factura</div>
                    <div className="fw-bold">{formatCurrency(factura.total)}</div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-muted small">Cuotas</div>
                    <div className="fw-bold">{totalCuotas} cuotas</div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-muted small">Valor por Cuota</div>
                    <div className="fw-bold">
                      {factura.valorCuota ? formatCurrency(factura.valorCuota) : '-'}
                    </div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-muted small">Interés Mensual</div>
                    <div className="fw-bold">
                      {factura.tasaInteres ? `${factura.tasaInteres}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-md-end">
                <div className="text-muted small">Fecha Facturación</div>
                <div className="fw-bold">
                  <Calendar size={14} className="me-1" />
                  {new Date(factura.fecha).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}