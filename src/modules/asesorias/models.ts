/**
 * Modelos y Lógica de Dominio - Asesorías
 */

import { EstadoAsesoria, ResultadoAsesoria, TipoAsesoria } from '@prisma/client'
import { BusinessError, NotFoundError } from '@/lib/api-errors'
import { AsesoriaResponse } from './types'

/**
 * Error cuando una asesoría no existe
 */
export class AsesoriaNoEncontradaError extends NotFoundError {
  constructor(id: string) {
    super(`Asesoría ${id}`)
  }
}

/**
 * Error cuando hay violación de regla de negocio
 */
export class AsesoriaBusinessError extends BusinessError {
  constructor(message: string, code: string) {
    super(message, code)
  }
}

/**
 * Mapea una entidad Asesoría a un DTO para respuesta.
 * La entidad Prisma usa: tipo, fecha, asesorId, asesor, lead
 * El DTO usa:           tipoAsesoria, fechaProgramada, abogadoId, abogado, lead
 */
export function mapearAsesoriaParaRespuesta(asesorias: any): AsesoriaResponse {
  return {
    id: asesorias.id,
    leadId: asesorias.leadId,
    // La columna Prisma se llama "tipo", el DTO la expone como "tipoAsesoria"
    tipoAsesoria: asesorias.tipoAsesoria ?? asesorias.tipo,
    estado: asesorias.estado,
    resultado: asesorias.resultado,
    // La columna Prisma se llama "fecha", el DTO la expone como "fechaProgramada"
    fechaProgramada: asesorias.fechaProgramada ?? asesorias.fecha,
    fechaRealizada: asesorias.fechaRealizada,
    descripcion: asesorias.descripcion,
    notas: asesorias.notas,
    observaciones: asesorias.observaciones,
    // La columna Prisma se llama "asesorId", el DTO la expone como "abogadoId"
    abogadoId: asesorias.abogadoId ?? asesorias.asesorId,
    abogado: asesorias.asesor ? {
      id: asesorias.asesor.id,
      nombre: asesorias.asesor.nombre,
      apellido: asesorias.asesor.apellido ?? '',
      email: asesorias.asesor.email ?? '',
    } : asesorias.abogado ? {
      id: asesorias.abogado.id,
      nombre: asesorias.abogado.nombre,
      apellido: asesorias.abogado.apellido ?? '',
      email: asesorias.abogado.email ?? '',
    } : undefined,
    lead: asesorias.lead ? {
      id: asesorias.lead.id,
      nombre: asesorias.lead.nombre,
      email: asesorias.lead.email,
      telefono: asesorias.lead.telefono,
    } : undefined,
    creadoPorId: asesorias.creadoPorId,
    creadoPor: asesorias.creadoPor ? {
      id: asesorias.creadoPor.id,
      nombre: asesorias.creadoPor.nombre,
      apellido: asesorias.creadoPor.apellido,
    } : undefined,
    createdAt: asesorias.createdAt,
    updatedAt: asesorias.updatedAt,
  }
}

/**
 * Valida si una asesoría puede cambiar de estado
 * Retorna las transiciones válidas según el estado actual
 */
export function validarCambioEstado(
  estadoActual: EstadoAsesoria,
  estadoNuevo: EstadoAsesoria,
): boolean {
  const transicionesValidas: Record<EstadoAsesoria, EstadoAsesoria[]> = {
    PROGRAMADA: ['REALIZADA', 'CANCELADA', 'REPROGRAMADA'],
    REALIZADA: ['CANCELADA'],
    CANCELADA: ['PROGRAMADA'],
    REPROGRAMADA: ['REALIZADA', 'CANCELADA'],
  }

  return transicionesValidas[estadoActual]?.includes(estadoNuevo) ?? false
}

/**
 * Valida si una asesoría puede ser realizada
 */
export function validarPuedeRealizarAsesoria(asesorias: any): boolean {
  if (asesorias.estado !== 'PROGRAMADA' && asesorias.estado !== 'REPROGRAMADA') {
    throw new AsesoriaBusinessError(
      `No se puede realizar una asesoría que está en estado ${asesorias.estado}`,
      'ASESORIAS_NO_PROGRAMADA'
    )
  }

  return true
}

/**
 * Valida si una asesoría puede ser cancelada
 */
export function validarPuedeCancelarAsesoria(asesorias: any): boolean {
  if (asesorias.estado === 'CANCELADA') {
    throw new AsesoriaBusinessError(
      'Esta asesoría ya está cancelada',
      'ASESORIAS_YA_CANCELADA'
    )
  }

  return true
}

/**
 * Valida si una asesoría puede ser reprogramada
 */
export function validarPuedeReprogramarAsesoria(asesorias: any): boolean {
  const estadosPermitidos: EstadoAsesoria[] = ['PROGRAMADA', 'REPROGRAMADA']
  if (!estadosPermitidos.includes(asesorias.estado)) {
    throw new AsesoriaBusinessError(
      `No se puede reprogramar una asesoría que está en estado ${asesorias.estado}`,
      'ASESORIAS_NO_REPROGRAMABLE'
    )
  }

  return true
}

/**
 * Calcula el tiempo desde la programación hasta realización
 */
export function calcularTiempoEjecucion(
  fechaProgramada: Date,
  fechaRealizada: Date | null,
): number | null {
  if (!fechaRealizada) return null
  return Math.floor(
    (fechaRealizada.getTime() - fechaProgramada.getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Determina si una asesoría está próxima a su fecha
 */
export function estaPróximaAsesoria(
  fechaProgramada: Date,
  diasParaAlerta: number = 3,
): boolean {
  const ahora = new Date()
  const diferencia = fechaProgramada.getTime() - ahora.getTime()
  const diasRestantes = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  return diasRestantes > 0 && diasRestantes <= diasParaAlerta
}

/**
 * Determina si una asesoría está vencida (no se realizó)
 */
export function estaVencidaAsesoria(
  asesorias: any,
  diasTolerancia: number = 0,
): boolean {
  if (asesorias.estado === 'REALIZADA' || asesorias.estado === 'CANCELADA') {
    return false
  }

  const ahora = new Date()
  const fecha = new Date(asesorias.fechaProgramada)
  fecha.setDate(fecha.getDate() + diasTolerancia)

  return ahora > fecha
}

/**
 * Genera descripción para cambio de estado
 */
export function generarDescripcionCambioEstado(
  estadoAnterior: EstadoAsesoria,
  estadoNuevo: EstadoAsesoria,
): string {
  const descripciones: Record<string, string> = {
    'PROGRAMADA_REALIZADA': 'Asesoría realizada exitosamente',
    'PROGRAMADA_CANCELADA': 'Asesoría cancelada',
    'PROGRAMADA_REPROGRAMADA': 'Asesoría reprogramada',
    'REALIZADA_CANCELADA': 'Realización de asesoría cancelada',
    'CANCELADA_PROGRAMADA': 'Asesoría reprogramada',
    'REPROGRAMADA_REALIZADA': 'Asesoría reprogramada y realizada',
    'REPROGRAMADA_CANCELADA': 'Asesoría reprogramada cancelada',
  }

  const clave = `${estadoAnterior}_${estadoNuevo}`
  return descripciones[clave] || `Cambio de estado de ${estadoAnterior} a ${estadoNuevo}`
}

/**
 * Calcula el porcentaje de éxito de asesorías
 */
export function calcularTazaExito(
  exitosas: number,
  total: number,
): number {
  if (total === 0) return 0
  return Math.round((exitosas / total) * 100)
}

/**
 * Determina si debería enviarse una notificación de asesoría próxima
 */
export function debeNotificarAsesoriaPróxima(
  asesorias: any,
  diasAntes: number = 3,
): boolean {
  if (asesorias.estado !== 'PROGRAMADA') {
    return false
  }

  return estaPróximaAsesoria(asesorias.fechaProgramada, diasAntes)
}

/**
 * Determina el tipo de seguimiento necesario después de asesoría
 */
export function determinarSeguimientoNecesario(
  resultado: ResultadoAsesoria | null,
): string | null {
  const seguimientos: Record<ResultadoAsesoria, string> = {
    EXITOSA: 'conversion',
    RECHAZADA: 'follow_up_personalizado',
  }

  return resultado ? seguimientos[resultado] : null
}
