'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Calendar, Clock } from 'lucide-react'
import { TipoAsesoria, ModalidadAsesoria, EstadoAsesoria } from '@prisma/client'

interface CreateAsesoriaData {
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  valor?: number
  leadId: string
  asesorId: string
  notas?: string
}

interface Lead {
  id: string
  nombre: string
  email: string  
  telefono: string
  estado: string
}

interface Asesor {
  id: string
  nombre: string
  apellido: string  
}

// Componente interno que usa useSearchParams
function NuevaAsesoriaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadIdParam = searchParams.get('leadId')
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [leads, setLeads] = useState<Lead[]>([])
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  const [formData, setFormData] = useState<CreateAsesoriaData>({
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tema: '',
    descripcion: '',
    valor: undefined,
    leadId: leadIdParam || '',
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (leadIdParam && leads.length > 0) {
      const lead = leads.find(l => l.id === leadIdParam)
      if (lead) {
        setSelectedLead(lead)
        setFormData(prev => ({
          ...prev,
          leadId: leadIdParam,
          tema: `Consulta inicial - ${lead.nombre}`
        }))
      }
    }
  }, [leadIdParam, leads])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Cargar leads y asesores en paralelo
      const [leadsResponse, asesoresResponse] = await Promise.all([
        fetch('/api/leads?limit=100'),
        fetch('/api/usuarios?role=ASESOR')
      ])

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        const leadsList = Array.isArray(leadsData) ? leadsData : leadsData.leads || []
        setLeads(leadsList)
      }

      if (asesoresResponse.ok) {
        const asesoresData = await asesoresResponse.json()
        setAsesores(asesoresData)
      }

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error)
      setErrors({ general: 'Error al cargar datos iniciales' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Combinar fecha y hora
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}:00`)
      
      const asesoriaData = {
        ...formData,
        fecha: fechaHora.toISOString(),
        duracion: formData.duracion,
        valor: formData.valor || null
      }

      delete (asesoriaData as any).hora

      const response = await fetch('/api/asesorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asesoriaData),
      })

      if (response.ok) {
        const asesoria = await response.json()
        
        // Si viene de un lead específico, implementar transición del workflow
        if (leadIdParam && selectedLead?.estado === 'CALIFICADO') {
          try {
            // Actualizar estado del lead según workflow
            await fetch(`/api/leads/${leadIdParam}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ estado: 'CONVERTIDO' }),
            })
          } catch (error) {
            console.log('No se pudo actualizar el estado del lead:', error)
          }
        }
        
        router.push(`/asesorias/${asesoria.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al crear la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateAsesoriaData, value: string | number | TipoAsesoria | ModalidadAsesoria | EstadoAsesoria | undefined) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }

    // Auto-completar tema cuando se selecciona lead
    if (field === 'leadId' && value && typeof value === 'string') {
      const lead = leads.find(l => l.id === value)
      if (lead) {
        setSelectedLead(lead)
        if (!formData.tema || formData.tema.startsWith('Consulta inicial -')) {
          setFormData(prev => ({ 
            ...prev, 
            leadId: value, 
            tema: `Consulta inicial - ${lead.nombre}`
          }))
        } else {
          setFormData(prev => ({ ...prev, leadId: value }))
        }
      }
    }
  }

  if (loadingData) {
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
          { label: 'Asesorías', href: '/asesorias' },
          { label: 'Nueva Asesoría' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/asesorias" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nueva Asesoría</h1>
          <p className="text-secondary mb-0">
            {leadIdParam ? `Crear asesoría para ${selectedLead?.nombre || 'lead seleccionado'}` : 'Crear nueva asesoría jurídica'}
          </p>
        </div>
      </div>

      {errors.general && (
        <div className="alert alert-danger" role="alert">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Información de la Asesoría</h5>
              </div>
              <div className="card-body">
                
                {/* Lead Selection */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Lead/Cliente *</label>
                  {leadIdParam ? (
                    <div className="form-control bg-light d-flex align-items-center gap-2">
                      <User size={16} />
                      <span>{selectedLead?.nombre || 'Lead seleccionado'}</span>
                      <small className="text-muted ms-auto">({selectedLead?.email})</small>
                    </div>
                  ) : (
                    <select
                      className={`form-select ${errors.leadId ? 'is-invalid' : ''}`}
                      value={formData.leadId}
                      onChange={(e) => handleInputChange('leadId', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar lead/cliente</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.nombre} - {lead.email}
                        </option>
                      ))}
                    </select>
                  )}
                  {!leadIdParam && (
                    <div className="form-text">
                      <Link href="/leads/nuevo" className="text-decoration-none">
                        ¿No encuentras el lead? Crear nuevo lead
                      </Link>
                    </div>
                  )}
                  {errors.leadId && <div className="invalid-feedback">{errors.leadId}</div>}
                </div>

                {/* Tema */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tema de la Asesoría *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.tema ? 'is-invalid' : ''}`}
                    value={formData.tema}
                    onChange={(e) => handleInputChange('tema', e.target.value)}
                    placeholder="Ej: Consulta sobre proceso de insolvencia"
                    required
                  />
                  {errors.tema && <div className="invalid-feedback">{errors.tema}</div>}
                </div>

                {/* Descripción */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Descripción</label>
                  <textarea
                    className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción detallada de la asesoría..."
                  />
                  {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                </div>

                {/* Fecha y Hora */}
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha *</label>
                      <input
                        type="date"
                        className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
                        value={formData.fecha}
                        onChange={(e) => handleInputChange('fecha', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      {errors.fecha && <div className="invalid-feedback">{errors.fecha}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Hora *</label>
                      <input
                        type="time"
                        className={`form-control ${errors.hora ? 'is-invalid' : ''}`}
                        value={formData.hora}
                        onChange={(e) => handleInputChange('hora', e.target.value)}
                        required
                      />
                      {errors.hora && <div className="invalid-feedback">{errors.hora}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Duración (minutos)</label>
                      <select
                        className="form-select"
                        value={formData.duracion}
                        onChange={(e) => handleInputChange('duracion', parseInt(e.target.value))}
                      >
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora</option>
                        <option value={90}>1.5 horas</option>
                        <option value={120}>2 horas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tipo, Modalidad y Estado */}
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Tipo de Asesoría *</label>
                      <select
                        className={`form-select ${errors.tipo ? 'is-invalid' : ''}`}
                        value={formData.tipo}
                        onChange={(e) => handleInputChange('tipo', e.target.value as TipoAsesoria)}
                        required
                      >
                        <option value="INICIAL">Inicial</option>
                        <option value="SEGUIMIENTO">Seguimiento</option>
                        <option value="ESPECIALIZADA">Especializada</option>
                      </select>
                      {errors.tipo && <div className="invalid-feedback">{errors.tipo}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Modalidad</label>
                      <select
                        className="form-select"
                        value={formData.modalidad}
                        onChange={(e) => handleInputChange('modalidad', e.target.value as ModalidadAsesoria)}
                      >
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="VIRTUAL">Virtual</option>
                        <option value="TELEFONICA">Telefónica</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Estado</label>
                      <select
                        className="form-select"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value as EstadoAsesoria)}
                      >
                        <option value="PROGRAMADA">Programada</option>
                        <option value="REALIZADA">Realizada</option>
                        <option value="CANCELADA">Cancelada</option>
                        <option value="REPROGRAMADA">Reprogramada</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Asesor */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Asesor Asignado *</label>
                  <select
                    className={`form-select ${errors.asesorId ? 'is-invalid' : ''}`}
                    value={formData.asesorId}
                    onChange={(e) => handleInputChange('asesorId', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar asesor</option>
                    {asesores.map((asesor) => (
                      <option key={asesor.id} value={asesor.id}>
                        {asesor.nombre} {asesor.apellido}
                      </option>
                    ))}
                  </select>
                  {errors.asesorId && <div className="invalid-feedback">{errors.asesorId}</div>}
                </div>

                {/* Valor */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Valor de la Asesoría</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${errors.valor ? 'is-invalid' : ''}`}
                      value={formData.valor || ''}
                      onChange={(e) => {
                        const value = e.target.value.trim()
                        if (value === '' || value === '0') {
                          handleInputChange('valor', undefined)
                        } else {
                          const numValue = parseFloat(value)
                          handleInputChange('valor', isNaN(numValue) ? undefined : numValue)
                        }
                      }}
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                    <span className="input-group-text">COP</span>
                  </div>
                  {errors.valor && <div className="invalid-feedback">{errors.valor}</div>}
                </div>

                {/* Notas */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Notas Adicionales</label>
                  <textarea
                    className={`form-control ${errors.notas ? 'is-invalid' : ''}`}
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Notas internas sobre la asesoría..."
                  />
                  {errors.notas && <div className="invalid-feedback">{errors.notas}</div>}
                </div>

              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Acciones</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Crear Asesoría
                      </>
                    )}
                  </button>
                  <Link href="/asesorias" className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Workflow:</h6>
                  <ul className="list-unstyled">
                    <li>• La asesoría se asociará al lead seleccionado</li>
                    {leadIdParam && selectedLead?.estado === 'CALIFICADO' && (
                      <li>• El lead será marcado como CONVERTIDO</li>
                    )}
                    <li>• Una vez REALIZADA podrá generar conciliación o caso</li>
                  </ul>
                </div>
              </div>
            </div>

            {selectedLead && (
              <div className="card mt-3">
                <div className="card-header">
                  <h6 className="mb-0">Cliente/Lead</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <User size={16} />
                    <span className="fw-semibold">{selectedLead.nombre}</span>
                  </div>
                  <div className="small text-muted">
                    <div>Email: {selectedLead.email}</div>
                    <div>Teléfono: {selectedLead.telefono}</div>
                    <div>Estado: <span className="badge badge-sm bg-primary">{selectedLead.estado}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}

// Componente principal exportado que envuelve el contenido en Suspense
export default function NuevaAsesoriaPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    }>
      <NuevaAsesoriaContent />
    </Suspense>
  )
}
