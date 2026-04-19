/**
 * Modelos y Lógica de Dominio - Asesorías Lead
 */

import { NotFoundError } from '@/lib/api-errors'
import { AsesoriaLead } from './types'

export class AsesoriaLeadNoEncontradaError extends NotFoundError {
  constructor() {
    super('Asesorías')
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
export function mapearAsesoriaParaRespuesta(asesoria: any): AsesoriaLead {
  return {
    id: asesoria.id,
    tipo: asesoria.tipo,
    estado: asesoria.estado,
    resultado: asesoria.resultado,
    fecha: asesoria.fecha,
    tema: asesoria.tema,
    descripcion: asesoria.descripcion,
    asesor: asesoria.asesor ? {
      id: asesoria.asesor.id,
      nombre: asesoria.asesor.nombre,
      apellido: asesoria.asesor.apellido,
      email: asesoria.asesor.email,
    } : undefined,
    createdAt: asesoria.createdAt,
    updatedAt: asesoria.updatedAt,
  }
}
