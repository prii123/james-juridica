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
  FileText,
  Search,
  CreditCard,
  Building,
  X
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

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

  const [searchTerm, setSearchTerm] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [showClientList, setShowClientList] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')

  // Casos sin facturar del cliente elegido, para poder asociar la factura a uno (facturación
  // directa, sin pasar por un Honorario).
  const [casosCliente, setCasosCliente] = useState<CasoDelCliente[]>([])
  const [loadingCasosCliente, setLoadingCasosCliente] = useState(false)
  const [casoId, setCasoId] = useState('')

  const [formData, setFormData] = useState({
    honorarioId: '',
    fechaVencimiento: '',
    observaciones: '',
    modalidadPago: 'CONTADO',
    numeroCuotas: 6,
    tasaInteres: 2.5,
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
    setCasoId('')
    if (!selectedCliente) {
      setCasosCliente([])
      return
    }
    let activo = true
    setLoadingCasosCliente(true)
    fetch(`/api/casos?clienteId=${selectedCliente.id}&facturado=0&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        if (activo) setCasosCliente(data.casos || [])
      })
      .catch(() => activo && setCasosCliente([]))
      .finally(() => activo && setLoadingCasosCliente(false))
    return () => { activo = false }
  }, [selectedCliente])

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
    setClienteNombre('')
  }

  const clearCliente = () => {
    setSelectedCliente(null)
    setClienteNombre('')
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

      const { modalidadPago, numeroCuotas, tasaInteres, ...restForm } = formData
      const body: Record<string, any> = {
        ...restForm,
        modalidadPago,
        items: items.filter(item => item.descripcion && item.valorUnitario > 0),
      }
      if (modalidadPago === 'CREDITO') {
        body.numeroCuotas = numeroCuotas
        body.tasaInteres = tasaInteres
      }
      if (selectedCliente) {
        body.clienteId = selectedCliente.id
      }
      if (clienteNombre.trim()) {
        body.clienteNombre = clienteNombre.trim()
      }
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
  const impuestos = subtotal * 0.19
  const total = subtotal + impuestos

  const honorarioSeleccionado = honorarios.find(h => h.id === formData.honorarioId)

  const honorariosFiltrados = honorarios.filter(h => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    const c = h.caso.cliente
    return c.nombre.toLowerCase().includes(q) ||
      (c.apellido?.toLowerCase() || '').includes(q) ||
      h.caso.numeroCaso.toLowerCase().includes(q)
  })

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
            Crear una nueva factura para honorarios pendientes o clientes
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
                    <Label>Cliente</Label>
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
                            <small className="text-slate-500">No se encontraron clientes. Puedes crear la factura igual.</small>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nombre libre si no hay cliente registrado */}
                    {!selectedCliente && (
                      <div className="mb-3">
                        <Label>O escribe el nombre del cliente</Label>
                        <Input
                          type="text"
                          placeholder="Nombre del cliente (opcional)"
                          value={clienteNombre}
                          onChange={(e) => setClienteNombre(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Honorario */}
                    <Label>
                      Honorario a Facturar <span className="text-slate-400">(opcional)</span>
                    </Label>
                    <div className="relative mb-2">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        className="pl-9"
                        placeholder="Filtrar por nombre o número de caso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {loadingHonorarios ? (
                      <div className="py-3 text-center">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                      </div>
                    ) : (
                      <Select
                        size={5}
                        value={formData.honorarioId}
                        onChange={(e) => handleInputChange('honorarioId', e.target.value)}
                        style={{ minHeight: '130px' }}
                      >
                        <option value="">-- Sin honorario (factura libre) --</option>
                        {honorariosFiltrados.map((honorario) => (
                          <option key={honorario.id} value={honorario.id}>
                            {honorario.caso.cliente.nombre} {honorario.caso.cliente.apellido} | {honorario.caso.numeroCaso} | {formatCurrency(honorario.valor)}
                          </option>
                        ))}
                      </Select>
                    )}
                    {honorarios.length === 0 && !loadingHonorarios && (
                      <Alert variant="info" className="mt-2 py-2 text-sm">
                        No hay honorarios pendientes. Puedes crear la factura sin asociar un honorario.
                      </Alert>
                    )}
                    {honorariosFiltrados.length === 0 && searchTerm && (
                      <Alert variant="info" className="mt-2 py-2 text-sm">
                        No se encontraron honorarios con ese criterio de búsqueda.
                      </Alert>
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
                      </div>
                    )}
                  </div>
                </div>

                {honorarioSeleccionado && (
                  <div className="mt-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <h6 className="mb-2 font-semibold text-slate-700">Información del Honorario Seleccionado</h6>
                      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="font-semibold">Cliente:</span>
                            <span>{honorarioSeleccionado.caso.cliente.nombre} {honorarioSeleccionado.caso.cliente.apellido}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" />
                            <span className="font-semibold">Caso:</span>
                            <span>{honorarioSeleccionado.caso.numeroCaso}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-teal-700">
                            Valor: {formatCurrency(honorarioSeleccionado.valor)}
                          </div>
                          <div className="text-slate-500">Tipo: {honorarioSeleccionado.tipo}</div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                {/* Cliente en resumen */}
                {(selectedCliente || clienteNombre) && (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="text-sm text-slate-500">Cliente</div>
                    <div className="font-semibold text-slate-800">
                      {selectedCliente
                        ? `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`
                        : clienteNombre}
                    </div>
                  </div>
                )}
                <div className="mb-2 flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(impuestos)}</span>
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
