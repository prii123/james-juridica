'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Save,
  User,
  FileText,
  Search,
  CreditCard,
  Building,
  X
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Producto {
  id: string
  nombre: string
  tipo: 'PRODUCTO' | 'SERVICIO'
  precio: string | number
}

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  email: string
  documento: string
  telefono: string
}

interface CasoDelCliente {
  id: string
  numeroCaso: string
  tipoInsolvencia: string
}

interface ItemFactura {
  productoId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  valorTotal: number
}

export default function NuevaFacturaPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <NuevaFacturaContent />
    </Suspense>
  )
}

function NuevaFacturaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const casoIdParam = searchParams.get('casoId')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)
  // IVA opcional: por defecto en 0 (sin IVA).
  const [ivaActivado, setIvaActivado] = useState(false)

  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [showClientList, setShowClientList] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  // Casos sin facturar del cliente elegido, para poder asociar la factura a uno (facturación
  // directa).
  const [casosCliente, setCasosCliente] = useState<CasoDelCliente[]>([])
  const [loadingCasosCliente, setLoadingCasosCliente] = useState(false)
  const [casoId, setCasoId] = useState('')

  const [formData, setFormData] = useState({
    fechaVencimiento: '',
    observaciones: '',
    modalidadPago: 'CONTADO',
    numeroCuotas: 6,
    tasaInteres: 2.5,
    valorPagado: '',
    metodoPago: 'EFECTIVO',
  })

  const [items, setItems] = useState<ItemFactura[]>([
    {
      productoId: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      valorTotal: 0
    }
  ])

  useEffect(() => {
    fetchProductos()
  }, [])

  // Llegando desde "Generar Factura" en un caso (/facturacion/nueva?casoId=...): se precarga el
  // cliente de ese caso, y el caso queda elegido en cuanto aparezca en su lista de pendientes
  // (ver el useEffect de casosCliente más abajo).
  useEffect(() => {
    if (!casoIdParam) return
    fetch(`/api/casos/${casoIdParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.cliente) {
          setSelectedCliente({
            id: data.cliente.id,
            nombre: data.cliente.nombre,
            apellido: data.cliente.apellido,
            email: data.cliente.email,
            documento: data.cliente.documento,
            telefono: data.cliente.telefono,
          })
        }
      })
      .catch(() => undefined)
  }, [casoIdParam])

  useEffect(() => {
    const nuevosItems = items.map(item => ({
      ...item,
      valorTotal: item.cantidad * item.valorUnitario
    }))
    if (JSON.stringify(nuevosItems) !== JSON.stringify(items)) {
      setItems(nuevosItems)
    }
  }, [items])

  useEffect(() => {
    if (clienteSearch.length < 2) {
      setClientes([])
      setShowClientList(false)
      return
    }
    const timer = setTimeout(() => {
      fetchClientes(clienteSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteSearch])

  useEffect(() => {
    if (!selectedCliente) {
      setCasosCliente([])
      setCasoId('')
      return
    }
    let activo = true
    setLoadingCasosCliente(true)
    fetch(`/api/casos?clienteId=${selectedCliente.id}&facturado=0&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (!activo) return
        const casos: CasoDelCliente[] = data.casos || []
        setCasosCliente(casos)
        // Si venimos de "Generar Factura" en ese caso, queda elegido apenas aparece en la lista
        // de pendientes; si no, se limpia (cambió de cliente y el caso anterior ya no aplica).
        setCasoId(casoIdParam && casos.some((c) => c.id === casoIdParam) ? casoIdParam : '')
      })
      .catch(() => activo && setCasosCliente([]))
      .finally(() => activo && setLoadingCasosCliente(false))
    return () => { activo = false }
  }, [selectedCliente, casoIdParam])

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/productos')
      if (response.ok) {
        const data = await response.json()
        setProductos(data.productos || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoadingProductos(false)
    }
  }

  // Al elegir un producto/servicio se copian su nombre y precio al item (el precio sigue editable).
  const seleccionarProducto = (index: number, productoId: string) => {
    const producto = productos.find((p) => p.id === productoId)
    const nuevosItems = [...items]
    nuevosItems[index] = {
      ...nuevosItems[index],
      productoId,
      descripcion: producto?.nombre || '',
      valorUnitario: producto ? Number(producto.precio) : 0,
    }
    setItems(nuevosItems)
  }

  const fetchClientes = async (search: string) => {
    try {
      setLoadingClientes(true)
      const response = await fetch(`/api/clientes?search=${encodeURIComponent(search)}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
        setShowClientList(true)
      }
    } catch (error) {
      console.error('Error al buscar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const selectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setClienteSearch('')
    setClientes([])
    setShowClientList(false)
  }

  const clearCliente = () => {
    setSelectedCliente(null)
  }

  const handleInputChange = (field: string, value: string | number) => {
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
      productoId: '',
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

    if (!selectedCliente) {
      setError('Selecciona un cliente. Si no existe, créalo primero en Clientes.')
      return
    }

    if (!formData.fechaVencimiento) {
      setError('Ingresa la fecha de vencimiento')
      return
    }

    if (items.some(item => !item.descripcion || item.valorUnitario <= 0)) {
      setError('Selecciona un producto o servicio en todos los items de la factura')
      return
    }

    try {
      setLoading(true)
      setError('')

      const { modalidadPago, numeroCuotas, tasaInteres, valorPagado, metodoPago, ...restForm } = formData
      const body: Record<string, any> = {
        ...restForm,
        modalidadPago,
        ivaActivado,
        items: items.filter(item => item.descripcion && item.valorUnitario > 0),
      }
      if (modalidadPago === 'CREDITO') {
        body.numeroCuotas = numeroCuotas
        body.tasaInteres = tasaInteres
        if (Number(valorPagado) > 0) {
          body.valorPagado = Number(valorPagado)
          body.metodoPago = metodoPago
        }
      }
      body.clienteId = selectedCliente.id
      if (casoId) {
        body.casoId = casoId
      }
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
  const impuestos = ivaActivado ? subtotal * 0.19 : 0
  const total = subtotal + impuestos
  const saldoFinanciar = Math.max(0, total - (Number(formData.valorPagado) || 0))

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Facturación', href: '/facturacion' },
          { label: 'Nueva Factura' }
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/facturacion">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="mb-1 text-xl font-bold text-slate-800">Nueva Factura</h1>
          <p className="mb-0 text-slate-500">
            Crear una nueva factura seleccionando productos o servicios
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    {/* Selección de Cliente */}
                    <Label>Cliente *</Label>
                    {selectedCliente ? (
                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <User size={16} className="text-slate-500" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800">
                            {selectedCliente.nombre} {selectedCliente.apellido || ''}
                          </div>
                          <div className="text-sm text-slate-500">{selectedCliente.documento}</div>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={clearCliente}>
                          <X size={14} />
                        </Button>
                      </div>
                    ) : null}

                    {/* Casos sin facturar del cliente elegido */}
                    {selectedCliente && (
                      <div className="mb-3">
                        <Label>
                          Caso a Facturar <span className="text-slate-400">(opcional)</span>
                        </Label>
                        {loadingCasosCliente ? (
                          <div className="py-2 text-center">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                          </div>
                        ) : casosCliente.length === 0 ? (
                          <p className="mb-0 text-sm text-slate-500">
                            Este cliente no tiene casos pendientes de facturar.
                          </p>
                        ) : (
                          <Select value={casoId} onChange={(e) => setCasoId(e.target.value)}>
                            <option value="">-- No asociar a un caso --</option>
                            {casosCliente.map((c) => (
                              <option key={c.id} value={c.id}>{c.numeroCaso}</option>
                            ))}
                          </Select>
                        )}
                      </div>
                    )}

                    {!selectedCliente && (
                      <div className="relative mb-3">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="text"
                          className="pl-9"
                          placeholder="Buscar cliente por nombre, apellido o documento..."
                          value={clienteSearch}
                          onChange={(e) => setClienteSearch(e.target.value)}
                          onFocus={() => clientes.length > 0 && setShowClientList(true)}
                        />
                        {loadingClientes && (
                          <div className="absolute z-10 w-full rounded-b-lg border border-t-0 border-slate-200 bg-white p-2 text-center shadow-sm">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                          </div>
                        )}
                        {showClientList && clientes.length > 0 && (
                          <div className="absolute z-10 max-h-52 w-full overflow-y-auto rounded-b-lg border border-t-0 border-slate-200 bg-white shadow-sm">
                            {clientes.map((cliente) => (
                              <button
                                key={cliente.id}
                                type="button"
                                className="w-full border-0 bg-transparent p-2 text-left hover:bg-slate-50"
                                onClick={() => selectCliente(cliente)}
                              >
                                <div className="text-sm font-semibold text-slate-800">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {cliente.documento} | {cliente.email}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {showClientList && clientes.length === 0 && clienteSearch.length >= 2 && !loadingClientes && (
                          <div className="absolute z-10 w-full rounded-b-lg border border-t-0 border-slate-200 bg-white p-2 shadow-sm">
                            <small className="text-slate-500">No se encontraron clientes. Créalo primero en Clientes.</small>
                          </div>
                        )}
                      </div>
                    )}

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
                    <div className="mt-3">
                      <Label>Modalidad de Pago</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.modalidadPago === 'CONTADO' ? 'success' : 'outline'}
                          className={cn('flex-1 justify-center', formData.modalidadPago !== 'CONTADO' && 'border-teal-700 text-teal-700 hover:bg-teal-50')}
                          onClick={() => handleInputChange('modalidadPago', 'CONTADO')}
                        >
                          <Building size={16} />
                          Contado
                        </Button>
                        <Button
                          type="button"
                          variant={formData.modalidadPago === 'CREDITO' ? 'primary' : 'outlinePrimary'}
                          className="flex-1 justify-center"
                          onClick={() => handleInputChange('modalidadPago', 'CREDITO')}
                        >
                          <CreditCard size={16} />
                          Crédito
                        </Button>
                      </div>
                    </div>
                    {formData.modalidadPago === 'CREDITO' && (
                      <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <h6 className="mb-1 font-semibold text-slate-700">Configuración de Financiación</h6>
                        <div>
                          <Label className="text-xs">Número de Cuotas</Label>
                          <Input
                            type="number"
                            min={2}
                            max={60}
                            value={formData.numeroCuotas}
                            onChange={(e) => handleInputChange('numeroCuotas', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tasa de Interés Mensual (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={formData.tasaInteres}
                            onChange={(e) => handleInputChange('tasaInteres', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Valor pagado (abono inicial)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={total}
                            step="0.01"
                            placeholder="0"
                            value={formData.valorPagado}
                            onChange={(e) => handleInputChange('valorPagado', e.target.value)}
                          />
                        </div>
                        {Number(formData.valorPagado) > 0 && (
                          <div>
                            <Label className="text-xs">Método del pago</Label>
                            <Select value={formData.metodoPago} onChange={(e) => handleInputChange('metodoPago', e.target.value)}>
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="TRANSFERENCIA">Transferencia</option>
                              <option value="CONSIGNACION">Consignación</option>
                              <option value="CHEQUE">Cheque</option>
                              <option value="TARJETA_CREDITO">Tarjeta de crédito</option>
                              <option value="TARJETA_DEBITO">Tarjeta de débito</option>
                            </Select>
                          </div>
                        )}
                        {saldoFinanciar > 0 && formData.numeroCuotas >= 2 && (
                          <p className="mb-0 text-xs text-slate-500">
                            Saldo a financiar: <strong>{formatCurrency(saldoFinanciar)}</strong> en {formData.numeroCuotas} cuotas.
                          </p>
                        )}
                        {Number(formData.valorPagado) > total && (
                          <p className="mb-0 text-xs text-red-600">El valor pagado no puede superar el total de la factura.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <Label>Observaciones</Label>
                  <Textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones o notas adicionales..."
                  />
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
                        <Label>Producto o servicio *</Label>
                        <Select
                          value={item.productoId}
                          onChange={(e) => seleccionarProducto(index, e.target.value)}
                          required
                        >
                          <option value="">-- Selecciona --</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} ({p.tipo === 'SERVICIO' ? 'Servicio' : 'Producto'}) - {formatCurrency(Number(p.precio))}
                            </option>
                          ))}
                        </Select>
                        {!loadingProductos && productos.length === 0 && (
                          <small className="text-slate-500">
                            No hay productos ni servicios.{' '}
                            <Link href="/facturacion/productos" className="text-blue-800">Créalos aquí</Link>.
                          </small>
                        )}
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
                {/* Cliente en resumen */}
                {selectedCliente && (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="text-sm text-slate-500">Cliente</div>
                    <div className="font-semibold text-slate-800">
                      {selectedCliente.nombre} {selectedCliente.apellido || ''}
                    </div>
                  </div>
                )}
                <div className="mb-2 flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <label htmlFor="ivaActivado" className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    id="ivaActivado"
                    type="checkbox"
                    checked={ivaActivado}
                    onChange={(e) => setIvaActivado(e.target.checked)}
                  />
                  Aplicar IVA (19%)
                </label>
                <div className="mb-2 flex justify-between">
                  <span>IVA:</span>
                  <span className={cn(!ivaActivado && 'text-slate-400')}>
                    {ivaActivado ? formatCurrency(impuestos) : formatCurrency(0)}
                  </span>
                </div>
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
                <Button type="submit" variant="success" loading={loading} className="w-full justify-center">
                  {!loading && <Save size={16} />}
                  {loading ? 'Creando...' : 'Crear Factura'}
                </Button>
                <Link href="/facturacion">
                  <Button type="button" variant="outline" className="mt-2 w-full justify-center">Cancelar</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </>
  )
}
