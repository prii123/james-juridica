'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardBody, Input, Select, Textarea, Label, Alert, Spinner, Modal } from '@/components/ui'

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
        return <Spinner />
    }

    if (!caso || !audiencia) {
        return (
            <div className="py-5 text-center">
                <Alert variant="danger" className="mb-4">Audiencia o caso no encontrado</Alert>
                <Link href="/casos"><Button>Volver a Casos</Button></Link>
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

            <div className="mb-4 flex items-center gap-3">
                <Link href={`/casos/${casoId}/audiencias`}>
                    <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
                </Link>
                <div>
                    <h1 className="mb-0 text-xl font-bold text-slate-800">Editar Audiencia</h1>
                    <p className="mb-0 text-slate-500">{caso.numeroCaso} • {caso.cliente.nombre}</p>
                </div>
            </div>

            {errors.general && (
                <Alert variant="danger" className="mb-4">
                    <span className="flex items-center gap-2"><AlertCircle size={16} />{errors.general}</span>
                </Alert>
            )}

            {successMessage && (
                <Alert variant="success" className="mb-4">{successMessage}</Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Información de la Audiencia</CardTitle></CardHeader>
                        <CardBody className="space-y-4">
                            <div>
                                <Label>Tipo de Audiencia *</Label>
                                <Select name="tipo" value={formData.tipo || ''} onChange={handleChange}>
                                    <option value="">Seleccionar tipo</option>
                                    {TIPO_AUDIENCIAS.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Fecha y Hora *</Label>
                                <Input
                                    type="datetime-local"
                                    name="fechaHora"
                                    value={formData.fechaHora || ''}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Label>Estado *</Label>
                                <Select name="estado" value={formData.estado || ''} onChange={handleChange}>
                                    <option value="">Seleccionar estado</option>
                                    {ESTADOS.map(estado => (
                                        <option key={estado.value} value={estado.value}>{estado.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Resultado de la Audiencia</Label>
                                <Select name="resultadoAudiencia" value={formData.resultadoAudiencia || ''} onChange={handleChange}>
                                    {RESULTADOS.map(resultado => (
                                        <option key={resultado.value} value={resultado.value}>{resultado.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Modalidad</Label>
                                <Select name="modalidad" value={formData.modalidad || ''} onChange={handleChange}>
                                    <option value="">Seleccionar modalidad</option>
                                    {MODALIDADES.map(modalidad => (
                                        <option key={modalidad.value} value={modalidad.value}>{modalidad.label}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label>Responsable</Label>
                                <Select name="responsableId" value={formData.responsableId || ''} onChange={handleChange}>
                                    <option value="">Seleccionar responsable</option>
                                    {responsables.map(usuario => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.nombre} {usuario.apellido}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Detalles de Localización y Observaciones</CardTitle></CardHeader>
                            <CardBody className="space-y-4">
                                <div>
                                    <Label>Dirección (si es presencial)</Label>
                                    <Input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion || ''}
                                        onChange={handleChange}
                                        placeholder="Ej: Calle 123 #45-67"
                                    />
                                </div>

                                <div>
                                    <Label>Enlace (si es virtual)</Label>
                                    <Input
                                        type="url"
                                        name="enlace"
                                        value={formData.enlace || ''}
                                        onChange={handleChange}
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>

                                <div>
                                    <Label>Observaciones</Label>
                                    <Textarea
                                        name="observaciones"
                                        value={formData.observaciones || ''}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Información adicional sobre la audiencia"
                                    />
                                </div>

                                <div>
                                    <Label>Resultado Detallado</Label>
                                    <Textarea
                                        name="resultado"
                                        value={formData.resultado || ''}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Descripción del resultado obtenido en la audiencia"
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="grid gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowResultModal(true)}
                                    className="justify-center bg-amber-500 hover:bg-amber-600"
                                >
                                    Marcar Resultado Rápido
                                </Button>
                                <Button type="submit" loading={loading} className="justify-center">
                                    {!loading && <Save size={16} />}
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </form>

            {/* Modal de Resultado Rápido */}
            {showResultModal && (
                <Modal onClose={() => setShowResultModal(false)} title="Registrar Resultado de la Audiencia">
                    <p className="mb-3">¿Cuál fue el resultado de la audiencia?</p>
                    <div className="grid gap-2">
                        <Button
                            variant="success"
                            size="lg"
                            className="justify-center"
                            onClick={() => handleResultadoChange('CONCILIACION')}
                            disabled={loading}
                        >
                            ✓ Se logró Conciliación
                        </Button>
                        <Button
                            variant="danger"
                            size="lg"
                            className="justify-center"
                            onClick={() => handleResultadoChange('FRACASO')}
                            disabled={loading}
                        >
                            ✗ Fracaso
                        </Button>
                        <Button
                            size="lg"
                            className="justify-center bg-sky-600 hover:bg-sky-700"
                            onClick={() => handleResultadoChange('OTRA_AUDIENCIA')}
                            disabled={loading}
                        >
                            → Se programó otra Audiencia
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-center"
                            onClick={() => setShowResultModal(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    )
}
