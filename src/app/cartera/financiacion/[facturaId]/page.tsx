'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Calculator, 
  Save, 
  DollarSign,
  Calendar,
  Percent,
  FileText
} from 'lucide-react'

interface Factura {
  id: string
  numero: string
  total: number
  saldoPendiente: number
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

interface CuotaAmortizacion {
  numero: number
  fechaVencimiento: string
  valorCuota: number
  capital: number
  interes: number
  saldo: number
}

export default function FinanciacionPage() {
  const params = useParams()
  const router = useRouter()
  const facturaId = params.facturaId as string
  
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    numeroCuotas: 6,
    tasaInteres: 2.5, // 2.5% mensual
    fechaInicio: new Date().toISOString().split('T')[0]
  })
  
  const [tablaCuotas, setTablaCuotas] = useState<CuotaAmortizacion[]>([])

  useEffect(() => {
    if (facturaId) {
      fetchFactura()
    }
  }, [facturaId])

  useEffect(() => {
    if (factura) {
      calcularCuotas()
    }
  }, [formData, factura])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      
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
        saldoPendiente: Math.max(0, saldoPendiente), // Evitar saldos negativos
        numeroCuotas: data.numeroCuotas,
        valorCuota: data.valorCuota ? Number(data.valorCuota) : undefined,
        tasaInteres: data.tasaInteres ? Number(data.tasaInteres) : undefined,
        cliente: {
          nombre: data.honorario.caso.cliente.nombre,
          apellido: data.honorario.caso.cliente.apellido || ''
        },
        caso: {
          numeroCaso: data.honorario.caso.numeroCaso
        }
      }
      
      setFactura(facturaData)
      
      // Actualizar formData con la configuración existente de la factura
      setFormData(prev => ({
        ...prev,
        numeroCuotas: data.numeroCuotas || prev.numeroCuotas,
        tasaInteres: data.tasaInteres ? Number(data.tasaInteres) : prev.tasaInteres
      }))
    } catch (error) {
      setError('Error al cargar la factura')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularCuotas = () => {
    if (!factura) return

    const monto = factura.saldoPendiente
    const cuotas = formData.numeroCuotas
    const tasaMensual = formData.tasaInteres / 100
    
    // Sistema francés de amortización
    let valorCuota = 0
    if (tasaMensual > 0) {
      const factor = Math.pow(1 + tasaMensual, cuotas)
      valorCuota = (monto * tasaMensual * factor) / (factor - 1)
    } else {
      valorCuota = monto / cuotas
    }

    const tabla: CuotaAmortizacion[] = []
    let saldoPendiente = monto
    const fechaInicio = new Date(formData.fechaInicio)

    for (let i = 1; i <= cuotas; i++) {
      const interes = saldoPendiente * tasaMensual
      const capital = valorCuota - interes
      saldoPendiente = saldoPendiente - capital

      // Para la última cuota, ajustar para evitar diferencias por redondeo
      if (i === cuotas) {
        const capitalAjustado = capital + saldoPendiente
        saldoPendiente = 0
      }

      const fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

      tabla.push({
        numero: i,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        valorCuota: Math.round(valorCuota),
        capital: Math.round(i === cuotas ? capital + saldoPendiente : capital),
        interes: Math.round(interes),
        saldo: Math.round(Math.max(0, saldoPendiente))
      })
    }

    setTablaCuotas(tabla)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'numeroCuotas' 
        ? parseInt(value) || 1
        : field === 'tasaInteres'
        ? parseFloat(value) || 0
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!factura) return

    if (formData.numeroCuotas < 2 || formData.numeroCuotas > 60) {
      setError('El número de cuotas debe estar entre 2 y 60')
      return
    }

    try {
      setSaving(true)
      setError('')

      // Here you would make an API call to save the financing plan
      // const response = await fetch(`/api/cartera/financiacion`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     facturaId,
      //     numeroCuotas: formData.numeroCuotas,
      //     tasaInteres: formData.tasaInteres,
      //     fechaInicio: formData.fechaInicio,
      //     cuotas: tablaCuotas
      //   })
      // })

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect back to cartera
      router.push('/cartera')
      
    } catch (error) {
      setError('Error al guardar la financiación')
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

  const totalIntereses = tablaCuotas.reduce((sum, cuota) => sum + cuota.interes, 0)
  const totalPagar = tablaCuotas.reduce((sum, cuota) => sum + cuota.valorCuota, 0)

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
          { label: 'Financiación' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/cartera" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">
            {factura?.numeroCuotas && factura.numeroCuotas > 1 
              ? 'Modificar Financiación' 
              : 'Configurar Financiación'}
          </h1>
          <p className="text-secondary mb-0">
            {factura.numero} - {factura.cliente.nombre} {factura.cliente.apellido}
            {factura?.numeroCuotas && factura.numeroCuotas > 1 && (
              <span className="text-info ms-2">(Ya financiada)</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-4">
          {/* Información de la Factura */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información de la Factura</h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="h2 text-primary">{formatCurrency(factura.saldoPendiente)}</div>
                <div className="text-muted">Saldo a Financiar</div>
              </div>
              <hr />
              <div className="small">
                <div><strong>Factura:</strong> {factura.numero}</div>
                <div><strong>Cliente:</strong> {factura.cliente.nombre} {factura.cliente.apellido}</div>
                <div><strong>Caso:</strong> {factura.caso.numeroCaso}</div>
                <div><strong>Total Original:</strong> {formatCurrency(factura.total)}</div>
                {factura.numeroCuotas && factura.numeroCuotas > 1 && (
                  <>
                    <hr />
                    <div className="text-info">
                      <div><strong>🛈 Configuración Actual:</strong></div>
                      <div>• {factura.numeroCuotas} cuotas</div>
                      <div>• {factura.tasaInteres || 0}% interés mensual</div>
                      {factura.valorCuota && (
                        <div>• {formatCurrency(factura.valorCuota)} por cuota</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Configuración */}
          {/* <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <Calculator size={16} />
                Configuración
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    <Calendar size={16} className="me-1" />
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fechaInicio}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Número de Cuotas</label>
                  <input
                    type="number"
                    className="form-control"
                    min="2"
                    max="60"
                    value={formData.numeroCuotas}
                    onChange={(e) => handleInputChange('numeroCuotas', e.target.value)}
                    required
                  />
                  <div className="form-text">Entre 2 y 60 cuotas</div>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    <Percent size={16} className="me-1" />
                    Tasa de Interés Mensual (%)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.tasaInteres}
                    onChange={(e) => handleInputChange('tasaInteres', e.target.value)}
                    required
                  />
                  <div className="form-text">0% para sin intereses</div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {factura?.numeroCuotas && factura.numeroCuotas > 1 
                        ? 'Actualizar Plan de Financiación' 
                        : 'Crear Plan de Financiación'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div> */}

          {/* Resumen */}
          {tablaCuotas.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Resumen Financiero</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Capital:</span>
                  <span>{formatCurrency(factura.saldoPendiente)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Intereses:</span>
                  <span className="text-warning">{formatCurrency(totalIntereses)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total a Pagar:</span>
                  <span className="fw-bold text-success">{formatCurrency(totalPagar)}</span>
                </div>
                <div className="text-center mt-2">
                  <small className="text-muted">
                    {formData.numeroCuotas} cuotas de ~{formatCurrency(tablaCuotas[0]?.valorCuota || 0)}
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-8">
          {/* Tabla de Amortización */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Tabla de Amortización</h5>
              <small className="text-muted">Sistema Francés</small>
            </div>
            <div className="card-body">
              {tablaCuotas.length === 0 ? (
                <div className="text-center py-5">
                  <Calculator size={48} className="text-muted mb-3" />
                  <p className="text-muted">Configure los parámetros para ver la tabla de amortización</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Cuota</th>
                        <th>Fecha Venc.</th>
                        <th>Valor Cuota</th>
                        <th>Capital</th>
                        <th>Interés</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaCuotas.map((cuota) => (
                        <tr key={cuota.numero}>
                          <td>
                            <span className="badge bg-primary">{cuota.numero}</span>
                          </td>
                          <td>
                            <small>{new Date(cuota.fechaVencimiento).toLocaleDateString()}</small>
                          </td>
                          <td>
                            <strong>{formatCurrency(cuota.valorCuota)}</strong>
                          </td>
                          <td>
                            <span className="text-success">{formatCurrency(cuota.capital)}</span>
                          </td>
                          <td>
                            <span className="text-warning">{formatCurrency(cuota.interes)}</span>
                          </td>
                          <td>
                            <span className="text-muted">{formatCurrency(cuota.saldo)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-secondary">
                      <tr>
                        <th colSpan={2}>TOTALES:</th>
                        <th>{formatCurrency(totalPagar)}</th>
                        <th className="text-success">{formatCurrency(factura.saldoPendiente)}</th>
                        <th className="text-warning">{formatCurrency(totalIntereses)}</th>
                        <th>-</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}