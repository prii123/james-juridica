/**
 * Tipos para Asesorías de Leads
 */

import { TipoAsesoria, EstadoAsesoria, ResultadoAsesoria } from '@prisma/client'

export interface ObtenerAsesoriasLeadResponse {
  leadId: string
  leadNombre: string
  asesorias: AsesoriaLead[]
}

export interface AsesoriaLead {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  resultado?: ResultadoAsesoria
  fecha?: Date
  tema: string
  descripcion?: string
  asesor?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CrearAsesoriaLeadInput {
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha?: Date
  tema: string
  descripcion?: string
  asesorId?: string
  resultado?: ResultadoAsesoria
}
