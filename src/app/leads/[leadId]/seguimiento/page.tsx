'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { 
  ArrowLeft, 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  User,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'

interface SeguimientoItem {
  id: string
  tipo: 'LLAMADA' | 'EMAIL' | 'REUNION' | 'NOTA' | 'WHATSAPP'
  descripcion: string
  fecha: Date
  duracion?: number | null
  resultado?: string | null
  proximoSeguimiento?: Date | null
  usuario: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}

type TipoSeguimiento = 'LLAMADA' | 'EMAIL' | 'REUNION' | 'NOTA' | 'WHATSAPP'

interface NewSeguimientoForm {
  tipo: TipoSeguimiento
  descripcion: string
  duracion: string
  resultado: string
  proximoSeguimiento: string
}

export default function LeadSeguimientoPage() {
  const params = useParams()
  const leadId = params.leadId as string
  
  const [seguimientos, setSeguimientos] = useState<SeguimientoItem[]>([])
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSeguimiento, setNewSeguimiento] = useState<NewSeguimientoForm>({
    tipo: 'NOTA',
    descripcion: '',
    duracion: '',
    resultado: '',
    proximoSeguimiento: ''
  })

  useEffect(() => {
    if (leadId) {
      fetchData()
    }
  }, [leadId])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch lead data
      const leadResponse = await fetch(`/api/leads/${leadId}`)
      if (leadResponse.ok) {
        const leadData = await leadResponse.json()
        setLead(leadData)
      }

      // Fetch seguimientos (mock data for now)
      // const seguimientosResponse = await fetch(`/api/leads/${leadId}/seguimiento`)
      // if (seguimientosResponse.ok) {
      //   const seguimientosData = await seguimientosResponse.json()
      //   setSeguimientos(seguimientosData)
      // }
      
      // Mock data for demonstration
      setSeguimientos([
        {
          id: '1',
          tipo: 'LLAMADA',
          descripcion: 'Llamada inicial para presentar servicios',
          fecha: new Date('2024-02-10T10:30:00'),
          duracion: 15,
          resultado: 'Interesado en asesoría',
          proximoSeguimiento: new Date('2024-02-15T14:00:00'),
          usuario: { id: '1', nombre: 'Juan', apellido: 'Pérez' }
        },
        {
          id: '2',
          tipo: 'EMAIL',
          descripcion: 'Envío de propuesta detallada',
          fecha: new Date('2024-02-12T09:15:00'),
          resultado: 'Enviado exitosamente',
          usuario: { id: '1', nombre: 'Juan', apellido: 'Pérez' }
        }
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const seguimientoData = {
      tipo: newSeguimiento.tipo,
      descripcion: newSeguimiento.descripcion,
      duracion: newSeguimiento.duracion ? parseInt(newSeguimiento.duracion) : null,
      resultado: newSeguimiento.resultado || null,
      proximoSeguimiento: newSeguimiento.proximoSeguimiento ? new Date(newSeguimiento.proximoSeguimiento) : null,
    }

    try {
      // const response = await fetch(`/api/leads/${leadId}/seguimiento`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(seguimientoData)
      // })

      // if (response.ok) {
      //   fetchData()
      //   setShowForm(false)
      //   setNewSeguimiento({
      //     tipo: 'NOTA',
      //     descripcion: '',
      //     duracion: '',
      //     resultado: '',
      //     proximoSeguimiento: ''
      //   })
      // }

      // Mock success for demo
      const mockSeguimiento: SeguimientoItem = {
        id: Date.now().toString(),
        ...seguimientoData,
        fecha: new Date(),
        usuario: { id: '1', nombre: 'Usuario', apellido: 'Demo' }
      }
      setSeguimientos([mockSeguimiento, ...seguimientos])
      setShowForm(false)
      setNewSeguimiento({
        tipo: 'NOTA',
        descripcion: '',
        duracion: '',
        resultado: '',
        proximoSeguimiento: ''
      })
    } catch (error) {
      console.error('Error al guardar seguimiento:', error)
    }
  }

  const getTipoIcon = (tipo: TipoSeguimiento) => {
    switch (tipo) {
      case 'LLAMADA': return <Phone size={16} className="text-success" />
      case 'EMAIL': return <Mail size={16} className="text-primary" />
      case 'REUNION': return <Calendar size={16} className="text-warning" />
      case 'WHATSAPP': return <MessageSquare size={16} className="text-info" />
      case 'NOTA': return <Edit size={16} className="text-secondary" />
      default: return <MessageSquare size={16} className="text-secondary" />
    }
  }

  const getTipoColor = (tipo: TipoSeguimiento) => {
    switch (tipo) {
      case 'LLAMADA': return 'border-success'
      case 'EMAIL': return 'border-primary'
      case 'REUNION': return 'border-warning'
      case 'WHATSAPP': return 'border-info'
      case 'NOTA': return 'border-secondary'
      default: return 'border-secondary'
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

  if (!lead) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger">Lead no encontrado</div>
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
          { label: lead.nombre, href: `/leads/${leadId}` },
          { label: 'Seguimiento' }
        ]} 
      />

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={`/leads/${leadId}`} className="btn btn-outline-secondary">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark mb-1">Seguimiento</h1>
            <p className="text-secondary mb-0">
              Historial de interacciones con {lead.nombre}
            </p>
          </div>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Nuevo Seguimiento
        </button>
      </div>

      {/* Formulario de nuevo seguimiento */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Nuevo Seguimiento</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Tipo de Seguimiento</label>
                    <select
                      className="form-select"
                      value={newSeguimiento.tipo}
                      onChange={(e) => setNewSeguimiento({
                        ...newSeguimiento,
                        tipo: e.target.value as TipoSeguimiento
                      })}
                      required
                    >
                      <option value="NOTA">Nota</option>
                      <option value="LLAMADA">Llamada</option>
                      <option value="EMAIL">Email</option>
                      <option value="REUNION">Reunión</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>
                </div>
                {(newSeguimiento.tipo === 'LLAMADA' || newSeguimiento.tipo === 'REUNION') && (
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Duración (minutos)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newSeguimiento.duracion}
                        onChange={(e) => setNewSeguimiento({
                          ...newSeguimiento,
                          duracion: e.target.value
                        })}
                        placeholder="15"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Descripción *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={newSeguimiento.descripcion}
                  onChange={(e) => setNewSeguimiento({
                    ...newSeguimiento,
                    descripcion: e.target.value
                  })}
                  placeholder="Describe la interacción..."
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Resultado</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSeguimiento.resultado}
                      onChange={(e) => setNewSeguimiento({
                        ...newSeguimiento,
                        resultado: e.target.value
                      })}
                      placeholder="Resultado de la interacción"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Próximo Seguimiento</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={newSeguimiento.proximoSeguimiento}
                      onChange={(e) => setNewSeguimiento({
                        ...newSeguimiento,
                        proximoSeguimiento: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline de seguimientos */}
      <div className="row">
        <div className="col-lg-8">
          {seguimientos.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <MessageSquare size={64} className="text-muted mb-3" />
                <h4>No hay seguimientos registrados</h4>
                <p className="text-muted mb-4">
                  Comienza a registrar las interacciones con este lead.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Crear Primer Seguimiento
                </button>
              </div>
            </div>
          ) : (
            <div className="timeline">
              {seguimientos.map((seguimiento, index) => (
                <div key={seguimiento.id} className={`card mb-3 border-start border-3 ${getTipoColor(seguimiento.tipo)}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        {getTipoIcon(seguimiento.tipo)}
                        <strong>{seguimiento.tipo}</strong>
                        {seguimiento.duracion && (
                          <small className="text-muted">
                            ({seguimiento.duracion} min)
                          </small>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">
                          {new Date(seguimiento.fecha).toLocaleString()}
                        </small>
                        <button className="btn btn-sm btn-outline-secondary">
                          <Edit size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="mb-2">{seguimiento.descripcion}</p>
                    
                    {seguimiento.resultado && (
                      <div className="mb-2">
                        <small className="text-success">
                          <strong>Resultado:</strong> {seguimiento.resultado}
                        </small>
                      </div>
                    )}
                    
                    {seguimiento.proximoSeguimiento && (
                      <div className="mb-2">
                        <small className="text-warning">
                          <Clock size={12} className="me-1" />
                          <strong>Próximo seguimiento:</strong> {new Date(seguimiento.proximoSeguimiento).toLocaleString()}
                        </small>
                      </div>
                    )}
                    
                    <div className="d-flex align-items-center gap-1">
                      <User size={12} />
                      <small className="text-muted">
                        {seguimiento.usuario.nombre} {seguimiento.usuario.apellido}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {/* Acciones rápidas */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Acciones Rápidas</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a 
                  href={`tel:${lead.telefono}`}
                  className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
                >
                  <Phone size={14} />
                  Llamar
                </a>
                <a 
                  href={`mailto:${lead.email}`}
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                >
                  <Mail size={14} />
                  Enviar Email
                </a>
                <a 
                  href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-info btn-sm d-flex align-items-center gap-2"
                >
                  <MessageSquare size={14} />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Resumen</h6>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="h4 text-primary">{seguimientos.length}</div>
                <small className="text-muted">Total Interacciones</small>
              </div>
              <hr />
              <div className="small">
                {Object.entries(seguimientos.reduce((acc, s) => {
                  acc[s.tipo] = (acc[s.tipo] || 0) + 1
                  return acc
                }, {} as Record<string, number>)).map(([tipo, count]) => (
                  <div key={tipo} className="d-flex justify-content-between">
                    <span>{tipo}:</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}