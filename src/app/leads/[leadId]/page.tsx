'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  User, 
  Building2, 
  Calendar,
  FileText,
  MessageSquare,
  Plus,
  Eye
} from 'lucide-react'
import { EstadoLead, TipoPersona } from '@prisma/client'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa?: string | null
  tipoPersona: TipoPersona
  documento?: string | null
  estado: EstadoLead
  origen?: string | null
  observaciones?: string | null
  fechaSeguimiento?: Date | null
  createdAt: Date
  updatedAt: Date
  responsable?: {
    id: string
    nombre: string
    apellido: string
    email: string
  } | null
  asesorias: Array<{
    id: string
    tipo: string
    estado: string
    fecha: Date
    tema: string
    asesor: {
      nombre: string
      apellido: string
    }
  }>
}

export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params.leadId as string
  
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      } else if (response.status === 404) {
        setError('Lead no encontrado')
      } else {
        setError('Error al cargar el lead')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadgeClass = (estado: EstadoLead) => {
    switch (estado) {
      case 'NUEVO': return 'badge bg-primary'
      case 'CONTACTADO': return 'badge bg-info'
      case 'CALIFICADO': return 'badge bg-warning'
      case 'CONVERTIDO': return 'badge bg-success'
      case 'PERDIDO': return 'badge bg-danger'
      default: return 'badge bg-secondary'
    }
  }

  const getTipoPersonaIcon = (tipo: TipoPersona) => {
    return tipo === 'NATURAL' ? <User size={16} /> : <Building2 size={16} />
  }

  const updateEstado = async (nuevoEstado: EstadoLead) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (response.ok) {
        // Update only the estado field, preserve other data including asesorias
        setLead(prevLead => 
          prevLead ? { ...prevLead, estado: nuevoEstado } : null
        )
        // Optionally refresh the full lead data to ensure consistency
        // fetchLead()
      } else {
        console.error('Error al actualizar estado del lead')
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
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

  if (error || !lead) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">
          {error || 'Lead no encontrado'}
        </div>
        <Link href="/leads" className="btn btn-primary">
          Volver a Leads
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Leads', href: '/leads' },
          { label: lead.nombre }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href="/leads" className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              {getTipoPersonaIcon(lead.tipoPersona)}
              <h1 className="h2 fw-bold text-dark mb-0">{lead.nombre}</h1>
              <span className={getEstadoBadgeClass(lead.estado)}>
                {lead.estado}
              </span>
            </div>
            <p className="text-secondary mb-0">{lead.empresa || 'Sin empresa'}</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href={`/leads/${leadId}/asesorias/nueva`}
            className="btn btn-success d-flex align-items-center gap-2"
          >
            <Plus size={16} />
            Nueva Asesoría
          </Link>
          <Link 
            href={`/leads/${leadId}/editar`}
            className="btn btn-outline-primary d-flex align-items-center gap-2"
          >
            <Edit size={16} />
            Editar
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Información del Lead */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Información del Lead</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Mail size={16} className="text-primary" />
                      <strong>Email:</strong>
                    </div>
                    <p className="mb-0">{lead.email}</p>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Phone size={16} className="text-primary" />
                      <strong>Teléfono:</strong>
                    </div>
                    <p className="mb-0">{lead.telefono}</p>
                  </div>
                  {lead.documento && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <FileText size={16} className="text-primary" />
                        <strong>Documento:</strong>
                      </div>
                      <p className="mb-0">{lead.documento}</p>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  {lead.origen && (
                    <div className="mb-3">
                      <strong>Origen:</strong>
                      <p className="mb-0">{lead.origen}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <strong>Fecha de Creación:</strong>
                    <p className="mb-0">{new Date(lead.createdAt).toLocaleString()}</p>
                  </div>
                  {lead.responsable && (
                    <div className="mb-3">
                      <strong>Responsable:</strong>
                      <p className="mb-0">{lead.responsable.nombre} {lead.responsable.apellido}</p>
                    </div>
                  )}
                </div>
              </div>
              {lead.observaciones && (
                <div className="mt-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <MessageSquare size={16} className="text-primary" />
                    <strong>Observaciones:</strong>
                  </div>
                  <p className="mb-0">{lead.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Asesorías */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Asesorías</h5>
              <Link 
                href={`/leads/${leadId}/asesorias/nueva`}
                className="btn btn-sm btn-primary"
              >
                <Plus size={14} /> Nueva
              </Link>
            </div>
            <div className="card-body">
              {!lead.asesorias || lead.asesorias.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar size={32} className="text-muted mb-2" />
                  <p className="text-muted mb-3">No hay asesorías registradas</p>
                  <Link 
                    href={`/leads/${leadId}/asesorias/nueva`}
                    className="btn btn-primary btn-sm"
                  >
                    Programar Primera Asesoría
                  </Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {lead.asesorias.map((asesoria) => (
                    <div key={asesoria.id} className="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{asesoria.tema}</h6>
                        <p className="mb-1 text-muted small">
                          <strong>Tipo:</strong> {asesoria.tipo} | 
                          <strong>Estado:</strong> {asesoria.estado} |
                          <strong>Asesor:</strong> {asesoria.asesor.nombre} {asesoria.asesor.apellido}
                        </p>
                        <small className="text-muted">
                          {new Date(asesoria.fecha).toLocaleString()}
                        </small>
                      </div>
                      <Link 
                        href={`/asesorias/${asesoria.id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Acciones Rápidas */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link 
                  href={`/leads/${leadId}/asesorias`}
                  className="btn btn-outline-primary"
                >
                  <Calendar className="me-2" size={16} />
                  Ver Asesorías
                </Link>
                <Link 
                  href={`/leads/${leadId}/seguimiento`}
                  className="btn btn-outline-info"
                >
                  <MessageSquare className="me-2" size={16} />
                  Seguimiento
                </Link>
                <a 
                  href={`tel:${lead.telefono}`}
                  className="btn btn-outline-success"
                >
                  <Phone className="me-2" size={16} />
                  Llamar
                </a>
                <a 
                  href={`mailto:${lead.email}`}
                  className="btn btn-outline-warning"
                >
                  <Mail className="me-2" size={16} />
                  Enviar Email
                </a>
              </div>
            </div>
          </div>

          {/* Cambiar Estado */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Estado del Lead</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <span className={`badge ${getEstadoBadgeClass(lead.estado)} fs-6`}>
                  {lead.estado}
                </span>
              </div>
              <div className="d-grid gap-1">
                {lead.estado !== 'CONTACTADO' && (
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => updateEstado('CONTACTADO')}
                  >
                    Marcar como Contactado
                  </button>
                )}
                {lead.estado !== 'CALIFICADO' && (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => updateEstado('CALIFICADO')}
                  >
                    Marcar como Calificado
                  </button>
                )}
                {lead.estado !== 'CONVERTIDO' && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => updateEstado('CONVERTIDO')}
                  >
                    Convertir a Cliente
                  </button>
                )}
                {lead.estado !== 'PERDIDO' && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => updateEstado('PERDIDO')}
                  >
                    Marcar como Perdido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}