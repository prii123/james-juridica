'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Calendar, User, FileText } from 'lucide-react'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria } from '@prisma/client'

interface CreateAsesoriaData {
  descripcion: string
  tema: string
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  asesorId: string
  notas?: string
}

interface Asesor {
  id: string
  nombre: string
  apellido: string
}

export default function NuevaAsesoriaLeadPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.leadId as string
  
  const [loading, setLoading] = useState(false)
  const [loadingAsesores, setLoadingAsesores] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [leadName, setLeadName] = useState<string>('')
  const [formData, setFormData] = useState<CreateAsesoriaData>({
    descripcion: '',
    tema: '',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchAsesores()
    fetchLeadInfo()
  }, [])

  const fetchAsesores = async () => {
    try {
      console.log('Iniciando carga de asesores...')
      
      // Primero intentamos con el endpoint de usuarios
      let response = await fetch('/api/usuarios?role=Asesor')
      console.log('Respuesta usuarios:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Datos usuarios recibidos:', data)
        if (data.usuarios && data.usuarios.length > 0) {
          setAsesores(data.usuarios)
          console.log('Asesores establecidos desde usuarios:', data.usuarios.length)
          return
        }
      }
      
      // Si no funciona, intentamos con el endpoint específico de asesores
      console.log('Intentando con endpoint de asesores...')
      response = await fetch('/api/asesores')
      console.log('Respuesta asesores:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Datos asesores recibidos:', data)
        setAsesores(data.asesores || [])
        console.log('Asesores establecidos desde asesores:', data.asesores?.length || 0)
      } else {
        const errorData = await response.json()
        console.error('Error en ambas respuestas:', errorData)
        setAsesores([])
      }
    } catch (error) {
      console.error('Error al cargar asesores:', error)
      setAsesores([])
    } finally {
      setLoadingAsesores(false)
    }
  }

  const fetchLeadInfo = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const lead = await response.json()
        setLeadName(lead.nombre)
        setFormData(prev => ({
          ...prev,
          descripcion: `Consulta con ${lead.nombre}`
        }))
      }
    } catch (error) {
      console.error('Error al cargar información del lead:', error)
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
        leadId
      }

      delete (asesoriaData as any).hora

      const response = await fetch(`/api/leads/${leadId}/asesorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asesoriaData),
      })

      if (response.ok) {
        router.push(`/leads/${leadId}/asesorias`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al crear la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateAsesoriaData, value: string | number | TipoAsesoria | EstadoAsesoria | ModalidadAsesoria) => {
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
          { label: leadName, href: `/leads/${leadId}` },
          { label: 'Asesorías', href: `/leads/${leadId}/asesorias` },
          { label: 'Nueva Asesoría' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/leads/${leadId}/asesorias`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nueva Asesoría</h1>
          <p className="text-secondary mb-0">Crear asesoría para el lead: {leadName}</p>
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
                <div className="mb-3">
                  <label className="form-label fw-semibold">Descripción *</label>
                  <textarea
                    className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción detallada de la asesoría..."
                    required
                  />
                  {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Tema *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.tema ? 'is-invalid' : ''}`}
                    value={formData.tema}
                    onChange={(e) => handleInputChange('tema', e.target.value)}
                    placeholder="Tema principal de la asesoría"
                    required
                  />
                  {errors.tema && <div className="invalid-feedback">{errors.tema}</div>}
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha *</label>
                      <input
                        type="date"
                        className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
                        value={formData.fecha}
                        onChange={(e) => handleInputChange('fecha', e.target.value)}
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
                        <option value={60}>1 hora</option>
                        <option value={90}>1.5 horas</option>
                        <option value={120}>2 horas</option>
                      </select>
                    </div>
                  </div>
                </div>

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
                      <label className="form-label fw-semibold">Modalidad *</label>
                      <select
                        className={`form-select ${errors.modalidad ? 'is-invalid' : ''}`}
                        value={formData.modalidad}
                        onChange={(e) => handleInputChange('modalidad', e.target.value as ModalidadAsesoria)}
                        required
                      >
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="VIRTUAL">Virtual</option>
                        <option value="TELEFONICA">Telefónica</option>
                      </select>
                      {errors.modalidad && <div className="invalid-feedback">{errors.modalidad}</div>}
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

                <div className="mb-3">
                  <label className="form-label fw-semibold">Asesor Asignado *</label>
                  {loadingAsesores ? (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Cargando asesores...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select
                        className={`form-select ${errors.asesorId ? 'is-invalid' : ''}`}
                        value={formData.asesorId}
                        onChange={(e) => handleInputChange('asesorId', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar asesor</option>
                        {Array.isArray(asesores) && asesores.map((asesor) => (
                          <option key={asesor.id} value={asesor.id}>
                            {asesor.nombre} {asesor.apellido}
                          </option>
                        ))}
                      </select>
                      {Array.isArray(asesores) && asesores.length === 0 && (
                        <div className="form-text text-warning">
                          No se encontraron asesores disponibles. Asegúrate de que haya usuarios creados con rol ASESOR.
                        </div>
                      )}
                    </>
                  )}
                  {errors.asesorId && <div className="invalid-feedback">{errors.asesorId}</div>}
                </div>

                <div className="mb-3">  
                  <label className="form-label fw-semibold">Notas</label>
                  <textarea
                    className={`form-control ${errors.notas ? 'is-invalid' : ''}`}
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    placeholder="Notas adicionales..."
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
                    disabled={loading || loadingAsesores}
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
                  <Link href={`/leads/${leadId}/asesorias`} className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Información:</h6>
                  <ul className="list-unstyled">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• La asesoría será asignada automáticamente al lead seleccionado</li>
                    <li>• Se notificará al asesor asignado por email</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Lead Asociado</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 text-muted mb-2">
                  <User size={16} />
                  <span>{leadName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}