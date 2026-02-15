'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  DollarSign, 
  CreditCard, 
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Zap
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
}

interface DistribucionCuota {
  cuotaId: string
  numeroCuota: number
  valorAplicado: number
  saldoDisponible: number
}

interface Props {
  facturaId: string
  cuotas: CuotaSeguimiento[]
  onPagoAplicado: () => void
  onCancel: () => void
  formatCurrency: (value: number) => string
}

export default function AplicarPago({ 
  facturaId, 
  cuotas, 
  onPagoAplicado, 
  onCancel, 
  formatCurrency 
}: Props) {
  const [formData, setFormData] = useState({
    valor: '',
    metodoPago: 'TRANSFERENCIA',
    referencia: '',
    observaciones: ''
  })
  
  const [aplicacionAutomatica, setAplicacionAutomatica] = useState(true)
  const [distribucionManual, setDistribucionManual] = useState<DistribucionCuota[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [distribucionSugerida, setDistribucionSugerida] = useState<DistribucionCuota[]>([])

  // Cuotas disponibles para aplicar pagos (con saldo pendiente)
  const cuotasDisponibles = cuotas.filter(c => c.saldoCuota > 0)

  useEffect(() => {
    if (formData.valor && aplicacionAutomatica) {
      calcularDistribucionAutomatica()
    }
  }, [formData.valor, aplicacionAutomatica])

  useEffect(() => {
    if (!aplicacionAutomatica) {
      inicializarDistribucionManual()
    }
  }, [aplicacionAutomatica])

  const calcularDistribucionAutomatica = () => {
    const valor = parseFloat(formData.valor) || 0
    if (valor <= 0) {
      setDistribucionSugerida([])
      return
    }

    let montoRestante = valor
    const distribucion: DistribucionCuota[] = []

    // Ordenar cuotas: vencidas primero, luego por fecha
    const cuotasOrdenadas = cuotasDisponibles
      .sort((a, b) => {
        // Primero las vencidas
        if (a.estado === 'VENCIDA' && b.estado !== 'VENCIDA') return -1
        if (a.estado !== 'VENCIDA' && b.estado === 'VENCIDA') return 1
        
        // Luego por fecha de vencimiento
        return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
      })

    for (const cuota of cuotasOrdenadas) {
      if (montoRestante <= 0) break
      
      const montoAplicar = Math.min(montoRestante, cuota.saldoCuota)
      if (montoAplicar > 0) {
        distribucion.push({
          cuotaId: cuota.id,
          numeroCuota: cuota.numeroCuota,
          valorAplicado: montoAplicar,
          saldoDisponible: cuota.saldoCuota
        })
        montoRestante -= montoAplicar
      }
    }

    setDistribucionSugerida(distribucion)
  }

  const inicializarDistribucionManual = () => {
    const distribucion = cuotasDisponibles.map(cuota => ({
      cuotaId: cuota.id,
      numeroCuota: cuota.numeroCuota,
      valorAplicado: 0,
      saldoDisponible: cuota.saldoCuota
    }))
    setDistribucionManual(distribucion)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDistribucionChange = (cuotaId: string, valor: number) => {
    setDistribucionManual(prev => prev.map(item => 
      item.cuotaId === cuotaId 
        ? { ...item, valorAplicado: Math.max(0, Math.min(valor, item.saldoDisponible)) }
        : item
    ))
  }

  const getTotalDistribucionManual = () => {
    return distribucionManual.reduce((sum, item) => sum + item.valorAplicado, 0)
  }

  const validarFormulario = () => {
    const valor = parseFloat(formData.valor) || 0
    
    if (valor <= 0) {
      setError('El valor del pago debe ser mayor a 0')
      return false
    }

    if (!aplicacionAutomatica) {
      const totalDistribucion = getTotalDistribucionManual()
      if (Math.abs(totalDistribucion - valor) > 0.01) {
        setError(`La distribución manual (${formatCurrency(totalDistribucion)}) debe coincidir con el valor del pago (${formatCurrency(valor)})`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario()) return

    try {
      setSaving(true)
      setError('')

      const valor = parseFloat(formData.valor)
      const distribucionFinal = aplicacionAutomatica 
        ? distribucionSugerida.map(item => ({
            cuotaId: item.cuotaId,
            valorAplicado: item.valorAplicado
          }))
        : distribucionManual.filter(item => item.valorAplicado > 0).map(item => ({
            cuotaId: item.cuotaId,
            valorAplicado: item.valorAplicado
          }))

      const response = await fetch('/api/cartera/aplicar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId,
          valor,
          metodoPago: formData.metodoPago,
          referencia: formData.referencia || undefined,
          observaciones: formData.observaciones || undefined,
          distribucionCuotas: distribucionFinal,
          aplicacionAutomatica
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aplicar el pago')
      }

      await onPagoAplicado()
      
    } catch (error: any) {
      setError(error.message || 'Error al aplicar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <DollarSign size={20} className="me-2" />
              Registrar Pago
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <AlertTriangle size={16} className="me-2" />
                  {error}
                </div>
              )}

              {/* Información del Pago */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">Información del Pago</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <DollarSign size={16} className="me-1" />
                          Valor del Pago *
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          value={formData.valor}
                          onChange={(e) => handleInputChange('valor', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <CreditCard size={16} className="me-1" />
                          Método de Pago *
                        </label>
                        <select
                          className="form-select"
                          value={formData.metodoPago}
                          onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                          required
                        >
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="CONSIGNACION">Consignación</option>
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                          <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <FileText size={16} className="me-1" />
                          Referencia
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.referencia}
                          onChange={(e) => handleInputChange('referencia', e.target.value)}
                          placeholder="Número de transacción, cheque, etc."
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Observaciones</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={formData.observaciones}
                          onChange={(e) => handleInputChange('observaciones', e.target.value)}
                          placeholder="Notas adicionales"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modo de Aplicación */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">Modo de Aplicación</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="modoAplicacion"
                          id="automatica"
                          checked={aplicacionAutomatica}
                          onChange={() => setAplicacionAutomatica(true)}
                        />
                        <label className="form-check-label" htmlFor="automatica">
                          <Zap size={16} className="me-1 text-success" />
                          <strong>Automática</strong>
                          <div className="small text-muted">
                            Aplica a cuotas vencidas primero, luego cronológicamente
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="modoAplicacion"
                          id="manual"
                          checked={!aplicacionAutomatica}
                          onChange={() => setAplicacionAutomatica(false)}
                        />
                        <label className="form-check-label" htmlFor="manual">
                          <Calculator size={16} className="me-1 text-primary" />
                          <strong>Manual</strong>
                          <div className="small text-muted">
                            Especifica el monto para cada cuota
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview de Distribución */}
              {formData.valor && (
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      {aplicacionAutomatica ? 'Vista Previa de Distribución' : 'Distribución Manual'}
                    </h6>
                    {aplicacionAutomatica && distribucionSugerida.length > 0 && (
                      <span className="badge bg-success">
                        <CheckCircle size={14} className="me-1" />
                        Distribución Válida
                      </span>
                    )}
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '80px' }}>Cuota</th>
                            <th>Estado</th>
                            <th>Saldo Disponible</th>
                            <th>Valor a Aplicar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aplicacionAutomatica ? (
                            // Vista previa automática
                            distribucionSugerida.map((item) => (
                              <tr key={item.cuotaId}>
                                <td>
                                  <span className="badge bg-primary">#{item.numeroCuota}</span>
                                </td>
                                <td>
                                  {cuotas.find(c => c.id === item.cuotaId)?.estado === 'VENCIDA' && (
                                    <span className="badge bg-danger">Vencida</span>
                                  )}
                                </td>
                                <td>{formatCurrency(item.saldoDisponible)}</td>
                                <td>
                                  <strong className="text-success">
                                    {formatCurrency(item.valorAplicado)}
                                  </strong>
                                </td>
                              </tr>
                            ))
                          ) : (
                            // Distribución manual
                            distribucionManual.map((item) => (
                              <tr key={item.cuotaId}>
                                <td>
                                  <span className="badge bg-primary">#{item.numeroCuota}</span>
                                </td>
                                <td>
                                  {cuotas.find(c => c.id === item.cuotaId)?.estado === 'VENCIDA' && (
                                    <span className="badge bg-danger">Vencida</span>
                                  )}
                                </td>
                                <td>{formatCurrency(item.saldoDisponible)}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min="0"
                                    max={item.saldoDisponible}
                                    step="0.01"
                                    value={item.valorAplicado}
                                    onChange={(e) => handleDistribucionChange(item.cuotaId, parseFloat(e.target.value) || 0)}
                                    style={{ width: '120px' }}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {!aplicacionAutomatica && (
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan={3}><strong>Total Distribuido:</strong></td>
                              <td>
                                <strong className={
                                  Math.abs(getTotalDistribucionManual() - (parseFloat(formData.valor) || 0)) < 0.01
                                    ? 'text-success' 
                                    : 'text-danger'
                                }>
                                  {formatCurrency(getTotalDistribucionManual())}
                                </strong>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={saving || !formData.valor}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="me-2" />
                    Aplicar Pago
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}