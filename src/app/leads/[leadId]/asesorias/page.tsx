'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Eye, 
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { EstadoAsesoria, TipoAsesoria, ModalidadAsesoria } from '@prisma/client'

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: Date
  duracion?: number | null
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string | null
  notas?: string | null
  valor?: number | null
  asesor: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  lead: {
    id: string
    nombre: string
  }
}

export default function LeadAsesoriasPage() {
  const params = useParams()
  const leadId = params.leadId as string
  
  const [asesorias, setAsesorias] = useState<Asesoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadName, setLeadName] = useState<string>('')

  useEffect(() => {
    if (leadId) {
      fetchAsesorias()
    }
  }, [leadId])

  const fetchAsesorias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${leadId}/asesorias`)
      if (response.ok) {
        const data = await response.json()
        setAsesorias(data.asesorias)
        setLeadName(data.leadName)
      } else {
        setError('Error al cargar las asesorías')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoIcon = (estado: EstadoAsesoria) => {
    switch (estado) {
      case 'PROGRAMADA': return <Clock size={16} className="text-warning" />
      case 'REALIZADA': return <CheckCircle size={16} className="text-success" />
      case 'CANCELADA': return <XCircle size={16} className="text-danger" />
      case 'REPROGRAMADA': return <AlertCircle size={16} className="text-info" />
      default: return <Clock size={16} className="text-secondary" />
    }
  }

  const getEstadoBadgeClass = (estado: EstadoAsesoria) => {
    switch (estado) {
      case 'PROGRAMADA': return 'badge bg-warning'
      case 'REALIZADA': return 'badge bg-success'
      case 'CANCELADA': return 'badge bg-danger'
      case 'REPROGRAMADA': return 'badge bg-info'
      default: return 'badge bg-secondary'
    }
  }

  const getTipoText = (tipo: TipoAsesoria) => {
    switch (tipo) {
      case 'INICIAL': return 'Inicial'
      case 'SEGUIMIENTO': return 'Seguimiento'
      case 'ESPECIALIZADA': return 'Especializada'
      default: return tipo
    }
  }

  const getModalidadText = (modalidad: ModalidadAsesoria) => {
    switch (modalidad) {
      case 'PRESENCIAL': return 'Presencial'
      case 'VIRTUAL': return 'Virtual'
      case 'TELEFONICA': return 'Telefónica'
      default: return modalidad
    }
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

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">
          {error}
        </div>
        <Link href={`/leads/${leadId}`} className="btn btn-primary">
          Volver al Lead
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Leads', href: '/leads' },
          { label: leadName, href: `/leads/${leadId}` },
          { label: 'Asesorías' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/leads/${leadId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark mb-1">Asesorías</h1>
            <p className="text-secondary mb-0">
              Asesorías para {leadName}
            </p>
          </div>
        </div>
        <Link 
          href={`/leads/${leadId}/asesorias/nueva`}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Plus size={16} />
          Nueva Asesoría
        </Link>
      </div>

      {asesorias.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <Calendar size={64} className="text-muted mb-3" />
            <h4>No hay asesorías registradas</h4>
            <p className="text-muted mb-4">
              Este lead no tiene asesorías programadas o realizadas.
            </p>
            <Link 
              href={`/leads/${leadId}/asesorias/nueva`}
              className="btn btn-primary"
            >
              Programar Primera Asesoría
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {asesorias.map((asesoria) => (
            <div key={asesoria.id} className="col-lg-6 col-xl-4 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{asesoria.tema}</h6>
                    <small className="text-muted">
                      {getTipoText(asesoria.tipo)} - {getModalidadText(asesoria.modalidad)}
                    </small>
                  </div>
                  <span className={getEstadoBadgeClass(asesoria.estado)}>
                    {asesoria.estado}
                  </span>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={14} />
                    <small>
                      {new Date(asesoria.fecha).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Clock size={14} />
                    <small>
                      {new Date(asesoria.fecha).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {asesoria.duracion && ` (${asesoria.duracion} min)`}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <User size={14} />
                    <small>
                      {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                    </small>
                  </div>
                  
                  {asesoria.descripcion && (
                    <p className="small text-muted mb-3">
                      {asesoria.descripcion}
                    </p>
                  )}

                  {asesoria.valor && (
                    <div className="mb-3">
                      <strong className="text-success">
                        ${asesoria.valor.toLocaleString('es-CO')}
                      </strong>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Link 
                      href={`/asesorias/${asesoria.id}`}
                      className="btn btn-sm btn-outline-primary flex-fill"
                    >
                      <Eye size={14} className="me-1" />
                      Ver
                    </Link>
                    <Link 
                      href={`/asesorias/${asesoria.id}/editar`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      <Edit size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      {asesorias.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">Resumen</h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="h4 text-primary">
                  {asesorias.length}
                </div>
                <small className="text-muted">Total Asesorías</small>
              </div>
              <div className="col-md-3">
                <div className="h4 text-success">
                  {asesorias.filter(a => a.estado === 'REALIZADA').length}
                </div>
                <small className="text-muted">Realizadas</small>
              </div>
              <div className="col-md-3">
                <div className="h4 text-warning">
                  {asesorias.filter(a => a.estado === 'PROGRAMADA').length}
                </div>
                <small className="text-muted">Programadas</small>
              </div>
              <div className="col-md-3">
                <div className="h4 text-info">
                  ${asesorias.reduce((sum, a) => sum + (a.valor || 0), 0).toLocaleString('es-CO')}
                </div>
                <small className="text-muted">Valor Total</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}