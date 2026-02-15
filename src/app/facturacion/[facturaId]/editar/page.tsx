'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calculator
} from 'lucide-react'

interface Factura {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  modalidadPago: 'CONTADO' | 'CREDITO' // Frontend usa CREDITO, backend FINANCIADO
  numeroCuotas?: number
  valorCuota?: number
  tasaInteres?: number
  observaciones?: string
  ivaActivado?: boolean
  honorario: {
    id: string
    tipo: string
    valor: number
    caso: {
      id: string
      numeroCaso: string
      cliente: {
        id: string
        nombre: string
        apellido?: string
        email: string
      }
    }
  }
  items: {
    id: string
    descripcion: string
    cantidad: number
    valorUnitario: number
    valorTotal: number
  }[]
}

interface ItemFactura {
  id?: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  valorTotal: number
}

export default function EditarFacturaPage({ params }: { params: { facturaId: string } }) {
  const router = useRouter()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    fechaVencimiento: '',
    observaciones: '',
    ivaActivado: true,
    modalidadPago: 'CONTADO' as 'CONTADO' | 'CREDITO',
    numeroCuotas: 1,
    tasaInteres: 0
  })
  
  const [items, setItems] = useState<ItemFactura[]>([])

  useEffect(() => {
    fetchFactura()
  }, [])

  useEffect(() => {
    // Calcular totales cuando cambian los items
    const nuevosItems = items.map(item => ({
      ...item,
      valorTotal: item.cantidad * item.valorUnitario
    }))
    if (JSON.stringify(nuevosItems) !== JSON.stringify(items)) {
      setItems(nuevosItems)
    }
  }, [items])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setFactura(data)
        
        // Inicializar formulario con datos actuales
        setFormData({
          fechaVencimiento: data.fechaVencimiento.split('T')[0], // Formato date input
          observaciones: data.observaciones || '',
          ivaActivado: data.ivaActivado !== undefined ? data.ivaActivado : true,
          modalidadPago: data.modalidadPago === 'FINANCIADO' ? 'CREDITO' : 'CONTADO', // Convertir backend a frontend
          numeroCuotas: data.numeroCuotas || 1,
          tasaInteres: data.tasaInteres || 0
        })
        
        // Inicializar items
        setItems(data.items || [])
      } else {
        setError('No se pudo cargar la factura')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'ivaActivado' 
        ? value === 'true' 
        : field === 'numeroCuotas'
        ? parseInt(value) || 1
        : field === 'tasaInteres'
        ? parseFloat(value) || 0
        : value
    }))
  }

  // Función para calcular el valor de la cuota con sistema francés
  const calcularCuota = (monto: number, cuotas: number, tasaMensual: number) => {
    if (tasaMensual === 0) {
      return monto / cuotas
    }
    
    const factor = Math.pow(1 + tasaMensual/100, cuotas)
    return (monto * (tasaMensual/100) * factor) / (factor - 1)
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const nuevosItems = [...items]
    nuevosItems[index] = {
      ...nuevosItems[index],
      [field]: field === 'descripcion' ? value : Number(value)
    }
    setItems(nuevosItems)
  }

  const agregarItem = () => {
    setItems([...items, {
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      valorTotal: 0
    }])
  }

  const eliminarItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!factura) return

    if (!formData.fechaVencimiento) {
      setError('La fecha de vencimiento es requerida')
      return
    }

    if (items.some(item => !item.descripcion || item.valorUnitario <= 0)) {
      setError('Completa todos los items de la factura')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      const response = await fetch(`/api/facturacion/${params.facturaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.descripcion && item.valorUnitario > 0)
        }),
      })

      if (response.ok) {
        router.push(`/facturacion/${params.facturaId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar la factura')
      }
    } catch (error) {
      setError('Error de conexión')
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

  const subtotal = items.reduce((sum, item) => sum + item.valorTotal, 0)
  const impuestos = formData.ivaActivado ? subtotal * 0.19 : 0 // IVA 19% solo si está activado
  const total = subtotal + impuestos

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error && !factura) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Factura no encontrada'}
        </div>
        <Link href="/facturacion" className="btn btn-primary">
          Volver a Facturación
        </Link>
      </div>
    )
  }

  if (!factura) {
    return null
  }

  // Solo permitir edición si está en estado GENERADA
  if (factura.estado !== 'GENERADA') {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning" role="alert">
          Solo se pueden editar facturas en estado "Generada"
        </div>
        <Link href={`/facturacion/${params.facturaId}`} className="btn btn-primary">
          Volver a la Factura
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Facturación', href: '/facturacion' },
          { label: factura.numero, href: `/facturacion/${params.facturaId}` },
          { label: 'Editar' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/facturacion/${params.facturaId}`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <h1 className="h3 fw-bold text-dark mb-1">Editar Factura</h1>
          <p className="text-secondary mb-0">
            {factura.numero} - {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* Información General */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Información General</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">Número de Factura</label>
                    <input
                      type="text"
                      className="form-control"
                      value={factura.numero}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Fecha de Vencimiento *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fechaVencimiento}
                      onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Modalidad de Pago *</label>
                    <select
                      className="form-select"
                      value={formData.modalidadPago}
                      onChange={(e) => handleInputChange('modalidadPago', e.target.value)}
                      required
                    >
                      <option value="CONTADO">Contado</option>
                      <option value="CREDITO">Crédito</option>
                    </select>
                  </div>
                </div>

                {/* Configuración de financiación para crédito */}
                {formData.modalidadPago === 'CREDITO' && (
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <label className="form-label">Número de Cuotas *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="60"
                        value={formData.numeroCuotas}
                        onChange={(e) => handleInputChange('numeroCuotas', e.target.value)}
                        required
                      />
                      <div className="form-text">Entre 1 y 60 cuotas</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tasa de Interés Mensual (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.tasaInteres}
                        onChange={(e) => handleInputChange('tasaInteres', e.target.value)}
                      />
                      <div className="form-text">0% para sin intereses, máx 10% mensual</div>
                    </div>
                  </div>
                )}

                {/* Mostrar valor de cuota calculado */}
                {formData.modalidadPago === 'CREDITO' && (
                  <div className="mt-3">
                    <div className="alert alert-info">
                      <h6 className="mb-1">Información de Financiación:</h6>
                      <div><strong>Valor por cuota:</strong> {formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres))}</div>
                      <div><strong>Total con intereses:</strong> {formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres) * formData.numeroCuotas)}</div>
                      <small className="text-muted">Sistema de amortización francés</small>
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones o notas adicionales..."
                  />
                </div>
                
                {/* Control de IVA */}
                <div className="mt-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ivaActivado"
                      checked={formData.ivaActivado}
                      onChange={(e) => handleInputChange('ivaActivado', e.target.checked.toString())}
                    />
                    <label className="form-check-label" htmlFor="ivaActivado">
                      Aplicar IVA (19%)
                    </label>
                    <div className="form-text">
                      Desactivar si el cliente está exento de IVA o el servicio no lo incluye
                    </div>
                  </div>
                </div>

                {/* Información del caso (solo lectura) */}
                <div className="mt-3">
                  <div className="bg-light p-3 rounded">
                    <h6 className="mb-2">Información del Caso</h6>
                    <div className="row text-sm">
                      <div className="col-md-6">
                        <div><strong>Cliente:</strong> {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}</div>
                        <div><strong>Email:</strong> {factura.honorario.caso.cliente.email}</div>
                      </div>
                      <div className="col-md-6">
                        <div><strong>Caso:</strong> {factura.honorario.caso.numeroCaso}</div>
                        <div><strong>Tipo Honorario:</strong> {factura.honorario.tipo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items de la Factura */}
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Items de la Factura</h5>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={agregarItem}
                >
                  <Plus size={14} className="me-1" />
                  Agregar Item
                </button>
              </div>
              <div className="card-body">
                {items.map((item, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Item {index + 1}</h6>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarItem(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Descripción *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio o producto"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Cantidad</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Valor Unit.</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          value={item.valorUnitario}
                          onChange={(e) => handleItemChange(index, 'valorUnitario', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Total</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formatCurrency(item.valorTotal)}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Resumen */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Calculator size={16} />
                  Resumen de Factura
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>IVA (19%):</span>
                  <span className={!formData.ivaActivado ? 'text-muted' : ''}>
                    {formData.ivaActivado ? formatCurrency(impuestos) : 'Exento'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Modalidad:</span>
                  <span className={formData.modalidadPago === 'CREDITO' ? 'text-warning' : 'text-success'}>
                    {formData.modalidadPago === 'CREDITO' ? 'A Crédito' : 'De Contado'}
                  </span>
                </div>
                {formData.modalidadPago === 'CREDITO' && (
                  <>
                    <div className="d-flex justify-content-between mb-2 small">
                      <span>Cuotas:</span>
                      <span>{formData.numeroCuotas}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 small">
                      <span>Valor cuota:</span>
                      <span>{formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres))}</span>
                    </div>
                  </>
                )}
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total:</span>
                  <span className="fw-bold text-success h5">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="card">
              <div className="card-body">
                <button
                  type="submit"
                  className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
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
                      Guardar Cambios
                    </>
                  )}
                </button>
                
                <Link
                  href={`/facturacion/${params.facturaId}`}
                  className="btn btn-outline-secondary w-100"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}