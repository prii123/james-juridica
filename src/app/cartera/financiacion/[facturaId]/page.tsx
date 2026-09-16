'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import EnviarFacturaModal from '@/components/EnviarFacturaModal'
import {
  ArrowLeft,
  Calculator,
  Download,
  Send
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, Alert, Spinner } from '@/components/ui'

interface Factura {
  id: string
  numero: string
  total: number
  saldoPendiente: number
  numeroCuotas?: number
  valorCuota?: number
  tasaInteres?: number
  cliente: {
    nombre: string
    apellido?: string
    email?: string
    telefono?: string
  }
  caso: {
    numeroCaso: string
  }
}

interface CuotaAmortizacion {
  numero: number
  fechaVencimiento: string
  valorCuota: number
  capital: number
  interes: number
  saldo: number
}

export default function FinanciacionPage() {
  const params = useParams()
  const facturaId = params.facturaId as string

  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [error, setError] = useState('')

  const [formData] = useState({
    numeroCuotas: 6,
    tasaInteres: 2.5, // 2.5% mensual
    fechaInicio: new Date().toISOString().split('T')[0]
  })

  const [tablaCuotas, setTablaCuotas] = useState<CuotaAmortizacion[]>([])

  useEffect(() => {
    if (facturaId) {
      fetchFactura()
    }
  }, [facturaId])

  useEffect(() => {
    if (factura) {
      calcularCuotas()
    }
  }, [formData, factura])

  const fetchFactura = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/facturacion/${facturaId}`)

      if (!response.ok) {
        throw new Error('No se pudo cargar la factura')
      }

      const data = await response.json()

      // Calcular saldo pendiente basado en pagos
      const totalPagos = data.pagos?.reduce((sum: number, pago: any) => sum + Number(pago.valor), 0) || 0
      const saldoPendiente = Number(data.total) - totalPagos

      const facturaData: Factura = {
        id: data.id,
        numero: data.numero,
        total: Number(data.total),
        saldoPendiente: Math.max(0, saldoPendiente),
        numeroCuotas: data.numeroCuotas,
        valorCuota: data.valorCuota ? Number(data.valorCuota) : undefined,
        tasaInteres: data.tasaInteres ? Number(data.tasaInteres) : undefined,
        cliente: {
          nombre: data.honorario?.caso?.cliente?.nombre ?? data.cliente?.nombre ?? data.clienteNombre ?? '',
          apellido: data.honorario?.caso?.cliente?.apellido ?? data.cliente?.apellido ?? '',
          email: data.honorario?.caso?.cliente?.email ?? data.cliente?.email ?? '',
          telefono: data.honorario?.caso?.cliente?.telefono ?? data.cliente?.telefono ?? ''
        },
        caso: {
          numeroCaso: data.honorario?.caso?.numeroCaso ?? 'N/A'
        }
      }

      setFactura(facturaData)
    } catch (error) {
      setError('Error al cargar la factura')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularCuotas = () => {
    if (!factura) return

    const monto = factura.saldoPendiente
    const cuotas = formData.numeroCuotas
    const tasaMensual = formData.tasaInteres / 100

    // Sistema francés de amortización
    let valorCuota = 0
    if (tasaMensual > 0) {
      const factor = Math.pow(1 + tasaMensual, cuotas)
      valorCuota = (monto * tasaMensual * factor) / (factor - 1)
    } else {
      valorCuota = monto / cuotas
    }

    const tabla: CuotaAmortizacion[] = []
    let saldoPendiente = monto
    const fechaInicio = new Date(formData.fechaInicio)

    for (let i = 1; i <= cuotas; i++) {
      const interes = saldoPendiente * tasaMensual
      const capital = valorCuota - interes
      saldoPendiente = saldoPendiente - capital

      if (i === cuotas) {
        saldoPendiente = 0
      }

      const fechaVencimiento = new Date(fechaInicio)
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

      tabla.push({
        numero: i,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        valorCuota: Math.round(valorCuota),
        capital: Math.round(i === cuotas ? capital + saldoPendiente : capital),
        interes: Math.round(interes),
        saldo: Math.round(Math.max(0, saldoPendiente))
      })
    }

    setTablaCuotas(tabla)
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true)
      const response = await fetch(`/api/cartera/financiacion/${facturaId}/pdf`)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Error al descargar el PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financiacion-${factura?.numero || facturaId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(error.message || 'Error al descargar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const totalIntereses = tablaCuotas.reduce((sum, cuota) => sum + cuota.interes, 0)
  const totalPagar = tablaCuotas.reduce((sum, cuota) => sum + cuota.valorCuota, 0)

  if (loading) {
    return <Spinner />
  }

  if (!factura) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">Factura no encontrada</Alert>
        <Link href="/cartera"><Button>Volver a Cartera</Button></Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Cartera', href: '/cartera' },
          { label: 'Financiación' }
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/cartera">
          <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="mb-1 text-xl font-bold text-slate-800">
            {factura?.numeroCuotas && factura.numeroCuotas > 1
              ? 'Modificar Financiación'
              : 'Configurar Financiación'}
          </h1>
          <p className="mb-0 text-slate-500">
            {factura.numero} - {factura.cliente.nombre} {factura.cliente.apellido}
            {factura?.numeroCuotas && factura.numeroCuotas > 1 && (
              <span className="ml-2 text-sky-700">(Ya financiada)</span>
            )}
          </p>
        </div>
        {tablaCuotas.length > 0 && (
          <Button variant="outlinePrimary" onClick={handleDownloadPDF} loading={downloadingPdf}>
            {!downloadingPdf && <Download size={16} />}
            {downloadingPdf ? 'Descargando...' : 'Descargar PDF'}
          </Button>
        )}
        {tablaCuotas.length > 0 && (
          <Button variant="success" onClick={() => setShowSendModal(true)}>
            <Send size={16} />
            Enviar
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          {/* Información de la Factura */}
          <Card>
            <CardHeader><CardTitle>Información de la Factura</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-3 text-center">
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(factura.saldoPendiente)}</div>
                <div className="text-slate-500">Saldo a Financiar</div>
              </div>
              <hr className="mb-3 border-slate-200" />
              <div className="text-sm">
                <div><strong>Factura:</strong> {factura.numero}</div>
                <div><strong>Cliente:</strong> {factura.cliente.nombre} {factura.cliente.apellido}</div>
                <div><strong>Caso:</strong> {factura.caso.numeroCaso}</div>
                <div><strong>Total Original:</strong> {formatCurrency(factura.total)}</div>
                {factura.numeroCuotas && factura.numeroCuotas > 1 && (
                  <>
                    <hr className="my-3 border-slate-200" />
                    <div className="text-sky-700">
                      <div><strong>🛈 Configuración Actual:</strong></div>
                      <div>• {factura.numeroCuotas} cuotas</div>
                      <div>• {factura.tasaInteres || 0}% interés mensual</div>
                      {factura.valorCuota && (
                        <div>• {formatCurrency(factura.valorCuota)} por cuota</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Resumen */}
          {tablaCuotas.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
              <CardBody>
                <div className="mb-2 flex justify-between">
                  <span>Capital:</span>
                  <span>{formatCurrency(factura.saldoPendiente)}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span>Intereses:</span>
                  <span className="text-amber-600">{formatCurrency(totalIntereses)}</span>
                </div>
                <hr className="my-3 border-slate-200" />
                <div className="flex justify-between">
                  <span className="font-bold">Total a Pagar:</span>
                  <span className="font-bold text-teal-700">{formatCurrency(totalPagar)}</span>
                </div>
                <div className="mt-2 text-center">
                  <small className="text-slate-500">
                    {formData.numeroCuotas} cuotas de ~{formatCurrency(tablaCuotas[0]?.valorCuota || 0)}
                  </small>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8">
          {/* Tabla de Amortización */}
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Amortización</CardTitle>
              <small className="text-slate-500">Sistema Francés</small>
            </CardHeader>
            <CardBody>
              {tablaCuotas.length === 0 ? (
                <div className="py-5 text-center">
                  <Calculator size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">Configure los parámetros para ver la tabla de amortización</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Cuota</th>
                        <th className="px-3 py-2 font-semibold">Fecha Venc.</th>
                        <th className="px-3 py-2 font-semibold">Valor Cuota</th>
                        <th className="px-3 py-2 font-semibold">Capital</th>
                        <th className="px-3 py-2 font-semibold">Interés</th>
                        <th className="px-3 py-2 font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tablaCuotas.map((cuota) => (
                        <tr key={cuota.numero}>
                          <td className="px-3 py-2 align-middle"><Badge variant="primary">{cuota.numero}</Badge></td>
                          <td className="px-3 py-2 align-middle"><small>{new Date(cuota.fechaVencimiento).toLocaleDateString()}</small></td>
                          <td className="px-3 py-2 align-middle"><strong>{formatCurrency(cuota.valorCuota)}</strong></td>
                          <td className="px-3 py-2 align-middle"><span className="text-teal-700">{formatCurrency(cuota.capital)}</span></td>
                          <td className="px-3 py-2 align-middle"><span className="text-amber-600">{formatCurrency(cuota.interes)}</span></td>
                          <td className="px-3 py-2 align-middle"><span className="text-slate-500">{formatCurrency(cuota.saldo)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left" colSpan={2}>TOTALES:</th>
                        <th className="px-3 py-2 text-left">{formatCurrency(totalPagar)}</th>
                        <th className="px-3 py-2 text-left text-teal-700">{formatCurrency(factura.saldoPendiente)}</th>
                        <th className="px-3 py-2 text-left text-amber-600">{formatCurrency(totalIntereses)}</th>
                        <th className="px-3 py-2 text-left">-</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {showSendModal && factura && (
        <EnviarFacturaModal
          facturaId={factura.id}
          tipo="financiacion"
          clienteNombre={`${factura.cliente.nombre} ${factura.cliente.apellido || ''}`}
          email={factura.cliente.email || ''}
          telefono={factura.cliente.telefono || ''}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
