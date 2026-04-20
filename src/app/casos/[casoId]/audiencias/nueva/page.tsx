'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface CreateAudienciaData {
    tipo: string
    fechaHora: string
    responsableId: string
    estado?: string
    modalidad?: string
    direccion?: string
    enlace?: string
    observaciones?: string
}

interface User {
    id: string
    nombre: string
    apellido: string
    email: string
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

const MODALIDADES = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'VIRTUAL', label: 'Virtual' },
    { value: 'MIXTA', label: 'Mixta' }
]

export default function NuevaAudienciaPage() {
    const params = useParams()
    const router = useRouter()
    const casoId = params.casoId as string

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [successMessage, setSuccessMessage] = useState('')
    const [caso, setCaso] = useState<Caso | null>(null)
    const [responsables, setResponsables] = useState<User[]>([])

    const [formData, setFormData] = useState<CreateAudienciaData>({
        tipo: 'RADICACION',
        fechaHora: new Date().toISOString().slice(0, 16),
        responsableId: '',
        modalidad: 'PRESENCIAL',
        estado: 'PROGRAMADA',
        direccion: '',
        enlace: '',
        observaciones: ''
    })

    useEffect(() => {
        fetchData()
    }, [casoId])

    const fetchData = async () => {
        try {
            setLoadingData(true)

            // Obtener información del caso
            const casoResponse = await fetch(`/api/casos/${casoId}`)
            if (casoResponse.ok) {
                const casoData = await casoResponse.json()
                setCaso(casoData)
            }

            // Obtener responsables (usuarios)
            const responsablesResponse = await fetch('/api/usuarios')

            if (responsablesResponse.ok) {
                const data = await responsablesResponse.json()
                const users = data.usuarios || []

                setResponsables(users)
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.tipo) {
            newErrors.tipo = 'El tipo de audiencia es requerido'
        }

        if (!formData.fechaHora) {
            newErrors.fechaHora = 'La fecha y hora son requeridas'
        } else {
            const selectedDate = new Date(formData.fechaHora)
            if (selectedDate < new Date()) {
                newErrors.fechaHora = 'La fecha debe ser en el futuro'
            }
        }

        if (!formData.responsableId) {
            newErrors.responsableId = 'El responsable es requerido'
        }

        if (formData.modalidad === 'VIRTUAL' && !formData.enlace) {
            newErrors.enlace = 'El enlace es requerido para audiencias virtuales'
        }

        if (formData.modalidad === 'PRESENCIAL' && !formData.direccion) {
            newErrors.direccion = 'La dirección es requerida para audiencias presenciales'
        }

        return newErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const newErrors = validateForm()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            setLoading(true)
            setErrors({})
            setSuccessMessage('')

            // Convertir fechaHora al formato correcto
            const fechaHora = new Date(formData.fechaHora).toISOString()

            const response = await fetch(`/api/casos/${casoId}/audiencias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    fechaHora
                })
            })

            if (response.ok) {
                const resultado = await response.json()
                setSuccessMessage('Audiencia creada exitosamente')
                setTimeout(() => {
                    router.push(`/casos/${casoId}/audiencias`)
                }, 1500)
            } else {
                const errorData = await response.json()
                setErrors({ general: errorData.error || 'No se pudo crear la audiencia' })
            }
        } catch (error) {
            console.error('Error:', error)
            setErrors({ general: 'Error de conexión' })
        } finally {
            setLoading(false)
        }
    }

    if (loadingData) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Casos', href: '/casos' },
                        { label: 'Audiencias', href: `/casos/${casoId}/audiencias` },
                        { label: 'Nueva Audiencia' }
                    ]}
                />
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </>
        )
    }

    if (!caso) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Casos', href: '/casos' },
                        { label: 'Audiencias', href: `/casos/${casoId}/audiencias` },
                        { label: 'Nueva Audiencia' }
                    ]}
                />
                <div className="text-center py-5">
                    <div className="alert alert-danger" role="alert">
                        Caso no encontrado
                    </div>
                    <Link href="/casos" className="btn btn-primary">
                        Volver a Casos
                    </Link>
                </div>
            </>
        )
    }

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Casos', href: '/casos' },
                    { label: caso.numeroCaso, href: `/casos/${casoId}` },
                    { label: 'Audiencias', href: `/casos/${casoId}/audiencias` },
                    { label: 'Nueva Audiencia' }
                ]}
            />

            <div className="d-flex align-items-center gap-3 mb-4">
                <Link href={`/casos/${casoId}/audiencias`} className="btn btn-outline-secondary">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="h2 fw-bold text-dark mb-1">Nueva Audiencia</h1>
                    <p className="text-secondary mb-0">{caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}</p>
                </div>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
                    <CheckCircle size={20} />
                    <div className="flex-grow-1">{successMessage}</div>
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                </div>
            )}

            {/* Mensaje de error general */}
            {errors.general && (
                <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
                    <AlertCircle size={20} />
                    <div className="flex-grow-1">{errors.general}</div>
                    <button type="button" className="btn-close" onClick={() => setErrors(prev => ({ ...prev, general: '' }))}></button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-8">
                        {/* Información de la Audiencia */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Información de la Audiencia</h5>
                            </div>
                            <div className="card-body">
                                {/* Tipo de Audiencia */}
                                <div className="mb-3">
                                    <label htmlFor="tipo" className="form-label fw-semibold">
                                        Tipo de Audiencia *
                                    </label>
                                    <select
                                        className={`form-select ${errors.tipo ? 'is-invalid' : ''}`}
                                        id="tipo"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona un tipo</option>
                                        {TIPO_AUDIENCIAS.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    {errors.tipo && (
                                        <div className="invalid-feedback d-block">
                                            {errors.tipo}
                                        </div>
                                    )}
                                </div>

                                {/* Modalidad */}
                                <div className="mb-3">
                                    <label htmlFor="modalidad" className="form-label fw-semibold">
                                        Modalidad *
                                    </label>
                                    <select
                                        className="form-select"
                                        id="modalidad"
                                        name="modalidad"
                                        value={formData.modalidad}
                                        onChange={handleChange}
                                    >
                                        {MODALIDADES.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Fecha y Hora */}
                                <div className="mb-3">
                                    <label htmlFor="fechaHora" className="form-label fw-semibold">
                                        Fecha y Hora *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className={`form-control ${errors.fechaHora ? 'is-invalid' : ''}`}
                                        id="fechaHora"
                                        name="fechaHora"
                                        value={formData.fechaHora}
                                        onChange={handleChange}
                                    />
                                    {errors.fechaHora && (
                                        <div className="invalid-feedback d-block">
                                            {errors.fechaHora}
                                        </div>
                                    )}
                                </div>

                                {/* Dirección (si es presencial) */}
                                {formData.modalidad === 'PRESENCIAL' && (
                                    <div className="mb-3">
                                        <label htmlFor="direccion" className="form-label fw-semibold">
                                            Dirección *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                                            id="direccion"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            placeholder="Ingresa la dirección del lugar"
                                        />
                                        {errors.direccion && (
                                            <div className="invalid-feedback d-block">
                                                {errors.direccion}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Enlace (si es virtual) */}
                                {formData.modalidad === 'VIRTUAL' && (
                                    <div className="mb-3">
                                        <label htmlFor="enlace" className="form-label fw-semibold">
                                            Enlace de Videollamada *
                                        </label>
                                        <input
                                            type="url"
                                            className={`form-control ${errors.enlace ? 'is-invalid' : ''}`}
                                            id="enlace"
                                            name="enlace"
                                            value={formData.enlace}
                                            onChange={handleChange}
                                            placeholder="https://meet.google.com/..."
                                        />
                                        {errors.enlace && (
                                            <div className="invalid-feedback d-block">
                                                {errors.enlace}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Observaciones */}
                                <div className="mb-0">
                                    <label htmlFor="observaciones" className="form-label fw-semibold">
                                        Observaciones (opcional)
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="observaciones"
                                        name="observaciones"
                                        rows={4}
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        placeholder="Añade notas sobre la audiencia"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        {/* Responsable */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Responsable</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label htmlFor="responsableId" className="form-label fw-semibold">
                                        Selecciona Responsable *
                                    </label>
                                    <select
                                        className={`form-select ${errors.responsableId ? 'is-invalid' : ''}`}
                                        id="responsableId"
                                        name="responsableId"
                                        value={formData.responsableId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona un responsable</option>
                                        {responsables.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.nombre} {user.apellido}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.responsableId && (
                                        <div className="invalid-feedback d-block">
                                            {errors.responsableId}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="card sticky-top" style={{ top: '80px' }}>
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
                                                Crear Audiencia
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href={`/casos/${casoId}/audiencias`}
                                        className="btn btn-outline-secondary"
                                    >
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
