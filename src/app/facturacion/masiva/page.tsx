'use client'

import { useState } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Alert } from '@/components/ui'
import { parsearCsv, normalizar, descargarCsv } from '@/lib/csv'

const CAMPOS = [
  'factura', 'clienteDocumento', 'clienteEmail', 'producto', 'cantidad', 'valorUnitario',
  'fecha', 'fechaVencimiento', 'modalidadPago', 'numeroCuotas', 'tasaInteres', 'iva', 'observaciones',
] as const
type Campo = (typeof CAMPOS)[number]
type Fila = Record<Campo, string>

const ALIAS: Record<string, Campo> = {
  factura: 'factura', grupo: 'factura', referencia: 'factura',
  clientedocumento: 'clienteDocumento', documento: 'clienteDocumento', cedula: 'clienteDocumento', documentocliente: 'clienteDocumento',
  clienteemail: 'clienteEmail', email: 'clienteEmail', correo: 'clienteEmail', emailcliente: 'clienteEmail',
  producto: 'producto', servicio: 'producto', productoservicio: 'producto', productooservicio: 'producto',
  cantidad: 'cantidad', valorunitario: 'valorUnitario', precio: 'valorUnitario',
  fecha: 'fecha', fechafactura: 'fecha', fechacreacion: 'fecha', fechadecreacion: 'fecha',
  fechavencimiento: 'fechaVencimiento', vencimiento: 'fechaVencimiento',
  modalidadpago: 'modalidadPago', modalidad: 'modalidadPago',
  numerocuotas: 'numeroCuotas', cuotas: 'numeroCuotas', tasainteres: 'tasaInteres', tasa: 'tasaInteres',
  iva: 'iva', observaciones: 'observaciones',
}

const vacia = (): Fila => Object.fromEntries(CAMPOS.map((c) => [c, ''])) as Fila

function filasDesdeCsv(texto: string): { filas: Fila[]; faltantes: string[] } {
  const [encabezado, ...datos] = parsearCsv(texto)
  if (!encabezado) return { filas: [], faltantes: ['clienteDocumento o clienteEmail', 'producto'] }
  const idx = new Map<Campo, number>()
  encabezado.forEach((h, i) => {
    const campo = ALIAS[normalizar(h)]
    if (campo && !idx.has(campo)) idx.set(campo, i)
  })
  const faltantes: string[] = []
  if (!idx.has('clienteDocumento') && !idx.has('clienteEmail')) faltantes.push('clienteDocumento (o clienteEmail)')
  if (!idx.has('producto')) faltantes.push('producto')
  const filas = datos.map((d) => {
    const f = vacia()
    idx.forEach((i, campo) => { f[campo] = (d[i] || '').trim() })
    return f
  })
  return { filas, faltantes }
}

interface Resultado {
  total: number
  creadas: number
  numeros: string[]
  errores: { fila: number; error: string }[]
}

const PLANTILLA =
  CAMPOS.join(',') + '\n' +
  // Factura de contado con un item.
  ',1020304050,,Asesoría jurídica,1,,2026-10-12,2026-11-30,CONTADO,,,NO,' + '\n' +
  // Factura a crédito con dos items (comparten "A-1"), en 6 cuotas al 1.5% mensual.
  'A-1,1020304050,,Servicio de insolvencia,1,3000000,2026-10-12,2026-12-15,CREDITO,6,1.5,NO,Plan de pagos' + '\n' +
  'A-1,,,Radicación,2,200000,,,,,,,' + '\n'

export default function FacturacionMasivaPage() {
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
    if (leidas.length > 500) return setError('Máximo 500 filas por carga')
    setFilas(leidas)
  }

  const importar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/facturacion/masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturas: filas }),
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
      <Breadcrumb items={[{ label: 'Facturación', href: '/facturacion' }, { label: 'Carga masiva' }]} />

      <div className="mb-4 flex items-center gap-3">
        <Link href="/facturacion">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-800">Carga masiva de facturas</h1>
          <p className="mb-0 text-slate-500">Crea varias facturas a la vez desde un archivo CSV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader><CardTitle>Archivo</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => descargarCsv('plantilla-facturas.csv', PLANTILLA)}>
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
                  <p className="mb-0 text-xs text-slate-500">{archivo} · {filas.length} filas. Vista previa de las primeras 8:</p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left uppercase text-slate-500">
                        <tr>
                          {['Factura', 'Cliente', 'Producto', 'Cant.', 'Modalidad', 'Cuotas'].map((h) => (
                            <th key={h} className="px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filas.slice(0, 8).map((f, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{f.factura}</td>
                            <td className="px-3 py-2">{f.clienteDocumento || f.clienteEmail}</td>
                            <td className="px-3 py-2">{f.producto}</td>
                            <td className="px-3 py-2">{f.cantidad}</td>
                            <td className="px-3 py-2">{f.modalidadPago}</td>
                            <td className="px-3 py-2">{f.numeroCuotas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={importar} loading={loading}>
                    <Upload size={16} /> {loading ? 'Importando...' : `Importar ${filas.length} fila${filas.length === 1 ? '' : 's'}`}
                  </Button>
                </>
              )}

              {resultado && (
                <div className="space-y-3">
                  <Alert variant={resultado.errores.length ? 'warning' : 'success'}>
                    {resultado.creadas} de {resultado.total} facturas creadas
                    {resultado.errores.length > 0 && ` · ${resultado.errores.length} con error`}
                  </Alert>
                  {resultado.errores.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-left uppercase text-slate-500">
                          <tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Motivo</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {resultado.errores.map((er, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{er.fila}</td>
                              <td className="px-3 py-2 text-red-600">{er.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Link href="/facturacion"><Button variant="outline">Ver facturas</Button></Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader><CardTitle>Columnas</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm text-slate-600">
              <p className="mb-0"><strong>Obligatorias:</strong> <code>clienteDocumento</code> (o <code>clienteEmail</code>) y <code>producto</code>. El cliente y el producto o servicio deben existir antes.</p>
              <p className="mb-0"><strong>Opcionales:</strong> <code>cantidad</code> (1), <code>valorUnitario</code> (precio del catálogo), <code>fecha</code> de creación (hoy) y <code>fechaVencimiento</code> (30 días después de la creación); formato AAAA-MM-DD o DD/MM/AAAA, <code>iva</code> (SI/NO, por defecto NO), <code>observaciones</code>.</p>
              <p className="mb-0"><strong>Crédito:</strong> <code>modalidadPago</code> = CREDITO con <code>numeroCuotas</code> (2 a 60) y, si aplica, <code>tasaInteres</code> (% mensual, 0 por defecto). Los pagos se cargan después desde Cartera → Pagos masivos.</p>
              <p className="mb-0"><strong>Varios items en una factura:</strong> repite el mismo valor en <code>factura</code>; los datos generales se toman de la primera fila del grupo. Sin ese valor, cada fila es una factura.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
