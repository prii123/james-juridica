'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Edit3, Mail, Phone, FileText, Building2, MapPin, Briefcase, Receipt } from 'lucide-react'
import { TipoPersona, EstadoCaso, EstadoRadicacion, EstadoFactura } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner, type BadgeProps } from '@/components/ui'

interface ClienteDetalle {
  id: string
  nombre: string
  apellido: string | null
  email: string
  telefono: string
  documento: string
  tipoPersona: TipoPersona
  empresa: string | null
  direccion: string | null
  ciudad: string | null
  activo: boolean
  createdAt: string
  casos: Array<{ id: string; numeroCaso: string; estado: EstadoCaso; tipoInsolvencia: string; createdAt: string }>
  radicaciones: Array<{ id: string; numero: string; estado: EstadoRadicacion; fechaSolicitud: string }>
  facturas: Array<{ id: string; numero: string; estado: EstadoFactura; total: number; fecha: string }>
}

const CASO_BADGE: Record<EstadoCaso, BadgeProps['variant']> = {
  ACTIVO: 'success', CERRADO: 'secondary', SUSPENDIDO: 'warning', ARCHIVADO: 'secondary',
}
const RADICACION_BADGE: Record<EstadoRadicacion, BadgeProps['variant']> = {
  SOLICITADA: 'warning', PROGRAMADA: 'primary', REALIZADA: 'success', CANCELADA: 'danger',
}
const FACTURA_BADGE: Record<EstadoFactura, BadgeProps['variant']> = {
  GENERADA: 'secondary', ENVIADA: 'info', PAGADA: 'success', VENCIDA: 'danger', ANULADA: 'secondary',
}

export default function ClienteDetailPage() {
  const params = useParams()
  const clienteId = params.clienteId as string

  const [cliente, setCliente] = useState<ClienteDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clienteId) return
    fetch(`/api/clientes/${clienteId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el cliente')
        setCliente(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [clienteId])

  if (loading) return <Spinner />

  if (error || !cliente) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">{error || 'Cliente no encontrado'}</Alert>
        <Link href="/clientes"><Button>Volver a Clientes</Button></Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Clientes', href: '/clientes' }, { label: `${cliente.nombre} ${cliente.apellido || ''}`.trim() }]} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="mb-0 text-2xl font-bold text-slate-800">{cliente.nombre} {cliente.apellido || ''}</h1>
              <Badge variant={cliente.activo ? 'success' : 'secondary'}>{cliente.activo ? 'Activo' : 'Inactivo'}</Badge>
            </div>
            <p className="mb-0 text-slate-500">{cliente.empresa || (cliente.tipoPersona === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica')}</p>
          </div>
        </div>
        <Link href={`/clientes/${clienteId}/editar`}>
          <Button variant="outlinePrimary">
            <Edit3 size={16} />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader><CardTitle>Información de Contacto</CardTitle></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {cliente.email}</div>
              <div className="flex items-center gap-2"><Phone size={16} className="text-slate-400" /> {cliente.telefono}</div>
              <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400" /> Doc: {cliente.documento}</div>
              {cliente.empresa && (
                <div className="flex items-center gap-2"><Building2 size={16} className="text-slate-400" /> {cliente.empresa}</div>
              )}
              {(cliente.direccion || cliente.ciudad) && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  {[cliente.direccion, cliente.ciudad].filter(Boolean).join(', ')}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase size={18} /> Casos ({cliente.casos.length})</CardTitle></CardHeader>
            <CardBody className="p-0">
              {cliente.casos.length === 0 ? (
                <p className="mb-0 p-4 text-sm text-slate-500">Sin casos registrados.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.casos.map((c) => (
                    <Link key={c.id} href={`/casos/${c.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm no-underline hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{c.numeroCaso}</span>
                      <Badge variant={CASO_BADGE[c.estado]}>{c.estado}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Radicaciones ({cliente.radicaciones.length})</CardTitle></CardHeader>
            <CardBody className="p-0">
              {cliente.radicaciones.length === 0 ? (
                <p className="mb-0 p-4 text-sm text-slate-500">Sin radicaciones registradas.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.radicaciones.map((r) => (
                    <Link key={r.id} href={`/radicaciones/${r.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm no-underline hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{r.numero}</span>
                      <Badge variant={RADICACION_BADGE[r.estado]}>{r.estado}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt size={18} /> Facturas recientes ({cliente.facturas.length})</CardTitle></CardHeader>
            <CardBody className="p-0">
              {cliente.facturas.length === 0 ? (
                <p className="mb-0 p-4 text-sm text-slate-500">Sin facturas registradas.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cliente.facturas.map((f) => (
                    <Link key={f.id} href={`/facturacion/${f.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm no-underline hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{f.numero}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">${Number(f.total).toLocaleString('es-CO')}</span>
                        <Badge variant={FACTURA_BADGE[f.estado]}>{f.estado}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
