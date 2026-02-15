'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Edit3, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Calendar,
  User,
  DollarSign,
  Printer
} from 'lucide-react'

interface Factura {
  id: string
  numero: string
  fecha: string
  fechaVencimiento: string
  subtotal: number
  impuestos: number
  total: number
  estado: 'GENERADA' | 'ENVIADA' | 'PAGADA' | 'VENCIDA' | 'ANULADA'
  observaciones?: string
  ivaActivado?: boolean
  honorario: {
    id: string
    tipo: string
    valor: number
    caso: {
      id: string
      numeroCaso: string
      cliente: {
        id: string
        nombre: string
        apellido?: string
        email: string
        telefono: string
        documento: string
      }
    }
  }
  creadoPor: {
    id: string
    nombre: string
    apellido: string
  }
  items: {
    id: string
    descripcion: string
    cantidad: number
    valorUnitario: number
    valorTotal: number
  }[]
  pagos: {
    id: string
    fecha: string
    valor: number
    metodo: string
    referencia?: string
  }[]
  createdAt: string
  updatedAt: string
}

const ESTADO_CONFIG = {
  GENERADA: {
    color: 'warning',
    icon: Clock,
    label: 'Generada'
  },
  ENVIADA: {
    color: 'info',
    icon: Send,
    label: 'Enviada'
  },
  PAGADA: {
    color: 'success',
    icon: CheckCircle,
    label: 'Pagada'
  },
  VENCIDA: {
    color: 'danger',
    icon: AlertTriangle,
    label: 'Vencida'
  },
  ANULADA: {
    color: 'secondary',
    icon: XCircle,
    label: 'Anulada'
  }
}

export default function FacturaDetailPage({ params }: { params: { facturaId: string } }) {
  const router = useRouter()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchFactura()
  }, [])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setFactura(data)
      } else {
        setError('No se pudo cargar la factura')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!factura) return
    
    const confirmMessage = {
      'ENVIADA': '¿Marcar esta factura como enviada?',
      'PAGADA': '¿Marcar esta factura como pagada?',
      'VENCIDA': '¿Marcar esta factura como vencida?',
      'ANULADA': '¿Estás seguro de que quieres anular esta factura? Esta acción no se puede deshacer.'
    }[nuevoEstado]

    if (!confirm(confirmMessage)) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/facturacion/${params.facturaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        await fetchFactura() // Recargar datos
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDue = (fechaVencimiento: string) => {
    const today = new Date()
    const dueDate = new Date(fechaVencimiento)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error || !factura) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Factura no encontrada'}
        </div>
        <Link href="/facturacion" className="btn btn-primary">
          Volver a Facturación
        </Link>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[factura.estado]
  const IconoEstado = estadoConfig.icon
  const diasVencimiento = getDaysUntilDue(factura.fechaVencimiento)

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Facturación', href: '/facturacion' },
          { label: factura.numero }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/facturacion" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0">{factura.numero}</h1>
            <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1`}>
              <IconoEstado size={12} />
              {estadoConfig.label}
            </span>
            {diasVencimiento < 0 && (
              <span className="badge bg-danger">
                Vencida ({Math.abs(diasVencimiento)} días)
              </span>
            )}
            {diasVencimiento >= 0 && diasVencimiento <= 7 && factura.estado !== 'PAGADA' && (
              <span className="badge bg-warning">
                Vence en {diasVencimiento} días
              </span>
            )}
          </div>
          <p className="text-secondary mb-0">
            {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido} - {factura.honorario.caso.numeroCaso}
          </p>
        </div>
        <div className="d-flex gap-2">
          {factura.estado === 'GENERADA' && (
            <Link 
              href={`/facturacion/${params.facturaId}/editar`}
              className="btn btn-outline-primary d-flex align-items-center gap-2"
            >
              <Edit3 size={16} />
              Editar
            </Link>
          )}
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <Printer size={16} />
            Imprimir
          </button>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2">
            <Download size={16} />
            Descargar PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* Información de la Factura */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Detalles de la Factura</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Información General</h6>
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Calendar size={16} />
                      <span className="fw-semibold">Fecha de Emisión:</span>
                      <span>{formatDate(factura.fecha)}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Calendar size={16} />
                      <span className="fw-semibold">Fecha de Vencimiento:</span>
                      <span>{formatDate(factura.fechaVencimiento)}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <User size={16} />
                      <span className="fw-semibold">Creada por:</span>
                      <span>{factura.creadoPor.nombre} {factura.creadoPor.apellido}</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Totales</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(factura.subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>IVA (19%):</span>
                      <span className={!factura.ivaActivado ? 'text-muted' : ''}>
                        {factura.ivaActivado ? formatCurrency(factura.impuestos) : 'Exento'}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold h5">Total:</span>
                      <span className="fw-bold h4 text-success">{formatCurrency(factura.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {factura.observaciones && (
                <div className="mt-3">
                  <h6 className="text-muted mb-2">Observaciones</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{factura.observaciones}</p>
                  </div>
                </div>
              )}
              
              {/* Estado del IVA */}
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">Estado del IVA:</span>
                  <span className={`badge ${factura.ivaActivado ? 'bg-success' : 'bg-secondary'}`}>
                    {factura.ivaActivado ? 'IVA Aplicado (19%)' : 'Exento de IVA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items de la Factura */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Items Facturados</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Valor Unitario</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factura.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.descripcion}</td>
                        <td>{item.cantidad}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>{formatCurrency(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagos Registrados */}
          {factura.pagos.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Pagos Registrados</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Valor</th>
                        <th>Método</th>
                        <th>Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factura.pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td>{formatDate(pago.fecha)}</td>
                          <td>{formatCurrency(pago.valor)}</td>
                          <td>{pago.metodo}</td>
                          <td>{pago.referencia || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {/* Información del Cliente */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información del Cliente</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-2">
                <User size={16} />
                <span className="fw-semibold">
                  {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}
                </span>
              </div>
              <div className="small text-muted mb-1">
                <div><strong>Email:</strong> {factura.honorario.caso.cliente.email}</div>
                <div><strong>Teléfono:</strong> {factura.honorario.caso.cliente.telefono}</div>
                <div><strong>Documento:</strong> {factura.honorario.caso.cliente.documento}</div>
              </div>
              <div className="mt-3">
                <span className="badge bg-light text-dark">
                  Caso: {factura.honorario.caso.numeroCaso}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {factura.estado === 'GENERADA' && (
                  <button
                    onClick={() => handleEstadoChange('ENVIADA')}
                    className="btn btn-info d-flex align-items-center justify-content-center gap-2"
                    disabled={updating}
                  >
                    <Send size={16} />
                    Marcar como Enviada
                  </button>
                )}
                
                {factura.estado === 'ENVIADA' && (
                  <button
                    onClick={() => handleEstadoChange('PAGADA')}
                    className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                    disabled={updating}
                  >
                    <CheckCircle size={16} />
                    Marcar como Pagada
                  </button>
                )}
                
                {factura.estado !== 'PAGADA' && factura.estado !== 'ANULADA' && (
                  <button
                    onClick={() => handleEstadoChange('ANULADA')}
                    className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                    disabled={updating}
                  >
                    <XCircle size={16} />
                    Anular Factura
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Timeline</h5>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker bg-primary"></div>
                  <div className="timeline-content">
                    <h6 className="mb-1">Factura Generada</h6>
                    <small className="text-muted">
                      {formatDate(factura.createdAt)}
                    </small>
                  </div>
                </div>
                
                {factura.estado !== 'GENERADA' && (
                  <div className="timeline-item">
                    <div className={`timeline-marker bg-${estadoConfig.color}`}></div>
                    <div className="timeline-content">
                      <h6 className="mb-1">{estadoConfig.label}</h6>
                      <small className="text-muted">
                        {formatDate(factura.updatedAt)}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 2rem;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e9ecef;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .timeline-marker {
          position: absolute;
          left: -2rem;
          top: 0.25rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        .timeline-content {
          margin-left: 0.5rem;
        }
      `}</style>
    </>
  )
}