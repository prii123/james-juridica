'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Eye, Search, XCircle } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Spinner, Alert } from '@/components/ui'

interface FacturaAnulada {
  id: string
  numero: string
  fecha: string
  total: number
  anuladaEn: string | null
  updatedAt: string
  motivoAnulacion: string | null
  anuladaPorNombre: string | null
  caso?: { id: string; numeroCaso: string } | null
  cliente?: { id: string; nombre: string; apellido?: string; email: string } | null
  clienteNombre?: string | null
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

const formatDate = (s: string) => new Date(s).toLocaleDateString('es-CO')

export default function FacturasAnuladasPage() {
  const [facturas, setFacturas] = useState<FacturaAnulada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ estado: 'ANULADA' })
        if (search) params.set('search', search)
        const res = await fetch(`/api/facturacion?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las facturas anuladas')
        setFacturas(data.facturas || [])
      } catch (e: any) {
        setError(e.message)
        setFacturas([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  return (
    <>
      <Breadcrumb items={[{ label: 'Facturación', href: '/facturacion' }, { label: 'Anuladas' }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/facturacion">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-xl font-bold text-slate-800">Facturas anuladas</h1>
          <p className="mb-0 text-slate-500">Solo consulta: una factura anulada no se puede editar, enviar ni reactivar.</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardBody className="px-3 py-3">
          <div className="relative md:w-96">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Buscar por número, cliente o caso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><XCircle size={18} /> Anuladas</CardTitle>
          <Badge variant="secondary">{facturas.length}</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <Alert variant="danger" className="m-4">{error}</Alert>
          ) : facturas.length === 0 ? (
            <div className="py-5 text-center">
              <XCircle size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="mb-0 text-slate-500">No hay facturas anuladas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Número</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Caso</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Creada</th>
                    <th className="px-4 py-3 font-semibold">Anulada</th>
                    <th className="px-4 py-3 font-semibold">Motivo</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle"><strong>{f.numero}</strong></td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold text-slate-800">
                          {f.cliente ? `${f.cliente.nombre} ${f.cliente.apellido || ''}` : f.clienteNombre || '—'}
                        </div>
                        <div className="text-xs text-slate-500">{f.cliente?.email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant="outline">{f.caso?.numeroCaso ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">{formatCurrency(Number(f.total))}</td>
                      <td className="px-4 py-3 align-middle">{formatDate(f.fecha)}</td>
                      <td className="px-4 py-3 align-middle">
                        <div>{formatDate(f.anuladaEn || f.updatedAt)}</div>
                        {f.anuladaPorNombre && <div className="text-xs text-slate-500">por {f.anuladaPorNombre}</div>}
                      </td>
                      <td className="max-w-xs px-4 py-3 align-middle text-slate-600">
                        {f.motivoAnulacion || <span className="text-slate-400">Sin motivo registrado</span>}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/facturacion/${f.id}`}>
                          <Button variant="outlinePrimary" size="icon" title="Ver factura"><Eye size={14} /></Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
