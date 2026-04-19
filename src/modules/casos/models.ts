/**
 * Capa de Modelos - Casos
 * 
 * Responsabilidades:
 * - Validaciones complejas de reglas de negocio
 * - Transformación y mapeo de datos
 * - DTOs (Data Transfer Objects)
 * - Lógica de cálculos específicos del dominio
 * - Composición de valores complejos
 */

import { EstadoCaso, Prioridad, TipoInsolvencia } from '@prisma/client'
import { CasoWithRelations } from './types'

/**
 * Errores de negocio específicos del módulo
 */
export class CasoError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 422,
  ) {
    super(message)
    this.name = 'CasoError'
  }
}

export class CasoNoEncontradoError extends CasoError {
  constructor(id: string) {
    super(`Caso con ID ${id} no encontrado`, 'CASO_NO_ENCONTRADO', 404)
  }
}

export class CasoConRelacionesError extends CasoError {
  constructor(relaciones: string[]) {
    super(
      `No se puede eliminar un caso que tiene ${relaciones.join(', ')} asociados`,
      'CASO_CON_RELACIONES',
      422
    )
  }
}

export class ClienteNoEncontradoError extends CasoError {
  constructor(clienteId: string) {
    super(`Cliente con ID ${clienteId} no encontrado`, 'CLIENTE_NO_ENCONTRADO', 404)
  }
}

export class ResponsableNoEncontradoError extends CasoError {
  constructor(responsableId: string) {
    super(`Responsable con ID ${responsableId} no encontrado`, 'RESPONSABLE_NO_ENCONTRADO', 404)
  }
}

export class CasoDuplicadoError extends CasoError {
  constructor(clienteId: string, tipoInsolvencia: TipoInsolvencia) {
    super(
      `Ya existe un caso activo para este cliente con el tipo de insolvencia ${tipoInsolvencia}`,
      'CASO_DUPLICADO',
      422
    )
  }
}

/**
 * DTO de respuesta para un caso
 * Mapea la entidad de base de datos a un formato seguro para enviar al cliente
 */
export interface CasoResponseDTO {
  id: string
  numeroCaso: string
  estado: EstadoCaso
  tipoInsolvencia: TipoInsolvencia
  prioridad: Prioridad
  fechaInicio: Date
  fechaCierre?: Date | null
  observaciones?: string | null
  
  clienteId: string
  cliente?: {
    id: string
    nombre: string
    apellido?: string | null
    documento: string
    email: string
    telefono: string
  }
  
  responsableId: string
  responsable?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  
  creadoPorId: string
  creadoPor?: {
    id: string
    nombre: string
    apellido: string
  }
  
  conteos?: {
    documentos: number
    actuaciones: number
    audiencias: number
    honorarios: number
  }
  
  createdAt: Date
  updatedAt: Date
}

/**
 * Mapea una entidad Caso a un DTO para respuesta HTTP
 */
export function mapearCasoParaRespuesta(caso: CasoWithRelations): CasoResponseDTO {
  return {
    id: caso.id,
    numeroCaso: caso.numeroCaso,
    estado: caso.estado,
    tipoInsolvencia: caso.tipoInsolvencia,
    prioridad: caso.prioridad,
    fechaInicio: caso.fechaInicio,
    fechaCierre: caso.fechaCierre,
    observaciones: caso.observaciones,
    clienteId: caso.clienteId,
    cliente: caso.cliente ? {
      id: caso.cliente.id,
      nombre: caso.cliente.nombre,
      apellido: caso.cliente.apellido,
      documento: caso.cliente.documento,
      email: caso.cliente.email,
      telefono: caso.cliente.telefono,
    } : undefined,
    responsableId: caso.responsableId,
    responsable: caso.responsable ? {
      id: caso.responsable.id,
      nombre: caso.responsable.nombre,
      apellido: caso.responsable.apellido,
      email: caso.responsable.email,
    } : undefined,
    creadoPorId: caso.creadoPorId,
    creadoPor: caso.creadoPor ? {
      id: caso.creadoPor.id,
      nombre: caso.creadoPor.nombre,
      apellido: caso.creadoPor.apellido,
    } : undefined,
    conteos: caso._count ? {
      documentos: caso._count.documentos,
      actuaciones: caso._count.actuaciones,
      audiencias: caso._count.audiencias,
      honorarios: caso._count.honorarios,
    } : undefined,
    createdAt: caso.createdAt,
    updatedAt: caso.updatedAt,
  }
}

/**
 * Valida si un caso puede ser eliminado
 * Retorna array de relaciones si no puede ser eliminado
 */
export function validarPuedeEliminarCaso(caso: CasoWithRelations): string[] {
  const relacionesPresentes: string[] = []

  if (caso._count) {
    if (caso._count.documentos > 0) relacionesPresentes.push('documentos')
    if (caso._count.actuaciones > 0) relacionesPresentes.push('actuaciones')
    if (caso._count.audiencias > 0) relacionesPresentes.push('audiencias')
    if (caso._count.honorarios > 0) relacionesPresentes.push('honorarios')
  }

  return relacionesPresentes
}

/**
 * Valida si un caso puede ser cerrado
 */
export function validarPuedeCerrarCaso(caso: CasoWithRelations): boolean {
  // Un caso solo puede ser cerrado si está activo
  if (caso.estado !== 'ACTIVO') {
    throw new CasoError(
      `No se puede cerrar un caso que está en estado ${caso.estado}`,
      'CASO_NO_ACTIVO',
      422
    )
  }

  return true
}

/**
 * Valida si un caso puede ser reactivado
 */
export function validarPuedeReactivarCaso(caso: CasoWithRelations): boolean {
  // Un caso solo puede ser reactivado si fue cerrado
  if (caso.estado !== 'CERRADO') {
    throw new CasoError(
      `No se puede reactivar un caso que está en estado ${caso.estado}`,
      'CASO_NO_CERRADO',
      422
    )
  }

  return true
}

/**
 * Normaliza los datos de entrada para crear un caso
 */
export function normalizarDatosCrearCaso(data: any) {
  return {
    ...data,
    observaciones: data.observaciones?.trim() || undefined,
  }
}

/**
 * Normaliza los datos de entrada para actualizar un caso
 */
export function normalizarDatosActualizarCaso(data: any) {
  const normalized: any = {}

  Object.entries(data).forEach(([key, value]) => {
    if (value === null) {
      // Permitir null para campos opcionales
      normalized[key] = value
    } else if (typeof value === 'string') {
      // Trim de strings
      normalized[key] = value.trim() || undefined
    } else {
      normalized[key] = value
    }
  })

  return normalized
}

/**
 * Genera una descripción del cambio de estado para auditoría
 */
export function generarDescripcionCambioEstado(
  estadoAnterior: EstadoCaso,
  estadoNuevo: EstadoCaso,
): string {
  const transiciones: Record<string, Record<string, string>> = {
    ACTIVO: {
      CERRADO: 'Caso cerrado',
      SUSPENDIDO: 'Caso suspendido',
      ARCHIVADO: 'Caso archivado',
    },
    CERRADO: {
      ACTIVO: 'Caso reactivado',
      ARCHIVADO: 'Caso archivado',
    },
    SUSPENDIDO: {
      ACTIVO: 'Caso reactivado',
      ARCHIVADO: 'Caso archivado',
    },
    ARCHIVADO: {
      ACTIVO: 'Caso desarchivado',
    },
  }

  return transiciones[estadoAnterior]?.[estadoNuevo] || 
         `Cambio de estado de ${estadoAnterior} a ${estadoNuevo}`
}

/**
 * Determina si dos casos son duplicados
 * Dos casos son duplicados si pertenecen al mismo cliente, 
 * tienen el mismo tipo de insolvencia y ambos están activos
 */
export function sonCasosDuplicados(
  caso1: CasoWithRelations,
  caso2: CasoWithRelations,
): boolean {
  return (
    caso1.clienteId === caso2.clienteId &&
    caso1.tipoInsolvencia === caso2.tipoInsolvencia &&
    caso1.estado === 'ACTIVO' &&
    caso2.estado === 'ACTIVO'
  )
}

/**
 * Calcula el tiempo transcurrido desde la creación del caso
 */
export function calcularTiempoTranscurrido(fechaInicio: Date): {
  dias: number
  semanas: number
  meses: number
} {
  const ahora = new Date()
  const diferencia = ahora.getTime() - fechaInicio.getTime()
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
  const semanas = Math.floor(dias / 7)
  const meses = Math.floor(dias / 30)

  return { dias, semanas, meses }
}

/**
 * Determina si un caso está próximo a vencer (sin actividad por X días)
 */
export function estaCasoProximoAVencer(
  fechaActualizacion: Date,
  diasParaAlerta: number = 30,
): boolean {
  const ahora = new Date()
  const diferencia = ahora.getTime() - fechaActualizacion.getTime()
  const diasSinActividad = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  return diasSinActividad >= diasParaAlerta
}
