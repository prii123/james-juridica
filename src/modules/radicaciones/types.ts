/**
 * Tipos para Radicaciones
 */

import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'

export type { EstadoRadicacion, ResultadoRadicacion }

export interface CrearRadicacionInput {
  numero?: string
  demandante: string
  demandado: string
  valor: number
  estado?: EstadoRadicacion
  fechaSolicitud?: Date
  fechaAudiencia?: Date
  observaciones?: string
  asesoriaId: string
}

export interface ActualizarRadicacionInput {
  estado?: EstadoRadicacion
  resultado?: ResultadoRadicacion
  demandante?: string
  demandado?: string
  valor?: number
  fechaSolicitud?: Date
  fechaAudiencia?: Date
  observaciones?: string
  createCase?: boolean
}

export interface FiltrosRadicacion {
  estado?: EstadoRadicacion
  resultado?: ResultadoRadicacion
  search?: string
}

export interface RadicacionResponse {
  id: string
  numero: string
  demandante: string
  demandado: string
  valor: number
  estado: EstadoRadicacion
  resultado?: ResultadoRadicacion
  fechaSolicitud: Date
  fechaAudiencia?: Date | null
  observaciones?: string | null
  asesoriaId: string
  asesoria?: {
    id: string
    tipo: string
    lead?: {
      id: string
      nombre: string
      email: string
    }
    asesor?: {
      id: string
      nombre: string
      apellido: string
      email: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface RadicacionConCasosCreados {
  radicacion: RadicacionResponse
  casoCreado?: any
  honorarioCreado?: any
  facturaCreada?: any
  message?: string
}
