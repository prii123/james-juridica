'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, BarChart3, Eye, History, Search } from 'lucide-react'
import { Button, Card, CardBody, Badge, Input, Spinner, Alert } from '@/components/ui'

interface FacturaPagada {
  id: string
  numero: string
  fecha: string
  fechaUltimoPago: string | null
  total: number
  numeroCuotas?: number
  cliente: { id: string; nombre: string; apellido?: string; email: string }
  caso: { id: string; numeroCaso: string }
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

export default function HistorialCarteraPage() {
  const [facturas, setFacturas] = useState<FacturaPagada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ vista: 'historial' })
        if (busqueda) params.set('search', busqueda)
        const res = await fetch(`/api/cartera?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el historial')
        setFacturas(data.facturas || [])
      } catch (e: any) {
        setError(e.message)
        setFacturas([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const totalRecaudado = facturas.reduce((s, f) => s + f.total, 0)

  return (
    <>
      <Breadcrumb items={[{ label: 'Cartera Financiada', href: '/cartera' }, { label: 'Historial' }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/cartera">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Historial de cartera</h1>
          <p className="mb-0 text-slate-500">Facturas financiadas ya pagadas por completo.</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardBody className="px-3 py-3">
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-96">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por factura, cliente o caso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500">
              {facturas.length} factura{facturas.length === 1 ? '' : 's'} · {formatCurrency(totalRecaudado)} recaudados
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <Alert variant="danger" className="m-4">{error}</Alert>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Factura</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Caso</th>
                  <th className="px-4 py-3 font-semibold">Cuotas</th>
                  <th className="px-4 py-3 font-semibold">Total pagado</th>
                  <th className="px-4 py-3 font-semibold">Último pago</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-center">
                      <History size={48} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500">Todavía no hay facturas pagadas por completo</p>
                    </td>
                  </tr>
                ) : (
                  facturas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <strong>{f.numero}</strong>
                        <div className="text-xs text-slate-500">{new Date(f.fecha).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <strong>{f.cliente.nombre} {f.cliente.apellido}</strong>
                        <div className="text-xs text-slate-500">{f.cliente.email}</div>
                      </td>
                      <td className="px-4 py-3 align-middle"><Badge variant="outline">{f.caso.numeroCaso}</Badge></td>
                      <td className="px-4 py-3 align-middle">{(f.numeroCuotas ?? 1) > 1 ? `${f.numeroCuotas} cuotas` : 'Sin cuotas'}</td>
                      <td className="px-4 py-3 align-middle">
                        <strong className="text-teal-700">{formatCurrency(f.total)}</strong>
                        <div><Badge variant="success">Pagada</Badge></div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {f.fechaUltimoPago ? new Date(f.fechaUltimoPago).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1">
                          <Link href={`/facturacion/${f.id}`}>
                            <Button variant="outlinePrimary" size="icon" title="Ver factura"><Eye size={14} /></Button>
                          </Link>
                          {(f.numeroCuotas ?? 1) > 1 && (
                            <Link href={`/cartera/seguimiento/${f.id}`}>
                              <Button variant="outline" size="icon" className="border-sky-700 text-sky-700 hover:bg-sky-50" title="Seguimiento de cuotas">
                                <BarChart3 size={14} />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
