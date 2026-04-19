/**
 * Modelos y Lógica de Dominio - Seguimiento
 */

import { NotFoundError, BusinessError } from '@/lib/api-errors'
import { SeguimientoResponse } from './types'

export class SeguimientoNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Seguimiento ${id}`)
  }
}

export class LeadNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Lead ${id}`)
  }
}

/**
 * Mapea entidad a DTO
 */
export function mapearSeguimientoParaRespuesta(seguimiento: any): SeguimientoResponse {
  return {
    id: seguimiento.id,
    tipo: seguimiento.tipo,
    descripcion: seguimiento.descripcion,
    duracion: seguimiento.duracion,
    resultado: seguimiento.resultado,
    proximoSeguimiento: seguimiento.proximoSeguimiento,
    fecha: seguimiento.fecha,
    leadId: seguimiento.leadId,
    usuarioId: seguimiento.usuarioId,
    usuario: seguimiento.usuario ? {
      id: seguimiento.usuario.id,
      nombre: seguimiento.usuario.nombre,
      apellido: seguimiento.usuario.apellido,
    } : undefined,
    createdAt: seguimiento.createdAt,
    updatedAt: seguimiento.updatedAt,
  }
}

/**
 * Valida que los datos sean consistentes
 */
export function validarIntegridad(datos: any): void {
  if (!datos.tipo) {
    throw new BusinessError('Tipo de seguimiento es requerido', 'TIPO_REQUERIDO')
  }
  if (!datos.descripcion || datos.descripcion.trim().length === 0) {
    throw new BusinessError('Descripción es requerida', 'DESCRIPCION_REQUERIDA')
  }
}
