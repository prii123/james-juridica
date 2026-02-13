'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, User } from 'lucide-react'
import { TipoAsesoria, ModalidadAsesoria, EstadoAsesoria } from '@prisma/client'

interface EditAsesoriaData {
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  hora: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  valor?: number
  asesorId: string
  notas?: string
}

interface Asesoria {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: string
  duracion: number
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string
  valor?: number
  notas?: string
  lead: {
    id: string
    nombre: string
    email: string
  }
  asesor: {
    id: string
    nombre: string
    apellido: string
  }
}

interface Asesor {
  id: string
  nombre: string
  apellido: string  
}

export default function EditAsesoriaPage({ params }: { params: { asesoriaId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [asesoria, setAsesoria] = useState<Asesoria | null>(null)
  
  const [formData, setFormData] = useState<EditAsesoriaData>({
    tipo: 'INICIAL',
    estado: 'PROGRAMADA',
    fecha: '',
    hora: '',
    duracion: 60,
    modalidad: 'PRESENCIAL',
    tema: '',
    descripcion: '',
    valor: undefined,
    asesorId: '',
    notas: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Cargar asesoría y asesores en paralelo
      const [asesoriaResponse, asesoresResponse] = await Promise.all([
        fetch(`/api/asesorias/${params.asesoriaId}`),
        fetch('/api/usuarios?role=Asesor')
      ])

      if (asesoriaResponse.ok) {
        const asesoriaData = await asesoriaResponse.json()
        setAsesoria(asesoriaData)
        
        // Llenar formulario con datos existentes
        const fechaObj = new Date(asesoriaData.fecha)
        const fecha = fechaObj.toISOString().split('T')[0]
        const hora = fechaObj.toTimeString().substring(0, 5)
        
        setFormData({
          tipo: asesoriaData.tipo,
          estado: asesoriaData.estado,
          fecha,
          hora,
          duracion: asesoriaData.duracion,
          modalidad: asesoriaData.modalidad,
          tema: asesoriaData.tema,
          descripcion: asesoriaData.descripcion || '',
          valor: asesoriaData.valor,
          asesorId: asesoriaData.asesor.id,
          notas: asesoriaData.notas || ''
        })
      }

      if (asesoresResponse.ok) {
        const response = await asesoresResponse.json()
        // La API devuelve { usuarios: [...] }, no un array directamente
        setAsesores(Array.isArray(response) ? response : response.usuarios || [])
      } else {
        console.error('Error al cargar asesores:', asesoresResponse.status)
        setAsesores([]) // Asegurar que asesores siempre sea un array
      }

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setErrors({ general: 'Error al cargar datos' })
      setAsesores([]) // Asegurar que asesores siempre sea un array vacío en caso de error
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
      
      const updateData = {
        ...formData,
        fecha: fechaHora.toISOString(),
        duracion: formData.duracion,
        valor: formData.valor || null
      }

      delete (updateData as any).hora

      const response = await fetch(`/api/asesorias/${params.asesoriaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.push(`/asesorias/${params.asesoriaId}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.error || 'Error al actualizar la asesoría' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditAsesoriaData, value: string | number | TipoAsesoria | ModalidadAsesoria | EstadoAsesoria | undefined) => {
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

  if (!asesoria) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          Asesoría no encontrada
        </div>
        <Link href="/asesorias" className="btn btn-primary">
          Volver a Asesorías
        </Link>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Asesorías', href: '/asesorias' },
          { label: asesoria.tema, href: `/asesorias/${params.asesoriaId}` },
          { label: 'Editar' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href={`/asesorias/${params.asesoriaId}`} className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Editar Asesoría</h1>
          <p className="text-secondary mb-0">
            Cliente: {asesoria.lead.nombre}
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
                
                {/* Cliente (Solo lectura) */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cliente</label>
                  <div className="form-control bg-light d-flex align-items-center gap-2">
                    <User size={16} />
                    <span>{asesoria.lead.nombre}</span>
                    <small className="text-muted ms-auto">({asesoria.lead.email})</small>
                  </div>
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
                    {Array.isArray(asesores) && asesores.map((asesor) => (
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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                  <Link href={`/asesorias/${params.asesoriaId}`} className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}