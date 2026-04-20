'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'

interface UpdateRadicacionData {
    numero: string
    demandante: string
    demandado: string
    estado: EstadoRadicacion
    resultado?: ResultadoRadicacion
    fechaSolicitud: string
    fechaAudiencia?: string
    observaciones?: string
}

export default function EditarRadicacionPage() {
    const params = useParams()
    const router = useRouter()
    const radicacionId = params.radicacionId as string

    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [successMessage, setSuccessMessage] = useState('')
    const [formData, setFormData] = useState<UpdateRadicacionData>({
        numero: '',
        demandante: '',
        demandado: '',
        estado: 'SOLICITADA',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        fechaAudiencia: '',
        observaciones: ''
    })

    useEffect(() => {
        if (radicacionId) {
            fetchRadicacion()
        }
    }, [radicacionId])

    const fetchRadicacion = async () => {
        try {
            setLoadingData(true)
            const response = await fetch(`/api/radicaciones/${radicacionId}`)

            if (response.ok) {
                const data = await response.json()
                setFormData({
                    numero: data.numero || '',
                    demandante: data.demandante || '',
                    demandado: data.demandado || '',
                    estado: data.estado || 'SOLICITADA',
                    resultado: data.resultado,
                    fechaSolicitud: data.fechaSolicitud?.split('T')[0] || '',
                    fechaAudiencia: data.fechaAudiencia?.split('T')[0] || '',
                    observaciones: data.observaciones || ''
                })
            } else {
                setErrors({ general: 'No se pudo cargar la conciliación' })
            }
        } catch (error) {
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

        if (!formData.numero.trim()) {
            newErrors.numero = 'El número de conciliación es requerido'
        }

        if (!formData.demandante.trim()) {
            newErrors.demandante = 'El insolvente es requerido'
        }

        if (!formData.demandado.trim()) {
            newErrors.demandado = 'El centro de conciliación es requerido'
        }

        if (!formData.fechaSolicitud) {
            newErrors.fechaSolicitud = 'La fecha de solicitud es requerida'
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

            const response = await fetch(`/api/radicaciones/${radicacionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setSuccessMessage('Conciliación actualizada exitosamente')
                setTimeout(() => {
                    router.push(`/radicaciones/${radicacionId}`)
                }, 1500)
            } else {
                const errorData = await response.json()
                setErrors({ general: errorData.error || 'No se pudo actualizar la conciliación' })
            }
        } catch (error) {
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
                        { label: 'Radicaciones', href: '/radicaciones' },
                        { label: 'Editar Conciliación' }
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

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Radicaciones', href: '/radicaciones' },
                    { label: 'Editar Conciliación' }
                ]}
            />

            <div className="d-flex align-items-center gap-3 mb-4">
                <Link href={`/radicaciones/${radicacionId}`} className="btn btn-outline-secondary">
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="h2 fw-bold text-dark mb-1">Editar Conciliación</h1>
                    <p className="text-secondary mb-0">{formData.numero}</p>
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
                        {/* Información de Conciliación */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Información de la Conciliación</h5>
                            </div>
                            <div className="card-body">
                                {/* Número de Conciliación */}
                                <div className="mb-3">
                                    <label htmlFor="numero" className="form-label fw-semibold">
                                        Número de Conciliación
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.numero ? 'is-invalid' : ''}`}
                                        id="numero"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        disabled
                                    />
                                    {errors.numero && (
                                        <div className="invalid-feedback d-block">
                                            {errors.numero}
                                        </div>
                                    )}
                                </div>

                                {/* Demandante */}
                                <div className="mb-3">
                                    <label htmlFor="demandante" className="form-label fw-semibold">
                                        Insolvente
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.demandante ? 'is-invalid' : ''}`}
                                        id="demandante"
                                        name="demandante"
                                        value={formData.demandante}
                                        onChange={handleChange}
                                        placeholder="Nombre del insolvente"
                                    />
                                    {errors.demandante && (
                                        <div className="invalid-feedback d-block">
                                            {errors.demandante}
                                        </div>
                                    )}
                                </div>

                                {/* Demandado */}
                                <div className="mb-3">
                                    <label htmlFor="demandado" className="form-label fw-semibold">
                                        Centro de Conciliación
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.demandado ? 'is-invalid' : ''}`}
                                        id="demandado"
                                        name="demandado"
                                        value={formData.demandado}
                                        onChange={handleChange}
                                        placeholder="Nombre del centro de conciliación"
                                    />
                                    {errors.demandado && (
                                        <div className="invalid-feedback d-block">
                                            {errors.demandado}
                                        </div>
                                    )}
                                </div>

                                {/* Fechas */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="fechaSolicitud" className="form-label fw-semibold">
                                                Fecha de Solicitud
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.fechaSolicitud ? 'is-invalid' : ''}`}
                                                id="fechaSolicitud"
                                                name="fechaSolicitud"
                                                value={formData.fechaSolicitud}
                                                onChange={handleChange}
                                            />
                                            {errors.fechaSolicitud && (
                                                <div className="invalid-feedback d-block">
                                                    {errors.fechaSolicitud}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="fechaAudiencia" className="form-label fw-semibold">
                                                Fecha de Audiencia (opcional)
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="fechaAudiencia"
                                                name="fechaAudiencia"
                                                value={formData.fechaAudiencia || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Estado */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="estado" className="form-label fw-semibold">
                                                Estado
                                            </label>
                                            <select
                                                className="form-select"
                                                id="estado"
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleChange}
                                            >
                                                <option value="SOLICITADA">Solicitada</option>
                                                <option value="PROGRAMADA">Programada</option>
                                                <option value="REALIZADA">Realizada</option>
                                                <option value="CANCELADA">Cancelada</option>
                                            </select>
                                        </div>
                                    </div>
                                    {formData.estado === 'REALIZADA' && (
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="resultado" className="form-label fw-semibold">
                                                    Resultado
                                                </label>
                                                <select
                                                    className="form-select"
                                                    id="resultado"
                                                    name="resultado"
                                                    value={formData.resultado || ''}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Selecciona un resultado</option>
                                                    <option value="ACUERDO_TOTAL">Acuerdo Total</option>
                                                    <option value="ACUERDO_PARCIAL">Acuerdo Parcial</option>
                                                    <option value="SIN_ACUERDO">Sin Acuerdo</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                        value={formData.observaciones || ''}
                                        onChange={handleChange}
                                        placeholder="Añade observaciones sobre la conciliación"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
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
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href={`/radicaciones/${radicacionId}`}
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
