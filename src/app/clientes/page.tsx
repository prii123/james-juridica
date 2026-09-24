'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { UserCheck, Search, Eye, Edit, Briefcase, FileText, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { TipoPersona } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Spinner, Alert } from '@/components/ui'

interface Cliente {
  id: string
  nombre: string
  apellido: string | null
  email: string
  telefono: string
  documento: string
  tipoPersona: TipoPersona
  empresa: string | null
  activo: boolean
  createdAt: string
  _count: { casos: number; facturas: number; radicaciones: number }
}

type EstadoFiltro = 'activos' | 'inactivos' | 'todos'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFiltro>('activos')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 })

  useEffect(() => {
    setPage(1)
  }, [search, estado])

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page: String(page), limit: '20', estado })
      if (search) params.append('search', search)

      const res = await fetch(`/api/clientes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudieron cargar los clientes')
        setClientes([])
        return
      }
      setClientes(data.clientes || [])
      setPagination({ total: data.total ?? 0, page: data.page ?? 1, limit: data.limit ?? 20 })
    } catch {
      setError('Error de conexión. Por favor, inténtelo de nuevo.')
      setClientes([])
    } finally {
      setLoading(false)
    }
  }, [search, estado, page])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  return (
    <>
      <Breadcrumb items={[{ label: 'Clientes' }]} />

      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Clientes</h1>
        <p className="mb-0 text-slate-500">
          Directorio de clientes: se crean automáticamente al calificar un lead o al aceptar una radicación.
        </p>
      </div>

      <Card className="mb-4">
        <CardBody className="p-3">
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                className="pl-9"
                placeholder="Buscar por nombre, documento, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={estado} onChange={(e) => setEstado(e.target.value as EstadoFiltro)} className="md:w-48">
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="todos">Todos</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck size={20} />
            Clientes
          </CardTitle>
          <Badge variant="primary">{pagination.total} cliente{pagination.total !== 1 ? 's' : ''}</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="py-5 text-center">
              <Alert variant="danger" title="Error al cargar clientes" className="mx-4 mb-4 text-left">
                {error}
              </Alert>
              <Button onClick={() => fetchClientes()}>Reintentar</Button>
            </div>
          ) : clientes.length === 0 ? (
            <div className="py-5 text-center">
              <UserCheck size={48} className="mx-auto mb-3 text-slate-300" />
              <h5 className="text-base font-semibold text-slate-700">No hay clientes</h5>
              <p className="mb-0 text-slate-500">
                {search ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes registrados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Documento</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Casos / Radicaciones / Facturas</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/clientes/${cliente.id}`} className="font-semibold text-slate-800 no-underline hover:text-blue-800">
                          {cliente.nombre} {cliente.apellido || ''}
                        </Link>
                        {cliente.empresa && <div className="text-xs text-slate-500">{cliente.empresa}</div>}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-slate-600">{cliente.documento}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-slate-700">{cliente.email}</span>
                          <span className="text-slate-500">{cliente.telefono}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge variant={cliente.activo ? 'success' : 'secondary'}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Briefcase size={12} />{cliente._count.casos}</span>
                          <span className="flex items-center gap-1"><FileText size={12} />{cliente._count.radicaciones}</span>
                          <span className="flex items-center gap-1"><Receipt size={12} />{cliente._count.facturas}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex gap-1">
                          <Link href={`/clientes/${cliente.id}`}>
                            <Button variant="outline" size="icon" title="Ver detalles">
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Link href={`/clientes/${cliente.id}/editar`}>
                            <Button variant="outline" size="icon" title="Editar">
                              <Edit size={14} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="mb-0 text-xs text-slate-500">
                    Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)} · {pagination.total} clientes
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={14} />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(pagination.total / pagination.limit)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
