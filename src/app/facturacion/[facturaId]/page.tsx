'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import EnviarFacturaModal from '@/components/EnviarFacturaModal'
import {
  ArrowLeft,
  Edit3,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Printer
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Factura {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  subtotal: number
  impuestos: number
  total: number
  estado: 'GENERADA' | 'ENVIADA' | 'PAGADA' | 'VENCIDA' | 'ANULADA'
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
        telefono: string
        documento: string
      }
    }
  } | null
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email: string
    telefono: string
    documento: string
  } | null
  clienteNombre?: string | null
  creadoPor: {
    id: string
    nombre: string
    apellido: string
  }
  items: {
    id: string
    descripcion: string
    cantidad: number
    valorUnitario: number
    valorTotal: number
  }[]
  pagos: {
    id: string
    fecha: string
    valor: number
    metodo: string
    referencia?: string
  }[]
  createdAt: string
  updatedAt: string
}

const ESTADO_CONFIG: Record<Factura['estado'], { badge: BadgeProps['variant']; icon: typeof Clock; label: string; dot: string }> = {
  GENERADA: { badge: 'warning', icon: Clock, label: 'Generada', dot: 'bg-amber-500' },
  ENVIADA: { badge: 'info', icon: Send, label: 'Enviada', dot: 'bg-sky-600' },
  PAGADA: { badge: 'success', icon: CheckCircle, label: 'Pagada', dot: 'bg-teal-600' },
  VENCIDA: { badge: 'danger', icon: AlertTriangle, label: 'Vencida', dot: 'bg-red-600' },
  ANULADA: { badge: 'secondary', icon: XCircle, label: 'Anulada', dot: 'bg-slate-400' },
}

export default function FacturaDetailPage({ params }: { params: { facturaId: string } }) {
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  useEffect(() => {
    fetchFactura()
  }, [])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}`)

      if (response.ok) {
        const data = await response.json()
        setFactura(data)
      } else {
        setError('No se pudo cargar la factura')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!factura) return

    const confirmMessage = {
      'ENVIADA': '¿Marcar esta factura como enviada?',
      'PAGADA': '¿Marcar esta factura como pagada?',
      'VENCIDA': '¿Marcar esta factura como vencida?',
      'ANULADA': '¿Estás seguro de que quieres anular esta factura? Esta acción no se puede deshacer.'
    }[nuevoEstado]

    if (!confirm(confirmMessage)) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        await fetchFactura() // Recargar datos
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}/pdf`)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Error al descargar el PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${factura?.numero || params.facturaId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(error.message || 'Error al descargar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDue = (fechaVencimiento: string) => {
    const today = new Date()
    const dueDate = new Date(fechaVencimiento)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getClienteDisplay = () => {
    if (!factura) return ''
    if (factura.honorario) {
      return `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido} - ${factura.honorario.caso.numeroCaso}`
    }
    if (factura.cliente) {
      return `${factura.cliente.nombre} ${factura.cliente.apellido || ''}`
    }
    if (factura.clienteNombre) {
      return factura.clienteNombre
    }
    return 'Sin cliente asociado'
  }

  if (loading) {
    return <Spinner />
  }

  if (error || !factura) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Factura no encontrada'}</Alert>
        <Link href="/facturacion"><Button>Volver a Facturación</Button></Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[factura.estado]
  const IconoEstado = estadoConfig.icon
  const diasVencimiento = getDaysUntilDue(factura.fechaVencimiento)

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Facturación', href: '/facturacion' },
          { label: factura.numero }
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/facturacion">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="mb-0 text-xl font-bold text-slate-800">{factura.numero}</h1>
            <Badge variant={estadoConfig.badge}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </Badge>
            {diasVencimiento < 0 && (
              <Badge variant="danger">Vencida ({Math.abs(diasVencimiento)} días)</Badge>
            )}
            {diasVencimiento >= 0 && diasVencimiento <= 7 && factura.estado !== 'PAGADA' && (
              <Badge variant="warning">Vence en {diasVencimiento} días</Badge>
            )}
          </div>
          <p className="mb-0 text-slate-500">{getClienteDisplay()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {factura.estado === 'GENERADA' && (
            <Link href={`/facturacion/${params.facturaId}/editar`}>
              <Button variant="outlinePrimary">
                <Edit3 size={16} />
                Editar
              </Button>
            </Link>
          )}
          <Button variant="outline">
            <Printer size={16} />
            Imprimir
          </Button>
          <Button variant="outlinePrimary" onClick={handleDownloadPDF} loading={downloadingPdf}>
            {!downloadingPdf && <Download size={16} />}
            {downloadingPdf ? 'Descargando...' : 'Descargar PDF'}
          </Button>
          <Button variant="success" onClick={() => setShowSendModal(true)}>
            <Send size={16} />
            Enviar
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Información de la Factura */}
          <Card>
            <CardHeader><CardTitle>Detalles de la Factura</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Información General</h6>
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-semibold">Fecha de Emisión:</span>
                    <span>{formatDate(factura.fecha)}</span>
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-semibold">Fecha de Vencimiento:</span>
                    <span>{formatDate(factura.fechaVencimiento)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="font-semibold">Creada por:</span>
                    <span>{factura.creadoPor.nombre} {factura.creadoPor.apellido}</span>
                  </div>
                </div>
                <div>
                  <h6 className="mb-1 text-sm text-slate-500">Totales</h6>
                  <div className="mb-1 flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(factura.subtotal)}</span>
                  </div>
                  <div className="mb-1 flex justify-between">
                    <span>IVA (19%):</span>
                    <span className={cn(!factura.ivaActivado && 'text-slate-400')}>
                      {factura.ivaActivado ? formatCurrency(factura.impuestos) : 'Exento'}
                    </span>
                  </div>
                  <hr className="my-2 border-slate-200" />
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-teal-700">{formatCurrency(factura.total)}</span>
                  </div>
                </div>
              </div>

              {factura.observaciones && (
                <div className="mt-3">
                  <h6 className="mb-2 text-sm text-slate-500">Observaciones</h6>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-0">{factura.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Estado del IVA */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-slate-500">Estado del IVA:</span>
                <Badge variant={factura.ivaActivado ? 'success' : 'secondary'}>
                  {factura.ivaActivado ? 'IVA Aplicado (19%)' : 'Exento de IVA'}
                </Badge>
              </div>
            </CardBody>
          </Card>

          {/* Items de la Factura */}
          <Card>
            <CardHeader><CardTitle>Items Facturados</CardTitle></CardHeader>
            <CardBody className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Descripción</th>
                    <th className="px-3 py-2 font-semibold">Cantidad</th>
                    <th className="px-3 py-2 font-semibold">Valor Unitario</th>
                    <th className="px-3 py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {factura.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 align-middle">{item.descripcion}</td>
                      <td className="px-3 py-2 align-middle">{item.cantidad}</td>
                      <td className="px-3 py-2 align-middle">{formatCurrency(item.valorUnitario)}</td>
                      <td className="px-3 py-2 align-middle">{formatCurrency(item.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Pagos Registrados */}
          {factura.pagos.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Pagos Registrados</CardTitle></CardHeader>
              <CardBody className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Fecha</th>
                      <th className="px-3 py-2 font-semibold">Valor</th>
                      <th className="px-3 py-2 font-semibold">Método</th>
                      <th className="px-3 py-2 font-semibold">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {factura.pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td className="px-3 py-2 align-middle">{formatDate(pago.fecha)}</td>
                        <td className="px-3 py-2 align-middle">{formatCurrency(pago.valor)}</td>
                        <td className="px-3 py-2 align-middle">{pago.metodo}</td>
                        <td className="px-3 py-2 align-middle">{pago.referencia || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          {/* Información del Cliente */}
          <Card>
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardBody>
              {factura.honorario ? (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}
                    </span>
                  </div>
                  <div className="mb-1 text-sm text-slate-500">
                    <div><strong>Email:</strong> {factura.honorario.caso.cliente.email}</div>
                    <div><strong>Teléfono:</strong> {factura.honorario.caso.cliente.telefono}</div>
                    <div><strong>Documento:</strong> {factura.honorario.caso.cliente.documento}</div>
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline">Caso: {factura.honorario.caso.numeroCaso}</Badge>
                  </div>
                </>
              ) : factura.cliente ? (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {factura.cliente.nombre} {factura.cliente.apellido || ''}
                    </span>
                  </div>
                  <div className="mb-1 text-sm text-slate-500">
                    <div><strong>Email:</strong> {factura.cliente.email}</div>
                    <div><strong>Teléfono:</strong> {factura.cliente.telefono}</div>
                    <div><strong>Documento:</strong> {factura.cliente.documento}</div>
                  </div>
                </>
              ) : factura.clienteNombre ? (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-800">{factura.clienteNombre}</span>
                </div>
              ) : (
                <p className="mb-0 text-slate-500">Sin información de cliente asociada</p>
              )}
            </CardBody>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardBody className="grid gap-2">
              {factura.estado === 'GENERADA' && (
                <Button
                  className="justify-center bg-sky-600 hover:bg-sky-700"
                  onClick={() => handleEstadoChange('ENVIADA')}
                  disabled={updating}
                >
                  <Send size={16} />
                  Marcar como Enviada
                </Button>
              )}

              {factura.estado === 'ENVIADA' && (
                <Button
                  variant="success"
                  className="justify-center"
                  onClick={() => handleEstadoChange('PAGADA')}
                  disabled={updating}
                >
                  <CheckCircle size={16} />
                  Marcar como Pagada
                </Button>
              )}

              {factura.estado !== 'PAGADA' && factura.estado !== 'ANULADA' && (
                <Button
                  variant="outlineDanger"
                  className="justify-center"
                  onClick={() => handleEstadoChange('ANULADA')}
                  disabled={updating}
                >
                  <XCircle size={16} />
                  Anular Factura
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardBody>
              <div className="relative pl-8">
                <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-slate-200" />
                <div className={cn('relative', factura.estado !== 'GENERADA' && 'mb-6')}>
                  <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-800" />
                  <div className="ml-2">
                    <h6 className="mb-1 font-semibold text-slate-800">Factura Generada</h6>
                    <small className="text-slate-500">{formatDate(factura.createdAt)}</small>
                  </div>
                </div>

                {factura.estado !== 'GENERADA' && (
                  <div className="relative">
                    <div className={cn('absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white', estadoConfig.dot)} />
                    <div className="ml-2">
                      <h6 className="mb-1 font-semibold text-slate-800">{estadoConfig.label}</h6>
                      <small className="text-slate-500">{formatDate(factura.updatedAt)}</small>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {showSendModal && factura && (
        <EnviarFacturaModal
          facturaId={params.facturaId}
          tipo="factura"
          clienteNombre={factura.honorario
            ? `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido}`
            : factura.cliente
              ? `${factura.cliente.nombre} ${factura.cliente.apellido || ''}`
              : factura.clienteNombre || 'Sin cliente'}
          email={factura.honorario?.caso?.cliente?.email || factura.cliente?.email || ''}
          telefono={factura.honorario?.caso?.cliente?.telefono || factura.cliente?.telefono || ''}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
