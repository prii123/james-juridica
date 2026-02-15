'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import TimelineCuotas from './components/TimelineCuotas'
import ResumenCuotas from './components/ResumenCuotas'
import AplicarPago from './components/AplicarPago'
import HistorialPagos from './components/HistorialPagos'
import { 
  ArrowLeft, 
  Calendar,
  DollarSign,
  FileText,
  Plus,
  RefreshCw
} from 'lucide-react'

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
  const router = useRouter()
  const facturaId = params.facturaId as string
  
  const [factura, setFactura] = useState<FacturaSeguimiento | null>(null)
  const [cuotas, setCuotas] = useState<CuotaSeguimiento[]>([])
  const [resumen, setResumen] = useState<ResumenSeguimiento | null>(null)
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false)

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
    // Recargar datos después de aplicar un pago
    await fetchDatosSeguimiento()
    setMostrarFormularioPago(false)
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
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando seguimiento de cuotas...</p>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">Factura no encontrada o sin cuotas configuradas</div>
        <Link href="/cartera" className="btn btn-primary">
          Volver a Cartera
        </Link>
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

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href="/cartera" className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 fw-bold text-dark mb-1">
              Seguimiento de Cuotas
            </h1>
            <p className="text-secondary mb-0">
              {factura.numero} - {factura.cliente.nombre} {factura.cliente.apellido}
              <span className="text-muted ms-2">• Caso {factura.caso.numeroCaso}</span>
            </p>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={fetchDatosSeguimiento}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button
            className="btn btn-success"
            onClick={() => setMostrarFormularioPago(true)}
          >
            <Plus size={16} className="me-1" />
            Registrar Pago
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Resumen General */}
      {resumen && (
        <ResumenCuotas 
          resumen={resumen} 
          factura={factura}
          formatCurrency={formatCurrency} 
        />
      )}

      {/* Timeline de Cuotas */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Estado de Cuotas</h5>
            </div>
            <div className="card-body p-0">
              <TimelineCuotas 
                cuotas={cuotas} 
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
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
    </>
  )
}