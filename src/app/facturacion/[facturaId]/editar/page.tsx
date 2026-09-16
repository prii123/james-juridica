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
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Factura {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  modalidadPago: 'CONTADO' | 'CREDITO'
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
  } | null
  cliente?: {
    id: string
    nombre: string
    apellido?: string
    email: string
    telefono: string
    documento: string
  } | null
  clienteNombre?: string | null
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

    const factor = Math.pow(1 + tasaMensual / 100, cuotas)
    return (monto * (tasaMensual / 100) * factor) / (factor - 1)
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
  const impuestos = formData.ivaActivado ? subtotal * 0.19 : 0
  const total = subtotal + impuestos

  if (loading) {
    return <Spinner />
  }

  if (error && !factura) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Factura no encontrada'}</Alert>
        <Link href="/facturacion"><Button>Volver a Facturación</Button></Link>
      </div>
    )
  }

  if (!factura) {
    return null
  }

  // Solo permitir edición si está en estado GENERADA
  if (factura.estado !== 'GENERADA') {
    return (
      <div className="py-5 text-center">
        <Alert variant="warning" className="mb-4">
          Solo se pueden editar facturas en estado "Generada"
        </Alert>
        <Link href={`/facturacion/${params.facturaId}`}><Button>Volver a la Factura</Button></Link>
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

      <div className="mb-4 flex items-center gap-3">
        <Link href={`/facturacion/${params.facturaId}`}>
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="mb-1 text-xl font-bold text-slate-800">Editar Factura</h1>
          <p className="mb-0 text-slate-500">
            {factura.numero} - {factura.honorario
              ? `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido}`
              : factura.cliente
                ? `${factura.cliente.nombre} ${factura.cliente.apellido || ''}`
                : factura.clienteNombre || 'Sin cliente asociado'}
          </p>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {/* Información General */}
            <Card>
              <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Número de Factura</Label>
                    <Input type="text" value={factura.numero} readOnly />
                  </div>
                  <div>
                    <Label>Fecha de Vencimiento *</Label>
                    <Input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label>Modalidad de Pago *</Label>
                    <Select
                      value={formData.modalidadPago}
                      onChange={(e) => handleInputChange('modalidadPago', e.target.value)}
                      required
                    >
                      <option value="CONTADO">Contado</option>
                      <option value="CREDITO">Crédito</option>
                    </Select>
                  </div>
                </div>

                {/* Configuración de financiación para crédito */}
                {formData.modalidadPago === 'CREDITO' && (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>Número de Cuotas *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.numeroCuotas}
                        onChange={(e) => handleInputChange('numeroCuotas', e.target.value)}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">Entre 1 y 60 cuotas</p>
                    </div>
                    <div>
                      <Label>Tasa de Interés Mensual (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        value={formData.tasaInteres}
                        onChange={(e) => handleInputChange('tasaInteres', e.target.value)}
                      />
                      <p className="mt-1 text-xs text-slate-500">0% para sin intereses, máx 30% mensual</p>
                    </div>
                  </div>
                )}

                {/* Mostrar valor de cuota calculado */}
                {formData.modalidadPago === 'CREDITO' && (
                  <Alert variant="info" className="mt-3">
                    <div>
                      <h6 className="mb-1 font-semibold">Información de Financiación:</h6>
                      <div><strong>Valor por cuota:</strong> {formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres))}</div>
                      <div><strong>Total con intereses:</strong> {formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres) * formData.numeroCuotas)}</div>
                      <small className="text-slate-500">Sistema de amortización francés</small>
                    </div>
                  </Alert>
                )}

                <div className="mt-3">
                  <Label>Observaciones</Label>
                  <Textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones o notas adicionales..."
                  />
                </div>

                {/* Control de IVA */}
                <div className="mt-3">
                  <label htmlFor="ivaActivado" className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="ivaActivado"
                      className="mt-1 h-4 w-4 accent-blue-800"
                      checked={formData.ivaActivado}
                      onChange={(e) => handleInputChange('ivaActivado', e.target.checked.toString())}
                    />
                    <span>
                      <span className="text-sm text-slate-800">Aplicar IVA (19%)</span>
                      <span className="block text-xs text-slate-500">
                        Desactivar si el cliente está exento de IVA o el servicio no lo incluye
                      </span>
                    </span>
                  </label>
                </div>

                {/* Información del caso (solo lectura) */}
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <h6 className="mb-2 font-semibold text-slate-700">Información del Cliente</h6>
                  {factura.honorario ? (
                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <div>
                        <div><strong>Cliente:</strong> {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}</div>
                        <div><strong>Email:</strong> {factura.honorario.caso.cliente.email}</div>
                      </div>
                      <div>
                        <div><strong>Caso:</strong> {factura.honorario.caso.numeroCaso}</div>
                        <div><strong>Tipo Honorario:</strong> {factura.honorario.tipo}</div>
                      </div>
                    </div>
                  ) : factura.cliente ? (
                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <div>
                        <div><strong>Cliente:</strong> {factura.cliente.nombre} {factura.cliente.apellido || ''}</div>
                        <div><strong>Email:</strong> {factura.cliente.email}</div>
                      </div>
                      <div>
                        <div><strong>Teléfono:</strong> {factura.cliente.telefono || '-'}</div>
                        <div><strong>Documento:</strong> {factura.cliente.documento || '-'}</div>
                      </div>
                    </div>
                  ) : factura.clienteNombre ? (
                    <div className="text-sm"><strong>Cliente:</strong> {factura.clienteNombre}</div>
                  ) : (
                    <p className="mb-0 text-sm text-slate-500">Sin cliente asociado</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Items de la Factura */}
            <Card>
              <CardHeader>
                <CardTitle>Items de la Factura</CardTitle>
                <Button type="button" variant="outlinePrimary" size="sm" onClick={agregarItem}>
                  <Plus size={14} />
                  Agregar Item
                </Button>
              </CardHeader>
              <CardBody className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h6 className="mb-0 font-semibold text-slate-700">Item {index + 1}</h6>
                      {items.length > 1 && (
                        <Button type="button" variant="outlineDanger" size="icon" onClick={() => eliminarItem(index)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-6">
                        <Label>Descripción *</Label>
                        <Input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio o producto"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Valor Unit.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.valorUnitario}
                          onChange={(e) => handleItemChange(index, 'valorUnitario', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Total</Label>
                        <Input type="text" value={formatCurrency(item.valorTotal)} readOnly />
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={16} />
                  Resumen de Factura
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="mb-2 flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span>IVA (19%):</span>
                  <span className={cn(!formData.ivaActivado && 'text-slate-400')}>
                    {formData.ivaActivado ? formatCurrency(impuestos) : 'Exento'}
                  </span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span>Modalidad:</span>
                  <span className={formData.modalidadPago === 'CREDITO' ? 'text-amber-600' : 'text-teal-700'}>
                    {formData.modalidadPago === 'CREDITO' ? 'A Crédito' : 'De Contado'}
                  </span>
                </div>
                {formData.modalidadPago === 'CREDITO' && (
                  <>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Cuotas:</span>
                      <span>{formData.numeroCuotas}</span>
                    </div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Valor cuota:</span>
                      <span>{formatCurrency(calcularCuota(total, formData.numeroCuotas, formData.tasaInteres))}</span>
                    </div>
                  </>
                )}
                <hr className="my-3 border-slate-200" />
                <div className="flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="text-xl font-bold text-teal-700">{formatCurrency(total)}</span>
                </div>
              </CardBody>
            </Card>

            {/* Acciones */}
            <Card>
              <CardBody>
                <Button type="submit" variant="success" loading={saving} className="mb-2 w-full justify-center">
                  {!saving && <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Link href={`/facturacion/${params.facturaId}`}>
                  <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}
