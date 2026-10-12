'use client'

import { useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Alert } from '@/components/ui'
import { parsearCsv, normalizar, descargarCsv } from '@/lib/csv'

const CAMPOS = ['numeroFactura', 'valor', 'fecha', 'metodoPago', 'referencia', 'observaciones'] as const
type Campo = (typeof CAMPOS)[number]
type Fila = Record<Campo, string>

const ALIAS: Record<string, Campo> = {
  numerofactura: 'numeroFactura', factura: 'numeroFactura', numero: 'numeroFactura',
  valor: 'valor', monto: 'valor', pago: 'valor', valorpagado: 'valor',
  fecha: 'fecha', fechapago: 'fecha',
  metodopago: 'metodoPago', metodo: 'metodoPago',
  referencia: 'referencia', observaciones: 'observaciones',
}

function filasDesdeCsv(texto: string): { filas: Fila[]; faltantes: string[] } {
  const [encabezado, ...datos] = parsearCsv(texto)
  if (!encabezado) return { filas: [], faltantes: ['numeroFactura', 'valor'] }
  const idx = new Map<Campo, number>()
  encabezado.forEach((h, i) => {
    const campo = ALIAS[normalizar(h)]
    if (campo && !idx.has(campo)) idx.set(campo, i)
  })
  const faltantes = (['numeroFactura', 'valor'] as Campo[]).filter((c) => !idx.has(c))
  const filas = datos.map((d) => {
    const f = Object.fromEntries(CAMPOS.map((c) => [c, ''])) as Fila
    idx.forEach((i, campo) => { f[campo] = (d[i] || '').trim() })
    return f
  })
  return { filas, faltantes }
}

interface Resultado {
  total: number
  aplicados: number
  totalAplicado: number
  errores: { fila: number; numeroFactura?: string; error: string }[]
}

const PLANTILLA =
  CAMPOS.join(',') + '\n' +
  'FACT-2026-0001,500000,2026-10-12,TRANSFERENCIA,REF-123,Abono de octubre\n' +
  'FACT-2026-0002,250000,,EFECTIVO,,\n'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

export default function PagosMasivosPage() {
  const [filas, setFilas] = useState<Fila[]>([])
  const [archivo, setArchivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const leerArchivo = async (file?: File) => {
    setError(null)
    setResultado(null)
    setFilas([])
    if (!file) return
    setArchivo(file.name)
    const { filas: leidas, faltantes } = filasDesdeCsv(await file.text())
    if (faltantes.length) return setError(`Faltan columnas obligatorias: ${faltantes.join(', ')}`)
    if (leidas.length === 0) return setError('El archivo no tiene filas de datos')
    if (leidas.length > 1000) return setError('Máximo 1000 pagos por carga')
    setFilas(leidas)
  }

  const importar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cartera/pagos-masivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagos: filas }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'No se pudo completar la carga')
      setResultado(data)
      setFilas([])
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Cartera Financiada', href: '/cartera' }, { label: 'Pagos masivos' }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/cartera">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Pagos masivos</h1>
          <p className="mb-0 text-slate-500">Registra varios pagos desde un CSV; se abonan solos a las cuotas de cada factura.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader><CardTitle>Archivo</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => descargarCsv('plantilla-pagos.csv', PLANTILLA)}>
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

              {filas.length > 0 && (
                <>
                  <p className="mb-0 text-xs text-slate-500">{archivo} · {filas.length} pagos. Vista previa de los primeros 8:</p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left uppercase text-slate-500">
                        <tr>{['Factura', 'Valor', 'Fecha', 'Método', 'Referencia'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filas.slice(0, 8).map((f, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{f.numeroFactura}</td>
                            <td className="px-3 py-2">{f.valor}</td>
                            <td className="px-3 py-2">{f.fecha}</td>
                            <td className="px-3 py-2">{f.metodoPago}</td>
                            <td className="px-3 py-2">{f.referencia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={importar} loading={loading}>
                    <Upload size={16} /> {loading ? 'Aplicando...' : `Aplicar ${filas.length} pago${filas.length === 1 ? '' : 's'}`}
                  </Button>
                </>
              )}

              {resultado && (
                <div className="space-y-3">
                  <Alert variant={resultado.errores.length ? 'warning' : 'success'}>
                    {resultado.aplicados} de {resultado.total} pagos aplicados ({formatCurrency(resultado.totalAplicado)})
                    {resultado.errores.length > 0 && ` · ${resultado.errores.length} con error`}
                  </Alert>
                  {resultado.errores.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-left uppercase text-slate-500">
                          <tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Factura</th><th className="px-3 py-2">Motivo</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {resultado.errores.map((er, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{er.fila}</td>
                              <td className="px-3 py-2">{er.numeroFactura}</td>
                              <td className="px-3 py-2 text-red-600">{er.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader><CardTitle>Columnas</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm text-slate-600">
              <p className="mb-0"><strong>Obligatorias:</strong> <code>numeroFactura</code> (ej. FACT-2026-0001) y <code>valor</code>.</p>
              <p className="mb-0"><strong>Opcionales:</strong> <code>fecha</code> (hoy; AAAA-MM-DD o DD/MM/AAAA), <code>metodoPago</code> (TRANSFERENCIA por defecto), <code>referencia</code> y <code>observaciones</code>.</p>
              <p className="mb-0"><strong>Aplicación automática:</strong> cada pago se abona primero a las cuotas vencidas y luego por fecha de vencimiento. Un pago no puede superar el saldo de la factura. Si hay varios pagos de la misma factura, se aplican en el orden del archivo.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
