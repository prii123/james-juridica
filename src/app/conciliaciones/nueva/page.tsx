'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { EstadoConciliacion } from '@prisma/client'

interface CreateConciliacionData {
  numero: string
  demandante: string
  demandado: string
  valor: number
  fechaSolicitud: string
  fechaAudiencia?: string
  asesoriaId?: string
  estado: EstadoConciliacion
  observaciones?: string
}

interface Asesoria {
  id: string
  tema: string
  lead: {
    id: string
    nombre: string
  }
}

// Loading component para Suspense
function LoadingNewConciliacion() {
  return (
    <>
      <Breadcrumb 
        items={[
          { label: 'Conciliaciones', href: '/conciliaciones' },
          { label: 'Nueva Conciliación' }
        ]} 
      />
      
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/conciliaciones" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nueva Conciliación</h1>
          <p className="text-secondary mb-0">Cargando...</p>
        </div>
      </div>

      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    </>
  )
}

// Componente que usa useSearchParams
function NuevaConciliacionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const asesoriaId = searchParams.get('asesoriaId')

  const [loading, setLoading] = useState(false)
  const [loadingAsesoria, setLoadingAsesoria] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [asesoria, setAsesoria] = useState<Asesoria | null>(null)
  const [formData, setFormData] = useState<CreateConciliacionData>({
    numero: '',
    demandante: '',
    demandado: '',
    valor: 0,
    fechaSolicitud: new Date().toISOString().split('T')[0],
    fechaAudiencia: '',
    asesoriaId: asesoriaId || '',
    estado: 'SOLICITADA',
    observaciones: ''
  })

  useEffect(() => {
    if (asesoriaId) {
      fetchAsesoria()
    }
    
    // Generar número de conciliación automático
    generateConciliacionNumber()
  }, [asesoriaId])

  const fetchAsesoria = async () => {
    if (!asesoriaId) return
    
    try {
      setLoadingAsesoria(true)
      const response = await fetch(`/api/asesorias/${asesoriaId}`)
      
      if (response.ok) {
        const data = await response.json()
        setAsesoria(data)
        setFormData(prev => ({
          ...prev,
          demandante: data.lead.nombre,
          asesoriaId: data.id
        }))
      }
    } catch (error) {
      console.error('Error al cargar asesoría:', error)
    } finally {
      setLoadingAsesoria(false)
    }
  }

  const generateConciliacionNumber = () => {
    // Generar número de conciliación con formato: CONC-YYYY-NNNN
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    const numero = `CONC-${year}-${randomNum}`
    
    setFormData(prev => ({
      ...prev,
      numero
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const conciliacionData = {
        ...formData,
        valor: parseFloat(formData.valor.toString()),
        fechaSolicitud: new Date(formData.fechaSolicitud).toISOString(),
        fechaAudiencia: formData.fechaAudiencia 
          ? new Date(formData.fechaAudiencia).toISOString() 
          : undefined
      }

      const response = await fetch('/api/conciliaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conciliacionData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/conciliaciones/${data.id}`)
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || 'Error al crear la conciliación' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtelo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateConciliacionData, value: string | number) => {
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
          { label: 'Conciliaciones', href: '/conciliaciones' },
          { label: 'Nueva Conciliación' }
        ]} 
      />

      <div className="d-flex align-items-center gap-3 mb-4">
        <Link href="/conciliaciones" className="btn btn-outline-secondary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="h2 fw-bold text-dark mb-1">Nueva Conciliación</h1>
          <p className="text-secondary mb-0">
            {asesoria ? `Originada desde: ${asesoria.tema}` : 'Crear nueva conciliación'}
          </p>
        </div>
      </div>

      {errors.general && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={16} />
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Información de la Conciliación</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Número de Conciliación *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.numero ? 'is-invalid' : ''}`}
                        value={formData.numero}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        placeholder="CONC-2026-0001"
                        required
                      />
                      {errors.numero && <div className="invalid-feedback">{errors.numero}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Estado</label>
                      <select
                        className="form-select"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value as EstadoConciliacion)}
                      >
                        <option value="SOLICITADA">Solicitada</option>
                        <option value="PROGRAMADA">Programada</option>
                        <option value="REALIZADA">Realizada</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Demandante *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.demandante ? 'is-invalid' : ''}`}
                        value={formData.demandante}
                        onChange={(e) => handleInputChange('demandante', e.target.value)}
                        placeholder="Nombre del demandante"
                        required
                      />
                      {errors.demandante && <div className="invalid-feedback">{errors.demandante}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Demandado *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.demandado ? 'is-invalid' : ''}`}
                        value={formData.demandado}
                        onChange={(e) => handleInputChange('demandado', e.target.value)}
                        placeholder="Nombre del demandado"
                        required
                      />
                      {errors.demandado && <div className="invalid-feedback">{errors.demandado}</div>}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Valor de la Conciliación *</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${errors.valor ? 'is-invalid' : ''}`}
                      value={formData.valor}
                      onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className="input-group-text">COP</span>
                    {errors.valor && <div className="invalid-feedback">{errors.valor}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha de Solicitud *</label>
                      <input
                        type="date"
                        className={`form-control ${errors.fechaSolicitud ? 'is-invalid' : ''}`}
                        value={formData.fechaSolicitud}
                        onChange={(e) => handleInputChange('fechaSolicitud', e.target.value)}
                        required
                      />
                      {errors.fechaSolicitud && <div className="invalid-feedback">{errors.fechaSolicitud}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Fecha de Audiencia</label>
                      <input
                        type="date"
                        className={`form-control ${errors.fechaAudiencia ? 'is-invalid' : ''}`}
                        value={formData.fechaAudiencia}
                        onChange={(e) => handleInputChange('fechaAudiencia', e.target.value)}
                      />
                      {errors.fechaAudiencia && <div className="invalid-feedback">{errors.fechaAudiencia}</div>}
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
                    placeholder="Observaciones adicionales sobre la conciliación..."
                  />
                  {errors.observaciones && <div className="invalid-feedback">{errors.observaciones}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Acciones */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Acciones</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                    disabled={loading || loadingAsesoria}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Crear Conciliación
                      </>
                    )}
                  </button>
                  <Link href="/conciliaciones" className="btn btn-outline-secondary">
                    Cancelar
                  </Link>
                </div>

                <hr />

                <div className="text-muted small">
                  <h6>Información:</h6>
                  <ul className="list-unstyled">
                    <li>• Los campos marcados con * son obligatorios</li>
                    <li>• El número se genera automáticamente</li>
                    <li>• La fecha de audiencia es opcional</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Información de la Asesoría Original */}
            {asesoria && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Asesoría Origen</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FileText size={16} />
                    <span className="fw-semibold">{asesoria.tema}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <User size={16} />
                    <span className="text-muted">{asesoria.lead.nombre}</span>
                  </div>
                  <Link 
                    href={`/asesorias/${asesoria.id}`}
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    Ver Asesoría
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}

// Componente principal que envuelve el contenido en Suspense
export default function NuevaConciliacionPage() {
  return (
    <Suspense fallback={<LoadingNewConciliacion />}>
      <NuevaConciliacionContent />
    </Suspense>
  )
}