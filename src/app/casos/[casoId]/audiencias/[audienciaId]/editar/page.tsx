'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'

interface UpdateAudienciaData {
    tipo?: string
    fechaHora?: string
    estado?: string
    resultadoAudiencia?: string
    modalidad?: string
    direccion?: string
    enlace?: string
    observaciones?: string
    resultado?: string
    responsableId?: string
}

interface User {
    id: string
    nombre: string
    apellido: string
    email: string
}

interface Audiencia {
    id: string
    tipo: string
    fechaHora: string
    estado: string
    resultadoAudiencia: string
    modalidad: string
    direccion?: string
    enlace?: string
    observaciones?: string
    resultado?: string
    responsable: {
        id: string
        nombre: string
        apellido: string
    }
}

interface Caso {
    id: string
    numeroCaso: string
    cliente: {
        nombre: string
        apellido?: string
    }
}

const TIPO_AUDIENCIAS = [
    { value: 'RADICACION', label: 'Radicación' },
    { value: 'ADMISORIA', label: 'Admisoria' },
    { value: 'VERIFICACION_CREDITOS', label: 'Verificación de Créditos' },
    { value: 'CATEGORIA_CREDITOS', label: 'Categoría de Créditos' },
    { value: 'CONCORDATO', label: 'Concordato' },
    { value: 'OTRA', label: 'Otra' }
]

const ESTADOS = [
    { value: 'PROGRAMADA', label: 'Programada' },
    { value: 'REALIZADA', label: 'Realizada' },
    { value: 'APLAZADA', label: 'Aplazada' },
    { value: 'CANCELADA', label: 'Cancelada' }
]

const RESULTADOS = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'CONCILIACION', label: 'Conciliación' },
    { value: 'FRACASO', label: 'Fracaso' },
    { value: 'OTRA_AUDIENCIA', label: 'Se programó otra audiencia' }
]

const MODALIDADES = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'VIRTUAL', label: 'Virtual' },
    { value: 'MIXTA', label: 'Mixta' }
]

export default function EditarAudienciaPage() {
    const params = useParams()
    const router = useRouter()
    const casoId = params.casoId as string
    const audienciaId = params.audienciaId as string

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [successMessage, setSuccessMessage] = useState('')
    const [caso, setCaso] = useState<Caso | null>(null)
    const [audiencia, setAudiencia] = useState<Audiencia | null>(null)
    const [responsables, setResponsables] = useState<User[]>([])
    const [showResultModal, setShowResultModal] = useState(false)

    const [formData, setFormData] = useState<UpdateAudienciaData>({})

    useEffect(() => {
        fetchData()
    }, [casoId, audienciaId])

    const fetchData = async () => {
        try {
            setLoadingData(true)

            // Obtener información del caso
            const casoResponse = await fetch(`/api/casos/${casoId}`)
            if (casoResponse.ok) {
                const casoData = await casoResponse.json()
                setCaso(casoData)
            }

            // Obtener audiencia
            const audienciaResponse = await fetch(`/api/casos/${casoId}/audiencias/${audienciaId}`)
            if (audienciaResponse.ok) {
                const audienciaData = await audienciaResponse.json()
                setAudiencia(audienciaData)
                setFormData({
                    tipo: audienciaData.tipo,
                    fechaHora: new Date(audienciaData.fechaHora).toISOString().slice(0, 16),
                    estado: audienciaData.estado,
                    resultadoAudiencia: audienciaData.resultadoAudiencia,
                    modalidad: audienciaData.modalidad,
                    direccion: audienciaData.direccion || '',
                    enlace: audienciaData.enlace || '',
                    observaciones: audienciaData.observaciones || '',
                    resultado: audienciaData.resultado || '',
                    responsableId: audienciaData.responsable?.id
                })
            }

            // Obtener responsables
            const responsablesResponse = await fetch('/api/usuarios')
            if (responsablesResponse.ok) {
                const data = await responsablesResponse.json()
                setResponsables(data.usuarios || [])
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            setErrors({ general: 'Error de conexión' })
        } finally {
            setLoadingData(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Limpiar error del campo si existe
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setLoading(true)
            setErrors({})
            setSuccessMessage('')

            const updateData = {
                ...formData,
                ...(formData.fechaHora && { fechaHora: new Date(formData.fechaHora).toISOString() })
            }

            const response = await fetch(
                `/api/casos/${casoId}/audiencias/${audienciaId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                setErrors({ general: errorData.error || 'Error al actualizar audiencia' })
                return
            }

            setSuccessMessage('Audiencia actualizada correctamente')
            setTimeout(() => {
                router.push(`/casos/${casoId}/audiencias`)
            }, 1500)
        } catch (error: any) {
            console.error('Error al actualizar audiencia:', error)
            setErrors({ general: error.message || 'Error interno del servidor' })
        } finally {
            setLoading(false)
        }
    }

    const handleResultadoChange = async (resultado: string) => {
        try {
            setLoading(true)
            const response = await fetch(
                `/api/casos/${casoId}/audiencias/${audienciaId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        resultadoAudiencia: resultado,
                        estado: 'REALIZADA'
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                setErrors({ general: errorData.error || 'Error al actualizar resultado' })
                return
            }

            setSuccessMessage(`Resultado actualizado a: ${resultado}`)
            setTimeout(() => {
                router.push(`/casos/${casoId}/audiencias`)
            }, 1500)
        } catch (error: any) {
            console.error('Error:', error)
            setErrors({ general: error.message || 'Error al actualizar' })
        } finally {
            setLoading(false)
            setShowResultModal(false)
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

    if (!caso || !audiencia) {
        return (
            <div className="text-center py-5">
                <div className="alert alert-danger" role="alert">
                    Audiencia o caso no encontrado
                </div>
                <Link href="/casos" className="btn btn-primary">
                    Volver a Casos
                </Link>
            </div>
        )
    }

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Casos', href: '/casos' },
                    { label: caso.numeroCaso, href: `/casos/${casoId}` },
                    { label: 'Audiencias', href: `/casos/${casoId}/audiencias` },
                    { label: 'Editar' }
                ]}
            />

            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                    <Link href={`/casos/${casoId}/audiencias`} className="btn btn-outline-secondary">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="h3 fw-bold text-dark mb-0">Editar Audiencia</h1>
                        <p className="text-secondary mb-0">
                            {caso.numeroCaso} • {caso.cliente.nombre}
                        </p>
                    </div>
                </div>
            </div>

            {errors.general && (
                <div className="alert alert-danger" role="alert">
                    <AlertCircle size={16} className="me-2" />
                    {errors.general}
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success" role="alert">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Información de la Audiencia</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Tipo de Audiencia *</label>
                                    <select
                                        name="tipo"
                                        value={formData.tipo || ''}
                                        onChange={handleChange}
                                        className={`form-select ${errors.tipo ? 'is-invalid' : ''}`}
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        {TIPO_AUDIENCIAS.map(tipo => (
                                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                        ))}
                                    </select>
                                    {errors.tipo && <div className="invalid-feedback">{errors.tipo}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Fecha y Hora *</label>
                                    <input
                                        type="datetime-local"
                                        name="fechaHora"
                                        value={formData.fechaHora || ''}
                                        onChange={handleChange}
                                        className={`form-control ${errors.fechaHora ? 'is-invalid' : ''}`}
                                    />
                                    {errors.fechaHora && <div className="invalid-feedback">{errors.fechaHora}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Estado *</label>
                                    <select
                                        name="estado"
                                        value={formData.estado || ''}
                                        onChange={handleChange}
                                        className={`form-select ${errors.estado ? 'is-invalid' : ''}`}
                                    >
                                        <option value="">Seleccionar estado</option>
                                        {ESTADOS.map(estado => (
                                            <option key={estado.value} value={estado.value}>{estado.label}</option>
                                        ))}
                                    </select>
                                    {errors.estado && <div className="invalid-feedback">{errors.estado}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Resultado de la Audiencia</label>
                                    <select
                                        name="resultadoAudiencia"
                                        value={formData.resultadoAudiencia || ''}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        {RESULTADOS.map(resultado => (
                                            <option key={resultado.value} value={resultado.value}>{resultado.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Modalidad</label>
                                    <select
                                        name="modalidad"
                                        value={formData.modalidad || ''}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Seleccionar modalidad</option>
                                        {MODALIDADES.map(modalidad => (
                                            <option key={modalidad.value} value={modalidad.value}>{modalidad.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Responsable</label>
                                    <select
                                        name="responsableId"
                                        value={formData.responsableId || ''}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Seleccionar responsable</option>
                                        {responsables.map(usuario => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {usuario.nombre} {usuario.apellido}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Detalles de Localización y Observaciones</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Dirección (si es presencial)</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Ej: Calle 123 #45-67"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Enlace (si es virtual)</label>
                                    <input
                                        type="url"
                                        name="enlace"
                                        value={formData.enlace || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        value={formData.observaciones || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                        rows={4}
                                        placeholder="Información adicional sobre la audiencia"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Resultado Detallado</label>
                                    <textarea
                                        name="resultado"
                                        value={formData.resultado || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                        rows={4}
                                        placeholder="Descripción del resultado obtenido en la audiencia"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-body">
                                <button
                                    type="button"
                                    onClick={() => setShowResultModal(true)}
                                    className="btn btn-warning w-100 mb-2"
                                >
                                    Marcar Resultado Rápido
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-100"
                                >
                                    {loading ? 'Guardando...' : (
                                        <>
                                            <Save size={16} className="me-2" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Modal de Resultado Rápido */}
            {showResultModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Registrar Resultado de la Audiencia</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowResultModal(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">¿Cuál fue el resultado de la audiencia?</p>
                                <div className="d-grid gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleResultadoChange('CONCILIACION')}
                                        disabled={loading}
                                        className="btn btn-success btn-lg"
                                    >
                                        ✓ Se logró Conciliación
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleResultadoChange('FRACASO')}
                                        disabled={loading}
                                        className="btn btn-danger btn-lg"
                                    >
                                        ✗ Fracaso
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleResultadoChange('OTRA_AUDIENCIA')}
                                        disabled={loading}
                                        className="btn btn-info btn-lg"
                                    >
                                        → Se programó otra Audiencia
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowResultModal(false)}
                                        disabled={loading}
                                        className="btn btn-outline-secondary"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
