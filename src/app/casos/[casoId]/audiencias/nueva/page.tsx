'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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
                await response.json()
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
                <Spinner />
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
                <div className="py-5 text-center">
                    <Alert variant="danger" className="mb-4">Caso no encontrado</Alert>
                    <Link href="/casos"><Button>Volver a Casos</Button></Link>
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

            <div className="mb-4 flex items-center gap-3">
                <Link href={`/casos/${casoId}/audiencias`}>
                    <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
                </Link>
                <div>
                    <h1 className="mb-1 text-2xl font-bold text-slate-800">Nueva Audiencia</h1>
                    <p className="mb-0 text-slate-500">{caso.numeroCaso} • {caso.cliente.nombre} {caso.cliente.apellido}</p>
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
                        {/* Información de la Audiencia */}
                        <Card>
                            <CardHeader><CardTitle>Información de la Audiencia</CardTitle></CardHeader>
                            <CardBody className="space-y-4">
                                {/* Tipo de Audiencia */}
                                <div>
                                    <Label htmlFor="tipo" className="font-semibold">Tipo de Audiencia *</Label>
                                    <Select
                                        className={cn(errors.tipo && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                                        id="tipo"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecciona un tipo</option>
                                        {TIPO_AUDIENCIAS.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </Select>
                                    {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>}
                                </div>

                                {/* Modalidad */}
                                <div>
                                    <Label htmlFor="modalidad" className="font-semibold">Modalidad *</Label>
                                    <Select id="modalidad" name="modalidad" value={formData.modalidad} onChange={handleChange}>
                                        {MODALIDADES.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </Select>
                                </div>

                                {/* Fecha y Hora */}
                                <div>
                                    <Label htmlFor="fechaHora" className="font-semibold">Fecha y Hora *</Label>
                                    <Input
                                        type="datetime-local"
                                        className={cn(errors.fechaHora && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                                        id="fechaHora"
                                        name="fechaHora"
                                        value={formData.fechaHora}
                                        onChange={handleChange}
                                    />
                                    {errors.fechaHora && <p className="mt-1 text-xs text-red-600">{errors.fechaHora}</p>}
                                </div>

                                {/* Dirección (si es presencial) */}
                                {formData.modalidad === 'PRESENCIAL' && (
                                    <div>
                                        <Label htmlFor="direccion" className="font-semibold">Dirección *</Label>
                                        <Input
                                            type="text"
                                            className={cn(errors.direccion && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                                            id="direccion"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            placeholder="Ingresa la dirección del lugar"
                                        />
                                        {errors.direccion && <p className="mt-1 text-xs text-red-600">{errors.direccion}</p>}
                                    </div>
                                )}

                                {/* Enlace (si es virtual) */}
                                {formData.modalidad === 'VIRTUAL' && (
                                    <div>
                                        <Label htmlFor="enlace" className="font-semibold">Enlace de Videollamada *</Label>
                                        <Input
                                            type="url"
                                            className={cn(errors.enlace && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
                                            id="enlace"
                                            name="enlace"
                                            value={formData.enlace}
                                            onChange={handleChange}
                                            placeholder="https://meet.google.com/..."
                                        />
                                        {errors.enlace && <p className="mt-1 text-xs text-red-600">{errors.enlace}</p>}
                                    </div>
                                )}

                                {/* Observaciones */}
                                <div>
                                    <Label htmlFor="observaciones" className="font-semibold">Observaciones (opcional)</Label>
                                    <Textarea
                                        id="observaciones"
                                        name="observaciones"
                                        rows={4}
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        placeholder="Añade notas sobre la audiencia"
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="space-y-4 lg:col-span-4">
                        {/* Responsable */}
                        <Card>
                            <CardHeader><CardTitle>Responsable</CardTitle></CardHeader>
                            <CardBody>
                                <Label htmlFor="responsableId" className="font-semibold">Selecciona Responsable *</Label>
                                <Select
                                    className={cn(errors.responsableId && 'border-red-500 focus:border-red-500 focus:ring-red-500/20')}
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
                                </Select>
                                {errors.responsableId && <p className="mt-1 text-xs text-red-600">{errors.responsableId}</p>}
                            </CardBody>
                        </Card>

                        {/* Botones de acción */}
                        <Card className="sticky top-20">
                            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                            <CardBody className="grid gap-2">
                                <Button type="submit" loading={loading} className="justify-center">
                                    {!loading && <Save size={16} />}
                                    {loading ? 'Creando...' : 'Crear Audiencia'}
                                </Button>
                                <Link href={`/casos/${casoId}/audiencias`}>
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
