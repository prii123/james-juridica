'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Building2 } from 'lucide-react'
import { TipoPersona, EstadoLead } from '@prisma/client'

interface UpdateLeadData {
  nombre: string
  email: string
  telefono: string
  empresa?: string
  tipoPersona: TipoPersona
  documento?: string
  estado: EstadoLead
  origen?: string
  observaciones?: string
}

export default function EditarLeadPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.leadId as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<UpdateLeadData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipoPersona: 'NATURAL',
    documento: '',
    estado: 'NUEVO',
    origen: '',
    observaciones: ''
  })

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  const fetchLead = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const lead = await response.json()
        setFormData({
          nombre: lead.nombre || '',
          email: lead.email || '',
          telefono: lead.telefono || '',
          empresa: lead.empresa || '',
          tipoPersona: lead.tipoPersona || 'NATURAL',
          documento: lead.documento || '',
          estado: lead.estado || 'NUEVO',
          origen: lead.origen || '',
          observaciones: lead.observaciones || ''
        })
      } else {
        setErrors({ general: 'Error al cargar el lead' })
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/leads/${leadId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al actualizar el lead' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UpdateLeadData, value: string | TipoPersona | EstadoLead) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
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
          { label: 'Leads', href: '/leads' },
          { label: formData.nombre, href: `/leads/${leadId}` },
          { label: 'Editar' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/leads/${leadId}`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Editar Lead</h1>
          <p className="text-secondary mb-0">Actualizar información del prospecto</p>
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
                <h5 className="mb-0">Información del Lead</h5>
              </div>
              <div className="card-body">
                {/* Tipo de Persona */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Tipo de Persona *</label>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="tipoPersona"
                          id="natural"
                          checked={formData.tipoPersona === 'NATURAL'}
                          onChange={() => handleInputChange('tipoPersona', 'NATURAL')}
                        />
                        <label className="form-check-label d-flex align-items-center gap-2" htmlFor="natural">
                          <User size={16} />
                          Persona Natural
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="tipoPersona"
                          id="juridica"
                          checked={formData.tipoPersona === 'JURIDICA'}
                          onChange={() => handleInputChange('tipoPersona', 'JURIDICA')}
                        />
                        <label className="form-check-label d-flex align-items-center gap-2" htmlFor="juridica">
                          <Building2 size={16} />
                          Persona Jurídica
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nombre Completo *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Ingrese el nombre completo"
                        required
                      />
                      {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Documento de Identidad</label>
                      <input
                        type="text"
                        className={`form-control ${errors.documento ? 'is-invalid' : ''}`}
                        value={formData.documento}
                        onChange={(e) => handleInputChange('documento', e.target.value)}
                        placeholder={formData.tipoPersona === 'NATURAL' ? 'Cédula de ciudadanía' : 'NIT'}
                      />
                      {errors.documento && <div className="invalid-feedback">{errors.documento}</div>}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email *</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Teléfono *</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        placeholder="3001234567"
                        required
                      />
                      {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
                    </div>
                  </div>
                </div>

                {formData.tipoPersona === 'JURIDICA' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre de la Empresa</label>
                    <input
                      type="text"
                      className={`form-control ${errors.empresa ? 'is-invalid' : ''}`}
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                    {errors.empresa && <div className="invalid-feedback">{errors.empresa}</div>}
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Estado</label>
                      <select
                        className="form-select"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value as EstadoLead)}
                      >
                        <option value="NUEVO">Nuevo</option>
                        <option value="CONTACTADO">Contactado</option>
                        <option value="CALIFICADO">Calificado</option>
                        <option value="CONVERTIDO">Convertido</option>
                        <option value="PERDIDO">Perdido</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Origen del Lead</label>
                      <select
                        className="form-select"
                        value={formData.origen}
                        onChange={(e) => handleInputChange('origen', e.target.value)}
                      >
                        <option value="">Seleccionar origen</option>
                        <option value="WEB">Página Web</option>
                        <option value="REFERIDO">Referido</option>
                        <option value="MARKETING">Campaña de Marketing</option>
                        <option value="REDES_SOCIALES">Redes Sociales</option>
                        <option value="EVENTO">Evento</option>
                        <option value="LLAMADA_FRIA">Llamada en Frío</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Observaciones</label>
                  <textarea
                    className={`form-control ${errors.observaciones ? 'is-invalid' : ''}`}
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Información adicional sobre el lead..."
                  />
                  {errors.observaciones && <div className="invalid-feedback">{errors.observaciones}</div>}
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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Actualizar Lead
                      </>
                    )}
                  </button>
                  <Link href={`/leads/${leadId}`} className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Información:</h6>
                  <ul className="list-unstyled">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• El email debe ser único en el sistema</li>
                    <li>• El documento debe ser válido para Colombia</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}