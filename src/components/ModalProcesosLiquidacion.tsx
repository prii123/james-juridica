'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PasoLiquidacion } from '@/modules/procesos-liquidacion'

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
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-bottom">
                        <div>
                            <h5 className="modal-title fw-bold">Proceso de Liquidación</h5>
                            <small className="text-secondary">
                                Progreso: {pasosCompletados} de {totalPasos} pasos completados
                            </small>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={saving}
                        />
                    </div>

                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger d-flex gap-2 mb-0" role="alert">
                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                <div>{error}</div>
                            </div>
                        ) : (
                            <div className="timeline-container">
                                {pasos.length === 0 ? (
                                    <div className="text-center py-5">
                                        <p className="text-muted">No hay pasos de liquidación disponibles</p>
                                    </div>
                                ) : (
                                    <div className="timeline">
                                        {pasos.map((paso, index) => (
                                            <div
                                                key={paso.id}
                                                className="timeline-item mb-4"
                                            >
                                                <div className="d-flex gap-3">
                                                    {/* Línea y punto de la timeline */}
                                                    <div className="timeline-marker" style={{ minWidth: '40px' }}>
                                                        <div
                                                            className={`timeline-point rounded-circle d-flex align-items-center justify-content-center`}
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: paso.completado ? '#198754' : '#e9ecef',
                                                                border: paso.completado ? 'none' : '2px solid #dee2e6',
                                                                position: 'relative',
                                                                zIndex: 2
                                                            }}
                                                        >
                                                            {paso.completado ? (
                                                                <CheckCircle2 size={24} className="text-white" />
                                                            ) : (
                                                                <span className="text-secondary fw-bold">{index + 1}</span>
                                                            )}
                                                        </div>
                                                        {index < pasos.length - 1 && (
                                                            <div
                                                                style={{
                                                                    width: '2px',
                                                                    height: '60px',
                                                                    backgroundColor: '#dee2e6',
                                                                    marginLeft: '19px',
                                                                    marginTop: '8px'
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Contenido del paso */}
                                                    <div className="flex-grow-1 pt-1">
                                                        <div className="d-flex align-items-start gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input mt-1"
                                                                id={`paso-${paso.id}`}
                                                                checked={paso.completado}
                                                                onChange={() => togglePaso(paso.id)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                            <label
                                                                htmlFor={`paso-${paso.id}`}
                                                                className="flex-grow-1"
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className={paso.completado ? 'text-decoration-line-through text-muted' : 'fw-600'}>
                                                                    {paso.nombre}
                                                                </div>
                                                                {paso.descripcion && (
                                                                    <small className="text-secondary d-block">
                                                                        {paso.descripcion}
                                                                    </small>
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
                                    <div className="mt-4 pt-3 border-top">
                                        <div className="d-flex justify-content-between mb-2">
                                            <small className="text-muted">Progreso General</small>
                                            <small className="fw-bold">
                                                {Math.round((pasosCompletados / totalPasos) * 100)}%
                                            </small>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div
                                                className="progress-bar bg-success"
                                                style={{ width: `${(pasosCompletados / totalPasos) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer border-top">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={guardarCambios}
                            disabled={saving || loading}
                        >
                            {saving ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
