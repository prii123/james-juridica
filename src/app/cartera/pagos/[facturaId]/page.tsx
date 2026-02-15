'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Save, 
  DollarSign,
  CreditCard,
  Receipt,
  Calendar,
  User,
  FileText
} from 'lucide-react'

interface Factura {
  id: string
  numero: string
  total: number
  saldoPendiente: number
  fechaVencimiento: string
  modalidadPago: string
  numeroCuotas?: number
  valorCuota?: number
  tasaInteres?: number
  cliente: {
    nombre: string
    apellido?: string
    email: string
  }
  caso: {
    numeroCaso: string
  }
}

interface PagoRegistrado {
  id: string
  valor: number
  fecha: string
  metodoPago: string
  referencia?: string
  observaciones?: string
  usuario: {
    nombre: string
    apellido: string
  }
}

export default function RegistrarPagoPage() {
  const params = useParams()
  const router = useRouter()
  const facturaId = params.facturaId as string
  
  const [factura, setFactura] = useState<Factura | null>(null)
  const [pagosAnteriores, setPagosAnteriores] = useState<PagoRegistrado[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    valor: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'TRANSFERENCIA',
    referencia: '',
    observaciones: ''
  })

  useEffect(() => {
    if (facturaId) {
      fetchData()
    }
  }, [facturaId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos de la factura desde la API
      const response = await fetch(`/api/facturacion/${facturaId}`)
      
      if (!response.ok) {
        throw new Error('No se pudo cargar la factura')
      }
      
      const data = await response.json()
      
      // Calcular saldo pendiente basado en pagos
      const totalPagos = data.pagos?.reduce((sum: number, pago: any) => sum + Number(pago.valor), 0) || 0
      const saldoPendiente = Number(data.total) - totalPagos
      
      const facturaData: Factura = {
        id: data.id,
        numero: data.numero,
        total: Number(data.total),
        saldoPendiente: Math.max(0, saldoPendiente),
        fechaVencimiento: data.fechaVencimiento,
        modalidadPago: data.modalidadPago,
        numeroCuotas: data.numeroCuotas,
        valorCuota: data.valorCuota ? Number(data.valorCuota) : undefined,
        tasaInteres: data.tasaInteres ? Number(data.tasaInteres) : undefined,
        cliente: {
          nombre: data.honorario.caso.cliente.nombre,
          apellido: data.honorario.caso.cliente.apellido || '',
          email: data.honorario.caso.cliente.email
        },
        caso: {
          numeroCaso: data.honorario.caso.numeroCaso
        }
      }
      
      // Mapear pagos existentes
      const pagosData: PagoRegistrado[] = data.pagos?.map((pago: any) => ({
        id: pago.id,
        valor: Number(pago.valor),
        fecha: pago.fecha,
        metodoPago: pago.metodoPago,
        referencia: pago.referencia || '',
        observaciones: pago.observaciones || '',
        usuario: {
          nombre: pago.usuario?.nombre || 'Usuario',
          apellido: pago.usuario?.apellido || 'Sistema'
        }
      })) || []
      
      setFactura(facturaData)
      setPagosAnteriores(pagosData)
      
    } catch (error) {
      setError('Error al cargar la información')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'valor' ? value.replace(/[^0-9]/g, '') : value
    }))
  }

  const setPagoSugerido = (valor: number) => {
    setFormData(prev => ({
      ...prev,
      valor: valor.toString()
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!factura) return

    const valorPago = parseFloat(formData.valor) || 0
    
    if (valorPago <= 0) {
      setError('El valor del pago debe ser mayor que cero')
      return
    }

    if (valorPago > factura.saldoPendiente) {
      setError('El valor del pago no puede ser mayor que el saldo pendiente')
      return
    }

    if (!formData.fecha) {
      setError('La fecha del pago es requerida')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Here you would make an API call to register the payment
      // const response = await fetch(`/api/cartera/pagos`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     facturaId,
      //     ...formData,
      //     valor: valorPago
      //   })
      // })

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect back to cartera
      router.push('/cartera')
      
    } catch (error) {
      setError('Error al registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('es-CO').format(parseInt(value) || 0)
  }

  const getMetodoPagoLabel = (metodo: string) => {
    const metodos: Record<string, string> = {
      'EFECTIVO': 'Efectivo',
      'TRANSFERENCIA': 'Transferencia',
      'CONSIGNACION': 'Consignación',
      'CHEQUE': 'Cheque',
      'TARJETA_CREDITO': 'Tarjeta de Crédito',
      'TARJETA_DEBITO': 'Tarjeta de Débito'
    }
    return metodos[metodo] || metodo
  }

  const totalPagado = pagosAnteriores.reduce((sum, pago) => sum + pago.valor, 0)

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">Factura no encontrada</div>
        <Link href="/cartera" className="btn btn-primary">
          Volver a Cartera
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Cartera', href: '/cartera' },
          { label: 'Registrar Pago' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/cartera" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Registrar Pago</h1>
          <p className="text-secondary mb-0">
            {factura.numero} - {factura.cliente.nombre} {factura.cliente.apellido}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* Formulario de Pago */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <DollarSign size={16} />
                Nuevo Pago
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Valor del Pago *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="0"
                          value={formatNumber(formData.valor)}
                          onChange={(e) => handleInputChange('valor', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-text">
                        Saldo pendiente: {formatCurrency(factura.saldoPendiente)}
                        {factura?.modalidadPago === 'FINANCIADO' && factura?.valorCuota && (
                          <>
                            <br />
                            <span className="text-info">Valor de cuota sugerida: {formatCurrency(factura.valorCuota)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fecha del Pago *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('fecha', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Método de Pago *</label>
                      <select
                        className="form-select"
                        value={formData.metodoPago}
                        onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                        required
                      >
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                        <option value="CONSIGNACION">Consignación</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                        <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Referencia/Comprobante</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Número de transacción, cheque, etc."
                        value={formData.referencia}
                        onChange={(e) => handleInputChange('referencia', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Notas adicionales sobre el pago..."
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success d-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Registrar Pago
                      </>
                    )}
                  </button>
                  
                  <Link
                    href="/cartera"
                    className="btn btn-outline-secondary"
                  >
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Historial de Pagos */}
          {pagosAnteriores.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Receipt size={16} />
                  Historial de Pagos
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Valor</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Usuario</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosAnteriores.map((pago) => (
                        <tr key={pago.id}>
                          <td>
                            <small>{new Date(pago.fecha).toLocaleDateString()}</small>
                          </td>
                          <td>
                            <strong className="text-success">{formatCurrency(pago.valor)}</strong>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {getMetodoPagoLabel(pago.metodoPago)}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">{pago.referencia || '-'}</small>
                          </td>
                          <td>
                            <small>{pago.usuario.nombre} {pago.usuario.apellido}</small>
                          </td>
                          <td>
                            <small className="text-muted">{pago.observaciones || '-'}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {/* Resumen de la Factura */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Resumen de Factura</h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="h2 text-warning">{formatCurrency(factura.saldoPendiente)}</div>
                <div className="text-muted">Saldo Pendiente</div>
              </div>
              
              {/* Información del Plan de Pagos */}
              {factura.modalidadPago === 'FINANCIADO' && factura.numeroCuotas && factura.numeroCuotas > 1 && (
                <div className="alert alert-info mb-3">
                  <h6 className="mb-2">📋 Plan de Financiación</h6>
                  <div className="small">
                    <div><strong>Cuotas:</strong> {factura.numeroCuotas}</div>
                    <div><strong>Valor por cuota:</strong> {formatCurrency(factura.valorCuota || 0)}</div>
                    <div><strong>Tasa interés:</strong> {factura.tasaInteres || 0}% mensual</div>
                  </div>
                </div>
              )}
              
              <hr />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Factura:</span>
                  <strong>{formatCurrency(factura.total)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Pagado:</span>
                  <span className="text-success">{formatCurrency(totalPagado)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Pendiente:</span>
                  <span className="text-warning">{formatCurrency(factura.saldoPendiente)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Modalidad:</span>
                  <span className={factura.modalidadPago === 'FINANCIADO' ? 'text-warning' : 'text-success'}>
                    {factura.modalidadPago === 'FINANCIADO' ? 'Financiado' : 'Contado'}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Progreso:</span>
                  <span>{Math.round((totalPagado / factura.total) * 100)}%</span>
                </div>
              </div>

              <div className="progress mt-3" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${(totalPagado / factura.total) * 100}%` }}
                />
              </div>
              
              {/* Sugerencias de pago */}
              {factura.saldoPendiente > 0 && (
                <div className="mt-3">
                  {factura.modalidadPago === 'FINANCIADO' && factura.valorCuota && (
                    <button 
                      type="button"
                      className="btn btn-outline-primary btn-sm w-100 mb-2"
                      onClick={() => setPagoSugerido(factura.valorCuota || 0)}
                    >
                      💡 Pagar valor de cuota: {formatCurrency(factura.valorCuota)}
                    </button>
                  )}
                  <div className="d-flex gap-1">
                    <button 
                      type="button"
                      className="btn btn-outline-success btn-sm flex-fill"
                      onClick={() => setPagoSugerido(factura.saldoPendiente)}
                      title="Pagar el saldo completo"
                    >
                      Pagar Todo
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline-info btn-sm flex-fill"
                      onClick={() => setPagoSugerido(Math.floor(factura.saldoPendiente / 2))}
                      title="Pagar la mitad del saldo"
                    >
                      50%
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Información del Cliente</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <User size={20} className="text-muted me-2" />
                <div>
                  <strong>{factura.cliente.nombre} {factura.cliente.apellido}</strong>
                  <br />
                  <small className="text-muted">{factura.cliente.email}</small>
                </div>
              </div>
              
              <hr />
              
              <div className="small">
                <div><strong>Caso:</strong> {factura.caso.numeroCaso}</div>
                <div><strong>Factura:</strong> {factura.numero}</div>
                <div><strong>Vencimiento:</strong> {new Date(factura.fechaVencimiento).toLocaleDateString()}</div>
              </div>

              {new Date(factura.fechaVencimiento) < new Date() && (
                <div className="alert alert-warning alert-sm mt-3">
                  <small>
                    <strong>Factura Vencida</strong><br />
                    Vencida hace {Math.floor((Date.now() - new Date(factura.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))} días
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}