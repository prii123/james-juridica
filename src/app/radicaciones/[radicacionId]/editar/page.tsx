'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, AlertCircle, CheckCircle, X } from 'lucide-react'
import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'

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
                <Spinner />
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

            <div className="mb-4 flex items-center gap-3">
                <Link href={`/radicaciones/${radicacionId}`}>
                    <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
                </Link>
                <div>
                    <h1 className="mb-1 text-2xl font-bold text-slate-800">Editar Conciliación</h1>
                    <p className="mb-0 text-slate-500">{formData.numero}</p>
                </div>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
                <Alert variant="success" className="mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><CheckCircle size={20} />{successMessage}</span>
                    <button type="button" onClick={() => setSuccessMessage('')}><X size={16} /></button>
                </Alert>
            )}

            {/* Mensaje de error general */}
            {errors.general && (
                <Alert variant="danger" className="mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><AlertCircle size={20} />{errors.general}</span>
                    <button type="button" onClick={() => setErrors(prev => ({ ...prev, general: '' }))}><X size={16} /></button>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        {/* Información de Conciliación */}
                        <Card>
                            <CardHeader><CardTitle>Información de la Conciliación</CardTitle></CardHeader>
                            <CardBody className="space-y-4">
                                {/* Número de Conciliación */}
                                <div>
                                    <Label htmlFor="numero" className="font-semibold">Número de Conciliación</Label>
                                    <Input
                                        type="text"
                                        id="numero"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        disabled
                                    />
                                    {errors.numero && <p className="mt-1 text-xs text-red-600">{errors.numero}</p>}
                                </div>

                                {/* Demandante */}
                                <div>
                                    <Label htmlFor="demandante" className="font-semibold">Insolvente</Label>
                                    <Input
                                        type="text"
                                        id="demandante"
                                        name="demandante"
                                        value={formData.demandante}
                                        onChange={handleChange}
                                        placeholder="Nombre del insolvente"
                                    />
                                    {errors.demandante && <p className="mt-1 text-xs text-red-600">{errors.demandante}</p>}
                                </div>

                                {/* Demandado */}
                                <div>
                                    <Label htmlFor="demandado" className="font-semibold">Centro de Conciliación</Label>
                                    <Input
                                        type="text"
                                        id="demandado"
                                        name="demandado"
                                        value={formData.demandado}
                                        onChange={handleChange}
                                        placeholder="Nombre del centro de conciliación"
                                    />
                                    {errors.demandado && <p className="mt-1 text-xs text-red-600">{errors.demandado}</p>}
                                </div>

                                {/* Fechas */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="fechaSolicitud" className="font-semibold">Fecha de Solicitud</Label>
                                        <Input
                                            type="date"
                                            id="fechaSolicitud"
                                            name="fechaSolicitud"
                                            value={formData.fechaSolicitud}
                                            onChange={handleChange}
                                        />
                                        {errors.fechaSolicitud && <p className="mt-1 text-xs text-red-600">{errors.fechaSolicitud}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="fechaAudiencia" className="font-semibold">Fecha de Audiencia (opcional)</Label>
                                        <Input
                                            type="date"
                                            id="fechaAudiencia"
                                            name="fechaAudiencia"
                                            value={formData.fechaAudiencia || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Estado */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="estado" className="font-semibold">Estado</Label>
                                        <Select
                                            id="estado"
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                        >
                                            <option value="SOLICITADA">Solicitada</option>
                                            <option value="PROGRAMADA">Programada</option>
                                            <option value="REALIZADA">Realizada</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </Select>
                                    </div>
                                    {formData.estado === 'REALIZADA' && (
                                        <div>
                                            <Label htmlFor="resultado" className="font-semibold">Resultado</Label>
                                            <Select
                                                id="resultado"
                                                name="resultado"
                                                value={formData.resultado || ''}
                                                onChange={handleChange}
                                            >
                                                <option value="">Selecciona un resultado</option>
                                                <option value="ACUERDO_TOTAL">Acuerdo Total</option>
                                                <option value="ACUERDO_PARCIAL">Acuerdo Parcial</option>
                                                <option value="SIN_ACUERDO">Sin Acuerdo</option>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div>
                                    <Label htmlFor="observaciones" className="font-semibold">Observaciones (opcional)</Label>
                                    <Textarea
                                        id="observaciones"
                                        name="observaciones"
                                        rows={4}
                                        value={formData.observaciones || ''}
                                        onChange={handleChange}
                                        placeholder="Añade observaciones sobre la conciliación"
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="lg:col-span-4">
                        {/* Botones de acción */}
                        <Card className="sticky top-20">
                            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                            <CardBody className="grid gap-2">
                                <Button type="submit" loading={loading} className="justify-center">
                                    {!loading && <Save size={16} />}
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Link href={`/radicaciones/${radicacionId}`}>
                                    <Button type="button" variant="outline" className="w-full justify-center">Cancelar</Button>
                                </Link>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </form>
        </>
    )
}
