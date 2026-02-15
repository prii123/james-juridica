'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calculator,
  Save,
  User,
  FileText
} from 'lucide-react'

interface Honorario {
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

interface ItemFactura {
  descripcion: string
  cantidad: number
  valorUnitario: number
  valorTotal: number
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [loadingHonorarios, setLoadingHonorarios] = useState(true)
  
  const [formData, setFormData] = useState({
    honorarioId: '',
    fechaVencimiento: '',
    observaciones: ''
  })
  
  const [items, setItems] = useState<ItemFactura[]>([
    {
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      valorTotal: 0
    }
  ])

  useEffect(() => {
    fetchHonorariosDisponibles()
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

  const fetchHonorariosDisponibles = async () => {
    try {
      const response = await fetch('/api/facturacion/honorarios-disponibles')
      if (response.ok) {
        const data = await response.json()
        setHonorarios(data.honorarios || [])
      }
    } catch (error) {
      console.error('Error al cargar honorarios:', error)
    } finally {
      setLoadingHonorarios(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
    
    if (!formData.honorarioId) {
      setError('Selecciona un honorario')
      return
    }

    if (!formData.fechaVencimiento) {
      setError('Ingresa la fecha de vencimiento')
      return
    }

    if (items.some(item => !item.descripcion || item.valorUnitario <= 0)) {
      setError('Completa todos los items de la factura')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.descripcion && item.valorUnitario > 0)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/facturacion/${result.factura.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al crear la factura')
      }
    } catch (error) {
      setError('Error de conexión')
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

  const subtotal = items.reduce((sum, item) => sum + item.valorTotal, 0)
  const impuestos = subtotal * 0.19 // IVA 19%
  const total = subtotal + impuestos

  const honorarioSeleccionado = honorarios.find(h => h.id === formData.honorarioId)

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Facturación', href: '/facturacion' },
          { label: 'Nueva Factura' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/facturacion" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <h1 className="h3 fw-bold text-dark mb-1">Nueva Factura</h1>
          <p className="text-secondary mb-0">
            Crear una nueva factura para honorarios pendiente
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
                  <div className="col-md-6">
                    <label className="form-label">Honorario a Facturar *</label>
                    {loadingHonorarios ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={formData.honorarioId}
                        onChange={(e) => handleInputChange('honorarioId', e.target.value)}
                        required
                      >
                        <option value="">Selecciona un honorario</option>
                        {honorarios.map((honorario) => (
                          <option key={honorario.id} value={honorario.id}>
                            {honorario.caso.numeroCaso} - {honorario.caso.cliente.nombre} {honorario.caso.cliente.apellido} - {formatCurrency(honorario.valor)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-md-6">
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
                </div>
                
                {honorarioSeleccionado && (
                  <div className="mt-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="mb-2">Información del Honorario Seleccionado</h6>
                      <div className="row text-sm">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <User size={14} />
                            <span className="fw-semibold">Cliente:</span>
                            <span>{honorarioSeleccionado.caso.cliente.nombre} {honorarioSeleccionado.caso.cliente.apellido}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <FileText size={14} />
                            <span className="fw-semibold">Caso:</span>
                            <span>{honorarioSeleccionado.caso.numeroCaso}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold text-success">
                            Valor: {formatCurrency(honorarioSeleccionado.valor)}
                          </div>
                          <div className="text-muted">
                            Tipo: {honorarioSeleccionado.tipo}
                          </div>
                        </div>
                      </div>
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
                  <span>{formatCurrency(impuestos)}</span>
                </div>
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
                  className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Crear Factura
                    </>
                  )}
                </button>
                
                <Link
                  href="/facturacion"
                  className="btn btn-outline-secondary w-100 mt-2"
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