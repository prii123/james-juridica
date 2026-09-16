'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Alert, Spinner, type BadgeProps } from '@/components/ui'

interface Factura {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  subtotal: number
  impuestos: number
  total: number
  estado: 'GENERADA' | 'ENVIADA' | 'PAGADA' | 'VENCIDA' | 'ANULADA'
  modalidadPago: 'CONTADO' | 'FINANCIADO'
  observaciones?: string
  honorario: {
    id: string
    tipo: string
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
  } | null
  clienteNombre?: string | null
  creadoPor: {
    id: string
    nombre: string
    apellido: string
  }
}

const ESTADO_CONFIG: Record<Factura['estado'], { badge: BadgeProps['variant']; icon: typeof Clock; label: string }> = {
  GENERADA: { badge: 'warning', icon: Clock, label: 'Generada' },
  ENVIADA: { badge: 'info', icon: Send, label: 'Enviada' },
  PAGADA: { badge: 'success', icon: CheckCircle, label: 'Pagada' },
  VENCIDA: { badge: 'danger', icon: AlertTriangle, label: 'Vencida' },
  ANULADA: { badge: 'secondary', icon: XCircle, label: 'Anulada' },
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  useEffect(() => {
    fetchFacturas()
  }, [search, estadoFilter])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/facturacion?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFacturas(data.facturas || [])
      } else {
        setError('No se pudieron cargar las facturas')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (facturaId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/facturacion/${facturaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        await fetchFacturas() // Recargar lista
      } else {
        setError('No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
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
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Facturación' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold text-slate-800">Facturación</h1>
          <p className="mb-0 text-slate-500">
            Gestión de facturas y pagos del sistema jurídico
          </p>
        </div>
        <Link href="/facturacion/nueva">
          <Button>
            <Plus size={16} />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por número, cliente o caso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="GENERADA">Generada</option>
                <option value="ENVIADA">Enviada</option>
                <option value="PAGADA">Pagada</option>
                <option value="VENCIDA">Vencida</option>
                <option value="ANULADA">Anulada</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => { setSearch(''); setEstadoFilter('') }}
              >
                <Filter size={16} />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Facturas */}
      <Card>
        <CardHeader><CardTitle>Facturas ({facturas.length})</CardTitle></CardHeader>
        <CardBody>
          {facturas.length === 0 ? (
            <div className="py-5 text-center">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-500">No hay facturas</h5>
              <p className="mb-4 text-slate-500">Aún no se han generado facturas en el sistema</p>
              <Link href="/facturacion/nueva">
                <Button>
                  <Plus size={16} />
                  Crear Primera Factura
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Número</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Caso</th>
                    <th className="px-4 py-3 font-semibold">Fecha Emisión</th>
                    <th className="px-4 py-3 font-semibold">Modalidad Pago</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturas.map((factura) => {
                    const estadoConfig = ESTADO_CONFIG[factura.estado]
                    const IconoEstado = estadoConfig.icon

                    return (
                      <tr key={factura.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-slate-800">{factura.numero}</div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-semibold text-slate-800">
                            {factura.honorario
                              ? `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido}`
                              : factura.cliente
                                ? `${factura.cliente.nombre} ${factura.cliente.apellido || ''}`
                                : factura.clienteNombre || '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {factura.honorario?.caso.cliente.email
                              ?? factura.cliente?.email
                              ?? '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant="outline">
                            {factura.honorario?.caso.numeroCaso ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(factura.fecha)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={factura.modalidadPago === 'CONTADO' ? 'success' : 'warning'}>
                            {factura.modalidadPago === 'CONTADO' ? 'Contado' : 'Financiado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-bold text-teal-700">
                            {formatCurrency(factura.total)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={estadoConfig.badge}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex gap-1">
                            <Link href={`/facturacion/${factura.id}`}>
                              <Button variant="outlinePrimary" size="icon" title="Ver detalles">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            {factura.estado === 'GENERADA' && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-sky-700 text-sky-700 hover:bg-sky-50"
                                onClick={() => handleEstadoChange(factura.id, 'ENVIADA')}
                                title="Marcar como enviada"
                              >
                                <Send size={14} />
                              </Button>
                            )}
                            {factura.estado === 'ENVIADA' && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-teal-700 text-teal-700 hover:bg-teal-50"
                                onClick={() => handleEstadoChange(factura.id, 'PAGADA')}
                                title="Marcar como pagada"
                              >
                                <CheckCircle size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
