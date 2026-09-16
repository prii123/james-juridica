'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import {
  Search,
  Eye,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Calendar,
  Percent,
  Calculator,
  BarChart3
} from 'lucide-react'
import { Button, Card, CardBody, Badge, Input, Select, Spinner, type BadgeProps } from '@/components/ui'

interface FacturaCartera {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  total: number
  saldoPendiente: number
  diasVencida: number
  estado: string
  modalidadPago: string
  numeroCuotas?: number
  valorCuota?: number
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email: string
  }
  caso: {
    id: string
    numeroCaso: string
  }
}

interface EstadisticasCartera {
  totalFacturas: number
  montoTotal: number
  montoVencido: number
  facturasMasVencidas: number
}

export default function CarteraPage() {
  const [facturas, setFacturas] = useState<FacturaCartera[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasCartera>({
    totalFacturas: 0,
    montoTotal: 0,
    montoVencido: 0,
    facturasMasVencidas: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODAS')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchCartera()
  }, [filtroEstado])

  // Efecto separado para búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCartera()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [busqueda])

  const fetchCartera = async () => {
    try {
      setLoading(true)

      // Construir parámetros de búsqueda
      const params = new URLSearchParams()
      if (busqueda) params.append('search', busqueda)
      if (filtroEstado !== 'TODAS') params.append('estado', filtroEstado)

      const response = await fetch(`/api/cartera?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al cargar las facturas de cartera')
      }

      const data = await response.json()
      const facturasFiltradas = data.facturas

      setFacturas(facturasFiltradas)

      // Calculate statistics - solo facturas a crédito
      const facturasPendientes = facturasFiltradas.filter((f: FacturaCartera) => f.saldoPendiente > 0)
      setEstadisticas({
        totalFacturas: facturasPendientes.length,
        montoTotal: facturasPendientes.reduce((sum: number, f: FacturaCartera) => sum + f.saldoPendiente, 0),
        montoVencido: facturasPendientes.filter((f: FacturaCartera) => f.diasVencida > 0).reduce((sum: number, f: FacturaCartera) => sum + f.saldoPendiente, 0),
        facturasMasVencidas: facturasPendientes.filter((f: FacturaCartera) => f.diasVencida > 30).length
      })

    } catch (error) {
      console.error('Error al cargar cartera:', error)
      setFacturas([])
      setEstadisticas({
        totalFacturas: 0,
        montoTotal: 0,
        montoVencido: 0,
        facturasMasVencidas: 0
      })
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

  const getEstadoBadge = (diasVencida: number, saldoPendiente: number) => {
    if (saldoPendiente === 0) {
      return <Badge variant="success">Pagada</Badge>
    } else if (diasVencida === 0) {
      return <Badge variant="info">Al día</Badge>
    } else if (diasVencida <= 30) {
      return <Badge variant="warning">Vencida {diasVencida}d</Badge>
    } else {
      return <Badge variant="danger">Crítica {diasVencida}d</Badge>
    }
  }

  if (loading) {
    return <Spinner />
  }

  const statCards: Array<{ icon: typeof CreditCard; value: string; label: string; bg: string }> = [
    { icon: CreditCard, value: String(estadisticas.totalFacturas), label: 'Facturas Pendientes', bg: 'bg-blue-800' },
    { icon: DollarSign, value: formatCurrency(estadisticas.montoTotal), label: 'Saldo Pendiente', bg: 'bg-teal-700' },
    { icon: AlertTriangle, value: formatCurrency(estadisticas.montoVencido), label: 'Monto Vencido', bg: 'bg-amber-500' },
    { icon: Calendar, value: String(estadisticas.facturasMasVencidas), label: 'Críticas (+30d)', bg: 'bg-red-600' },
  ]

  return (
    <>
      <Breadcrumb items={[{ label: 'Cartera Financiada' }]} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Cartera Financiada</h1>
          <p className="mb-0 text-slate-500">
            Gestión de facturas financiadas y financiación
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border-0 text-white`}>
            <CardBody>
              <div className="flex items-center">
                <stat.icon size={32} className="mr-3" />
                <div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <small>{stat.label}</small>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por factura, cliente o caso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="TODAS">Todas las facturas financiadas</option>
                <option value="PROXIMAS">Por vencer/al día</option>
                <option value="VENCIDAS">Vencidos</option>
                <option value="PAGADAS">Pagados</option>
              </Select>
            </div>
            <div className="text-right text-slate-500 md:col-span-5">
              Mostrando {facturas.length} facturas financiadas
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de facturas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Factura</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Caso</th>
                <th className="px-4 py-3 font-semibold">Modalidad</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Saldo</th>
                <th className="px-4 py-3 font-semibold">Vencimiento</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center">
                    <CreditCard size={48} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-500">No hay facturas financiadas que coincidan con los filtros</p>
                  </td>
                </tr>
              ) : (
                facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 align-middle">
                      <strong>{factura.numero}</strong>
                      <div className="text-xs text-slate-500">
                        {new Date(factura.fecha).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <strong>{factura.cliente.nombre} {factura.cliente.apellido}</strong>
                      <div className="text-xs text-slate-500">{factura.cliente.email}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant="outline">{factura.caso.numeroCaso}</Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant="warning">Financiado</Badge>
                      <div className="mt-1 text-xs text-slate-500">
                        {(factura.numeroCuotas ?? 1) === 1 ? (
                          <span className="text-sky-700">Sin financiar</span>
                        ) : (
                          `${factura.numeroCuotas} cuotas de ${formatCurrency(factura.valorCuota || 0)}`
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <strong>{formatCurrency(factura.total)}</strong>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {factura.saldoPendiente === 0 ? (
                        <Badge variant="success">Pagada</Badge>
                      ) : (
                        <>
                          <strong className="text-amber-600">{formatCurrency(factura.saldoPendiente)}</strong>
                          {factura.saldoPendiente < factura.total && (
                            <div className="text-xs text-teal-700">
                              Pagado: {formatCurrency(factura.total - factura.saldoPendiente)}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div>{new Date(factura.fechaVencimiento).toLocaleDateString()}</div>
                      {factura.diasVencida > 0 && (
                        <small className="text-red-600">Vencida hace {factura.diasVencida} días</small>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {getEstadoBadge(factura.diasVencida, factura.saldoPendiente)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex gap-1">
                        <Link href={`/facturacion/${factura.id}`}>
                          <Button variant="outlinePrimary" size="icon" title="Ver factura">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        {(factura.numeroCuotas ?? 1) === 1 && factura.saldoPendiente > 0 && (
                          <Link href={`/cartera/financiacion/${factura.id}`}>
                            <Button variant="outline" size="icon" className="border-sky-700 text-sky-700 hover:bg-sky-50" title="Configurar financiación">
                              <Calculator size={14} />
                            </Button>
                          </Link>
                        )}
                        {(factura.numeroCuotas ?? 1) > 1 && (
                          <>
                            <Link href={`/cartera/financiacion/${factura.id}`}>
                              <Button variant="outline" size="icon" className="border-amber-500 text-amber-600 hover:bg-amber-50" title="Ver plan de cuotas">
                                <Percent size={14} />
                              </Button>
                            </Link>
                            <Link href={`/cartera/seguimiento/${factura.id}`}>
                              <Button variant="outline" size="icon" className="border-sky-700 text-sky-700 hover:bg-sky-50" title="Seguimiento de cuotas">
                                <BarChart3 size={14} />
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
