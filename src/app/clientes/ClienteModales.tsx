'use client'

import { useState } from 'react'
import { Download, Upload, UserPlus } from 'lucide-react'
import { Button, Input, Select, Label, Alert } from '@/components/ui'
import Modal from '@/components/ui/Modal'
import { parsearCsv, normalizar } from '@/lib/csv'

const CAMPOS = ['nombre', 'apellido', 'email', 'telefono', 'documento', 'tipoPersona', 'empresa', 'direccion', 'ciudad'] as const
type Campo = (typeof CAMPOS)[number]
type FilaCliente = Record<Campo, string>

const VACIO: FilaCliente = {
  nombre: '', apellido: '', email: '', telefono: '', documento: '',
  tipoPersona: 'NATURAL', empresa: '', direccion: '', ciudad: '',
}

/* ---------- Crear un cliente ---------- */

export function NuevoClienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<FilaCliente>(VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (campo: Campo, valor: string) => setForm((p) => ({ ...p, [campo]: valor }))

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clientes/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo crear el cliente')
        return
      }
      onCreated()
      onClose()
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title="Nuevo cliente"
      icon={<UserPlus size={18} />}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-nuevo-cliente" loading={loading}>{loading ? 'Guardando...' : 'Crear cliente'}</Button>
        </>
      }
    >
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      <form id="form-nuevo-cliente" onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="font-semibold">Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
          </div>
          <div>
            <Label className="font-semibold">Apellido</Label>
            <Input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} />
          </div>
          <div>
            <Label className="font-semibold">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div>
            <Label className="font-semibold">Teléfono *</Label>
            <Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} required />
          </div>
          <div>
            <Label className="font-semibold">Documento *</Label>
            <Input value={form.documento} onChange={(e) => set('documento', e.target.value)} required />
          </div>
          <div>
            <Label className="font-semibold">Tipo de persona</Label>
            <Select value={form.tipoPersona} onChange={(e) => set('tipoPersona', e.target.value)}>
              <option value="NATURAL">Persona Natural</option>
              <option value="JURIDICA">Persona Jurídica</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="font-semibold">Empresa</Label>
            <Input value={form.empresa} onChange={(e) => set('empresa', e.target.value)} />
          </div>
          <div>
            <Label className="font-semibold">Dirección</Label>
            <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
          <div>
            <Label className="font-semibold">Ciudad</Label>
            <Input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- Carga masiva (CSV) ---------- */

const ALIAS: Record<string, Campo> = {
  nombre: 'nombre', nombres: 'nombre', apellido: 'apellido', apellidos: 'apellido',
  email: 'email', correo: 'email', correoelectronico: 'email',
  telefono: 'telefono', celular: 'telefono', documento: 'documento', cedula: 'documento', identificacion: 'documento',
  tipopersona: 'tipoPersona', tipo: 'tipoPersona', empresa: 'empresa', direccion: 'direccion', ciudad: 'ciudad',
}

function filasDesdeCsv(texto: string): { filas: FilaCliente[]; faltantes: string[] } {
  const [encabezado, ...datos] = parsearCsv(texto)
  if (!encabezado) return { filas: [], faltantes: ['nombre', 'email', 'telefono', 'documento'] }
  const idx = new Map<Campo, number>()
  encabezado.forEach((h, i) => {
    const campo = ALIAS[normalizar(h)]
    if (campo && !idx.has(campo)) idx.set(campo, i)
  })
  const faltantes = (['nombre', 'email', 'telefono', 'documento'] as Campo[]).filter((c) => !idx.has(c))
  const filas = datos.map((d) => {
    const f = { ...VACIO }
    idx.forEach((i, campo) => { f[campo] = (d[i] || '').trim() })
    f.tipoPersona = normalizar(f.tipoPersona).startsWith('jur') ? 'JURIDICA' : 'NATURAL'
    return f
  })
  return { filas, faltantes }
}

interface ResultadoMasivo {
  total: number
  creados: number
  errores: { fila: number; email?: string; error: string }[]
}

export function CargaMasivaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [filas, setFilas] = useState<FilaCliente[]>([])
  const [archivo, setArchivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoMasivo | null>(null)

  const descargarPlantilla = () => {
    const csv = '﻿' + CAMPOS.join(',') + '\nJuan,Pérez,juan@ejemplo.com,3001234567,1020304050,NATURAL,,Calle 1 # 2-3,Bogotá\n'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-clientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const leerArchivo = async (file?: File) => {
    setError(null)
    setResultado(null)
    setFilas([])
    if (!file) return
    setArchivo(file.name)
    const { filas: leidas, faltantes } = filasDesdeCsv(await file.text())
    if (faltantes.length) return setError(`Faltan columnas obligatorias: ${faltantes.join(', ')}`)
    if (leidas.length === 0) return setError('El archivo no tiene filas de datos')
    if (leidas.length > 1000) return setError('Máximo 1000 clientes por carga')
    setFilas(leidas)
  }

  const importar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clientes/masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes: filas }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'No se pudo completar la carga')
      setResultado(data)
      if (data.creados > 0) onCreated()
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      size="xl"
      title="Carga masiva de clientes"
      icon={<Upload size={18} />}
      footer={
        resultado ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={importar} loading={loading} disabled={filas.length === 0}>
              {loading ? 'Importando...' : `Importar ${filas.length || ''} cliente${filas.length === 1 ? '' : 's'}`}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <p className="mb-0 text-sm text-slate-600">
          Suba un archivo <strong>CSV</strong> (en Excel: Guardar como → CSV). Columnas obligatorias:{' '}
          <code>nombre, email, telefono, documento</code>. Opcionales: <code>apellido, tipoPersona, empresa, direccion, ciudad</code>.
          Los clientes con email o documento ya existentes se omiten y se informan.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={descargarPlantilla}>
            <Download size={14} /> Descargar plantilla
          </Button>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => leerArchivo(e.target.files?.[0])}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {resultado ? (
          <div className="space-y-3">
            <Alert variant={resultado.errores.length ? 'warning' : 'success'}>
              {resultado.creados} de {resultado.total} clientes creados
              {resultado.errores.length > 0 && ` · ${resultado.errores.length} con error`}
            </Alert>
            {resultado.errores.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left uppercase text-slate-500">
                    <tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Motivo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultado.errores.map((er) => (
                      <tr key={er.fila}>
                        <td className="px-3 py-2">{er.fila}</td>
                        <td className="px-3 py-2">{er.email}</td>
                        <td className="px-3 py-2 text-red-600">{er.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          filas.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-slate-500">{archivo} · {filas.length} filas. Vista previa de las primeras 5:</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left uppercase text-slate-500">
                    <tr>{['Nombre', 'Apellido', 'Email', 'Teléfono', 'Documento', 'Tipo'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filas.slice(0, 5).map((f, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{f.nombre}</td><td className="px-3 py-2">{f.apellido}</td>
                        <td className="px-3 py-2">{f.email}</td><td className="px-3 py-2">{f.telefono}</td>
                        <td className="px-3 py-2">{f.documento}</td><td className="px-3 py-2">{f.tipoPersona}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </Modal>
  )
}
