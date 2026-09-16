'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import EnviarFacturaModal from '@/components/EnviarFacturaModal'
import TimelineCuotas from './components/TimelineCuotas'
import ResumenCuotas from './components/ResumenCuotas'
import AplicarPago from './components/AplicarPago'
import HistorialPagos from './components/HistorialPagos'
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Download,
  Send
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CuotaSeguimiento {
  id: string
  numeroCuota: number
  valor: number
  capital: number
  interes: number
  saldo: number
  fechaVencimiento: string
  fechaPago?: string
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA'
  observaciones?: string
  valorPagado: number
  saldoCuota: number
  diasVencido: number
  pagosAplicados: Array<{
    id: string
    valorAplicado: number
    fechaAplicacion: string
    observaciones?: string
    pago: {
      id: string
      valor: number
      fecha: string
      metodoPago: string
      referencia?: string
      observaciones?: string
    }
  }>
}

interface FacturaSeguimiento {
  id: string
  numero: string
  fecha: string
  total: number
  modalidadPago: string
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

interface ResumenSeguimiento {
  totalPagado: number
  saldoPendiente: number
  cuotasPagadas: number
  cuotasVencidas: number
  cuotasParciales: number
  cuotasPendientes: number
  progresoPago: number
}

interface PagoHistorial {
  id: string
  valor: number
  fecha: string
  metodoPago: string
  referencia?: string
  observaciones?: string
  distribucion: Array<{
    cuotaNumero: number
    valorAplicado: number
    fechaAplicacion: string
  }>
}

export default function SeguimientoCuotasPage() {
  const params = useParams()
  const facturaId = params.facturaId as string

  const [factura, setFactura] = useState<FacturaSeguimiento | null>(null)
  const [cuotas, setCuotas] = useState<CuotaSeguimiento[]>([])
  const [resumen, setResumen] = useState<ResumenSeguimiento | null>(null)
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  useEffect(() => {
    if (facturaId) {
      fetchDatosSeguimiento()
    }
  }, [facturaId])

  const fetchDatosSeguimiento = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/cartera/cuotas/${facturaId}`)

      if (!response.ok) {
        throw new Error('No se pudo cargar el seguimiento de cuotas')
      }

      const data = await response.json()

      setFactura(data.factura)
      setCuotas(data.cuotas)
      setResumen(data.resumen)
      setHistorialPagos(data.historialPagos)

    } catch (error) {
      setError('Error al cargar el seguimiento de cuotas')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePagoAplicado = async () => {
    await fetchDatosSeguimiento()
    setMostrarFormularioPago(false)
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true)
      const response = await fetch(`/api/cartera/cuotas/${facturaId}/pdf`)
      if (!response.ok) throw new Error('Error al descargar el PDF')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seguimiento-cuotas-${factura?.numero || facturaId}.pdf`
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

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner />
        <p className="mt-3 text-slate-500">Cargando seguimiento de cuotas...</p>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="py-5 text-center">
        <Alert variant="danger" className="mb-4">Factura no encontrada o sin cuotas configuradas</Alert>
        <Link href="/cartera"><Button>Volver a Cartera</Button></Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Cartera', href: '/cartera' },
          { label: 'Seguimiento de Cuotas' }
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/cartera">
            <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="mb-1 text-xl font-bold text-slate-800">Seguimiento de Cuotas</h1>
            <p className="mb-0 text-slate-500">
              {factura.numero} - {factura.cliente.nombre} {factura.cliente.apellido}
              <span className="ml-2 text-slate-400">• Caso {factura.caso.numeroCaso}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="icon" onClick={fetchDatosSeguimiento} disabled={loading}>
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </Button>
          <Button variant="outlinePrimary" onClick={handleDownloadPDF} loading={downloadingPdf}>
            {!downloadingPdf && <Download size={16} />}
            {downloadingPdf ? 'Descargando...' : 'PDF'}
          </Button>
          <Button
            variant="outline"
            className="border-teal-700 text-teal-700 hover:bg-teal-50"
            onClick={() => setShowSendModal(true)}
          >
            <Send size={16} />
            Enviar
          </Button>
          <Button variant="success" onClick={() => setMostrarFormularioPago(true)}>
            <Plus size={16} />
            Registrar Pago
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Resumen General */}
      {resumen && (
        <ResumenCuotas
          resumen={resumen}
          factura={factura}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Timeline de Cuotas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader><CardTitle>Estado de Cuotas</CardTitle></CardHeader>
            <CardBody className="p-0">
              <TimelineCuotas
                cuotas={cuotas}
                formatCurrency={formatCurrency}
              />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          {/* Historial de Pagos */}
          <HistorialPagos
            pagos={historialPagos}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      {/* Modal para Aplicar Pago */}
      {mostrarFormularioPago && (
        <AplicarPago
          facturaId={facturaId}
          cuotas={cuotas}
          onPagoAplicado={handlePagoAplicado}
          onCancel={() => setMostrarFormularioPago(false)}
          formatCurrency={formatCurrency}
        />
      )}

      {showSendModal && factura && (
        <EnviarFacturaModal
          facturaId={factura.id}
          tipo="cuotas"
          clienteNombre={`${factura.cliente.nombre} ${factura.cliente.apellido || ''}`}
          email={factura.cliente.email || ''}
          telefono={factura.cliente.telefono || ''}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
