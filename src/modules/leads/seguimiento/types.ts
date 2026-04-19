/**
 * Tipos para el módulo Seguimiento de Leads
 */

import { TipoSeguimiento } from '@prisma/client'

/**
 * Input para crear un seguimiento
 */
export interface CrearSeguimientoInput {
  tipo: TipoSeguimiento
  descripcion: string
  duracion?: number
  resultado?: string
  proximoSeguimiento?: Date
  leadId: string
  usuarioId: string
}

/**
 * Input para actualizar un seguimiento
 */
export interface ActualizarSeguimientoInput {
  tipo?: TipoSeguimiento
  descripcion?: string
  duracion?: number | null
  resultado?: string | null
  proximoSeguimiento?: Date | null
}

/**
 * Filtros para búsqueda de seguimientos
 */
export interface FiltrosSeguimiento {
  tipo?: TipoSeguimiento
  leadId?: string
  usuarioId?: string
  fechaDesde?: Date
  fechaHasta?: Date
}

/**
 * DTO para respuesta de seguimiento
 */
export interface SeguimientoResponse {
  id: string
  tipo: TipoSeguimiento
  descripcion: string
  duracion?: number | null
  resultado?: string | null
  proximoSeguimiento?: Date | null
  fecha?: Date
  leadId: string
  usuarioId: string
  usuario?: {
    id: string
    nombre: string
    apellido: string
  }
  createdAt: Date
  updatedAt: Date
}
