'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar
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
  modalidadPago: 'CONTADO' | 'FINANCIADO' // Backend enum correcto
  observaciones?: string
  honorario: {
    id: string
    tipo: string
    caso: {
      id: string
      numeroCaso: string
      cliente: {
        id: string
        nombre: string
        apellido?: string
        email: string
      }
    }
  }
  creadoPor: {
    id: string
    nombre: string
    apellido: string
  }
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

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')

  useEffect(() => {
    fetchFacturas()
  }, [search, estadoFilter])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (estadoFilter) params.append('estado', estadoFilter)
      
      const response = await fetch(`/api/facturacion?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFacturas(data.facturas || [])
      } else {
        setError('No se pudieron cargar las facturas')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleEstadoChange = async (facturaId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/facturacion/${facturaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        await fetchFacturas() // Recargar lista
      } else {
        setError('No se pudo actualizar el estado')
      }
    } catch (error) {
      setError('Error de conexión')
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
    return new Date(dateString).toLocaleDateString('es-CO')
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

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Facturación' }
        ]} 
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Facturación</h1>
          <p className="text-secondary mb-0">
            Gestión de facturas y pagos del sistema jurídico
          </p>
        </div>
        <Link href="/facturacion/nueva" className="btn btn-primary d-flex align-items-center gap-2">
          <Plus size={16} />
          Nueva Factura
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por número, cliente o caso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="GENERADA">Generada</option>
                <option value="ENVIADA">Enviada</option>
                <option value="PAGADA">Pagada</option>
                <option value="VENCIDA">Vencida</option>
                <option value="ANULADA">Anulada</option>
              </select>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('')
                  setEstadoFilter('')
                }}
              >
                <Filter size={16} className="me-1" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Facturas ({facturas.length})</h5>
        </div>
        <div className="card-body">
          {facturas.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No hay facturas</h5>
              <p className="text-muted mb-4">Aún no se han generado facturas en el sistema</p>
              <Link href="/facturacion/nueva" className="btn btn-primary">
                <Plus size={16} className="me-2" />
                Crear Primera Factura
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Caso</th>
                    <th>Fecha Emisión</th>
                    <th>Modalidad Pago</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => {
                    const estadoConfig = ESTADO_CONFIG[factura.estado]
                    const IconoEstado = estadoConfig.icon
                    const diasVencimiento = getDaysUntilDue(factura.fechaVencimiento)
                    
                    return (
                      <tr key={factura.id}>
                        <td>
                          <div className="fw-semibold">{factura.numero}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {factura.honorario.caso.cliente.nombre} {factura.honorario.caso.cliente.apellido}
                          </div>
                          <div className="text-muted small">{factura.honorario.caso.cliente.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {factura.honorario.caso.numeroCaso}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 small">
                            <Calendar size={14} />
                            {formatDate(factura.fecha)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${factura.modalidadPago === 'CONTADO' ? 'bg-success' : 'bg-warning'}`}>
                            {factura.modalidadPago === 'CONTADO' ? 'Contado' : 'Financiado'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-success">
                            {formatCurrency(factura.total)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoConfig.color} d-flex align-items-center gap-1 w-fit`}>
                            <IconoEstado size={12} />
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link
                              href={`/facturacion/${factura.id}`}
                              className="btn btn-outline-primary btn-sm"
                              title="Ver detalles"
                            >
                              <Eye size={14} />
                            </Link>
                            {factura.estado === 'GENERADA' && (
                              <button
                                onClick={() => handleEstadoChange(factura.id, 'ENVIADA')}
                                className="btn btn-outline-info btn-sm"
                                title="Marcar como enviada"
                              >
                                <Send size={14} />
                              </button>
                            )}
                            {factura.estado === 'ENVIADA' && (
                              <button
                                onClick={() => handleEstadoChange(factura.id, 'PAGADA')}
                                className="btn btn-outline-success btn-sm"
                                title="Marcar como pagada"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .w-fit {
          width: fit-content !important;
        }
      `}</style>
    </>
  )
}