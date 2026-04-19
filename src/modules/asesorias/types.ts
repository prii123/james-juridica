/**
 * Tipos e Interfaces del Módulo Asesorías
 */

import { TipoAsesoria, EstadoAsesoria, ResultadoAsesoria } from '@prisma/client'

/**
 * Input para crear una asesoría
 */
export interface CrearAsesoriaInput {
  leadId: string
  tipoAsesoria: TipoAsesoria
  fechaProgramada: Date
  tema?: string
  descripcion?: string
  notas?: string
  abogadoId: string
}

/**
 * Input para actualizar una asesoría
 */
export interface ActualizarAsesoriaInput {
  estado?: EstadoAsesoria
  resultado?: ResultadoAsesoria
  fechaProgramada?: Date
  descripcion?: string
  notas?: string
  abogadoId?: string
}

/**
 * Filtros para búsqueda de asesorías
 */
export interface FiltrosAsesoria {
  estado?: EstadoAsesoria
  tipoAsesoria?: TipoAsesoria
  resultado?: ResultadoAsesoria
  asesorId?: string
  leadId?: string
  fechaDesde?: Date
  fechaHasta?: Date
}

/**
 * Respuesta de asesoría con relaciones
 */
export interface AsesoriaResponse {
  id: string
  leadId: string
  tipoAsesoria: TipoAsesoria
  estado: EstadoAsesoria
  resultado?: ResultadoAsesoria
  fechaProgramada: Date
  fechaRealizada?: Date | null
  descripcion?: string | null
  notas?: string | null
  observaciones?: string | null

  abogadoId: string
  abogado?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }

  lead?: {
    id: string
    nombre: string
    email?: string
    telefono?: string
  }

  creadoPorId?: string
  creadoPor?: {
    id: string
    nombre: string
    apellido: string
  }

  createdAt: Date
  updatedAt: Date
}

/**
 * Estadísticas de asesorías
 */
export interface EstadisticasAsesoria {
  total: number
  porEstado: Record<EstadoAsesoria, number>
  porResultado: Record<ResultadoAsesoria | 'PENDIENTE', number>
  tazaExito: number // porcentaje
  tiempoPromedioDias: number
}
