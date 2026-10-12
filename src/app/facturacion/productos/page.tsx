'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import Modal from '@/components/ui/Modal'
import { ArrowLeft, Edit, Package, Plus, Power, Search } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Input, Select, Textarea, Label, Spinner, Alert } from '@/components/ui'

interface Producto {
  id: string
  nombre: string
  tipo: 'PRODUCTO' | 'SERVICIO'
  descripcion: string | null
  precio: string | number
  activo: boolean
}

const VACIO = { nombre: '', tipo: 'SERVICIO', descripcion: '', precio: '' }

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<'activos' | 'todos'>('activos')
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const [form, setForm] = useState(VACIO)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (estado === 'todos') params.set('estado', 'todos')
      const res = await fetch(`/api/productos?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los productos')
      setProductos(data.productos || [])
    } catch (e: any) {
      setError(e.message)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }, [search, estado])

  useEffect(() => {
    const t = setTimeout(cargar, 250)
    return () => clearTimeout(t)
  }, [cargar])

  const abrir = (p: Producto | 'nuevo') => {
    setFormError(null)
    setForm(p === 'nuevo' ? VACIO : { nombre: p.nombre, tipo: p.tipo, descripcion: p.descripcion || '', precio: String(Number(p.precio)) })
    setEditando(p)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const nuevo = editando === 'nuevo'
      const res = await fetch(nuevo ? '/api/productos' : `/api/productos/${(editando as Producto).id}`, {
        method: nuevo ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setFormError(data.error || 'No se pudo guardar')
      setEditando(null)
      cargar()
    } catch {
      setFormError('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const alternarActivo = async (p: Producto) => {
    await fetch(`/api/productos/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !p.activo }),
    })
    cargar()
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Facturación', href: '/facturacion' }, { label: 'Productos y servicios' }]} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/facturacion">
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Productos y servicios</h1>
            <p className="mb-0 text-slate-500">Catálogo que se selecciona al crear una factura.</p>
          </div>
        </div>
        <Button onClick={() => abrir('nuevo')}><Plus size={16} /> Nuevo</Button>
      </div>

      <Card className="mb-4">
        <CardBody className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={estado} onChange={(e) => setEstado(e.target.value as 'activos' | 'todos')} className="md:w-48">
              <option value="activos">Activos</option>
              <option value="todos">Todos</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package size={20} /> Catálogo</CardTitle>
          <Badge variant="primary">{productos.length}</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <Spinner />
          ) : error ? (
            <Alert variant="danger" className="m-4">{error}</Alert>
          ) : productos.length === 0 ? (
            <div className="py-5 text-center text-slate-500">
              <Package size={48} className="mx-auto mb-3 text-slate-300" />
              Todavía no hay productos ni servicios.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Precio</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{p.nombre}</div>
                        {p.descripcion && <div className="text-xs text-slate-500">{p.descripcion}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={p.tipo === 'SERVICIO' ? 'info' : 'secondary'}>{p.tipo === 'SERVICIO' ? 'Servicio' : 'Producto'}</Badge></td>
                      <td className="px-4 py-3">{formatCurrency(Number(p.precio))}</td>
                      <td className="px-4 py-3"><Badge variant={p.activo ? 'success' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" title="Editar" onClick={() => abrir(p)}><Edit size={14} /></Button>
                          <Button variant="outline" size="icon" title={p.activo ? 'Desactivar' : 'Activar'} onClick={() => alternarActivo(p)}><Power size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {editando && (
        <Modal
          onClose={() => setEditando(null)}
          title={editando === 'nuevo' ? 'Nuevo producto o servicio' : 'Editar'}
          icon={<Package size={18} />}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button type="submit" form="form-producto" loading={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </>
          }
        >
          {formError && <Alert variant="danger" className="mb-4">{formError}</Alert>}
          <form id="form-producto" onSubmit={guardar} className="space-y-4">
            <div>
              <Label className="font-semibold">Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Tipo</Label>
                <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="SERVICIO">Servicio</option>
                  <option value="PRODUCTO">Producto</option>
                </Select>
              </div>
              <div>
                <Label className="font-semibold">Precio *</Label>
                <Input type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label className="font-semibold">Descripción</Label>
              <Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
