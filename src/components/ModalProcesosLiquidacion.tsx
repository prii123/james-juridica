'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { PasoLiquidacion } from '@/modules/procesos-liquidacion'
import { Button, Modal, Alert, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ModalProcesosLiquidacionProps {
    isOpen: boolean
    onClose: () => void
    audienciaId: string
    casoId: string
    onProcesosCreated?: (proceso: any) => void
}

export function ModalProcesosLiquidacion({
    isOpen,
    onClose,
    audienciaId,
    casoId,
    onProcesosCreated
}: ModalProcesosLiquidacionProps) {
    const [pasos, setPasos] = useState<PasoLiquidacion[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [procesoId, setProcesoId] = useState<string | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            cargarProceso()
        }
    }, [isOpen, audienciaId])

    const cargarProceso = async () => {
        try {
            setLoading(true)
            setError('')

            // Buscar si ya existe un proceso para esta audiencia
            const response = await fetch(`/api/procesos-liquidacion?casoId=${casoId}`)
            if (!response.ok) throw new Error('Error al cargar procesos')

            const procesos = await response.json()
            const procesoExistente = procesos.find((p: any) => p.audienciaId === audienciaId)

            if (procesoExistente) {
                setPasos(procesoExistente.pasos)
                setProcesoId(procesoExistente.id)
            } else {
                // Crear nuevo proceso con pasos por defecto
                await crearNuevoProceso()
            }
        } catch (err: any) {
            console.error('Error al cargar proceso:', err)
            setError('Error al cargar el proceso de liquidación')
        } finally {
            setLoading(false)
        }
    }

    const crearNuevoProceso = async () => {
        try {
            const response = await fetch('/api/procesos-liquidacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audienciaId,
                    casoId
                })
            })

            if (!response.ok) throw new Error('Error al crear proceso')

            const proceso = await response.json()
            setPasos(proceso.pasos)
            setProcesoId(proceso.id)
            if (onProcesosCreated) onProcesosCreated(proceso)
        } catch (err: any) {
            console.error('Error al crear proceso:', err)
            setError('Error al crear el proceso de liquidación')
        }
    }

    const togglePaso = (pasoId: string) => {
        const nuevosPasos = pasos.map(paso => {
            if (paso.id === pasoId) {
                return { ...paso, completado: !paso.completado }
            }
            return paso
        })
        setPasos(nuevosPasos)
    }

    const guardarCambios = async () => {
        if (!procesoId) return

        try {
            setSaving(true)
            setError('')

            const response = await fetch(`/api/procesos-liquidacion/${procesoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pasos })
            })

            if (!response.ok) throw new Error('Error al guardar cambios')

            const procesoActualizado = await response.json()
            setPasos(procesoActualizado.pasos)
        } catch (err: any) {
            console.error('Error al guardar cambios:', err)
            setError('Error al guardar los cambios')
        } finally {
            setSaving(false)
        }
    }

    const pasosCompletados = pasos.filter(p => p.completado).length
    const totalPasos = pasos.length

    if (!isOpen) return null

    return (
        <Modal
            onClose={saving ? () => {} : onClose}
            size="lg"
            title={
                <div>
                    <div className="font-bold">Proceso de Liquidación</div>
                    <small className="font-normal text-slate-500">
                        Progreso: {pasosCompletados} de {totalPasos} pasos completados
                    </small>
                </div>
            }
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cerrar
                    </Button>
                    <Button onClick={guardarCambios} loading={saving} disabled={loading}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </>
            }
        >
            {loading ? (
                <Spinner />
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <div>
                    {pasos.length === 0 ? (
                        <div className="py-5 text-center">
                            <p className="text-slate-500">No hay pasos de liquidación disponibles</p>
                        </div>
                    ) : (
                        <div>
                            {pasos.map((paso, index) => (
                                <div key={paso.id} className="mb-4">
                                    <div className="flex gap-3">
                                        {/* Línea y punto de la timeline */}
                                        <div className="flex min-w-[40px] flex-col items-center">
                                            <div
                                                className={cn(
                                                    'relative z-[2] flex h-10 w-10 items-center justify-center rounded-full',
                                                    paso.completado ? 'bg-teal-600' : 'border-2 border-slate-200 bg-slate-100'
                                                )}
                                            >
                                                {paso.completado ? (
                                                    <CheckCircle2 size={24} className="text-white" />
                                                ) : (
                                                    <span className="font-bold text-slate-500">{index + 1}</span>
                                                )}
                                            </div>
                                            {index < pasos.length - 1 && (
                                                <div className="mt-2 w-0.5 flex-1 bg-slate-200" style={{ minHeight: '40px' }} />
                                            )}
                                        </div>

                                        {/* Contenido del paso */}
                                        <div className="flex-1 pt-1">
                                            <div className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 h-4 w-4 cursor-pointer accent-teal-600"
                                                    id={`paso-${paso.id}`}
                                                    checked={paso.completado}
                                                    onChange={() => togglePaso(paso.id)}
                                                />
                                                <label htmlFor={`paso-${paso.id}`} className="flex-1 cursor-pointer">
                                                    <div className={paso.completado ? 'text-slate-400 line-through' : 'font-semibold text-slate-800'}>
                                                        {paso.nombre}
                                                    </div>
                                                    {paso.descripcion && (
                                                        <small className="block text-slate-500">{paso.descripcion}</small>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Barra de progreso */}
                    {totalPasos > 0 && (
                        <div className="mt-4 border-t border-slate-200 pt-3">
                            <div className="mb-2 flex justify-between">
                                <small className="text-slate-500">Progreso General</small>
                                <small className="font-bold text-slate-700">
                                    {Math.round((pasosCompletados / totalPasos) * 100)}%
                                </small>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-teal-600 transition-all"
                                    style={{ width: `${(pasosCompletados / totalPasos) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}
