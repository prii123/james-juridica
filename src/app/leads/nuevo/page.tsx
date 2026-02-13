'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User, Building2 } from 'lucide-react'
import { TipoPersona } from '@prisma/client'

interface CreateLeadData {
  nombre: string
  email: string
  telefono: string
  empresa?: string
  tipoPersona: TipoPersona
  documento?: string
  origen?: string
  observaciones?: string
}

export default function NuevoLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreateLeadData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipoPersona: 'NATURAL',
    documento: '',
    origen: '',
    observaciones: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try { 
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/leads/${result.id}`)
      } else {
        const error = await response.json()

        // Manejo más robusto de errores
        if (error.errors && typeof error.errors === 'object') {
          // Errores de validación por campo
          setErrors(error.errors)
        } else if (error.error) {
          // Error principal del servidor
          setErrors({ general: error.error })
        } else if (error.message) {
          // Mensaje de error genérico
          setErrors({ general: error.message })
        } else {
          // Fallback si no hay estructura reconocible
          setErrors({ general: `Error ${response.status}: ${response.statusText || 'Error al crear el lead'}` })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateLeadData, value: string | TipoPersona) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Leads', href: '/leads' },
          { label: 'Nuevo Lead' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/leads" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nuevo Lead</h1>
          <p className="text-secondary mb-0">Registrar un nuevo prospecto</p>
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
                        Guardar Lead
                      </>
                    )}
                  </button>
                  <Link href="/leads" className="btn btn-outline-secondary">
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