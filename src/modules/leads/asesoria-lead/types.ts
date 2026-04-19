/**
 * Tipos para Asesorías de Leads
 */

export interface ObtenerAsesoriasLeadResponse {
  leadId: string
  leadNombre: string
  asesorias: AsesoriaLead[]
}

export interface AsesoriaLead {
  id: string
  tipo: string
  estado: string
  resultado?: string
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
  tipo: string
  estado: string
  fecha?: Date
  tema: string
  descripcion?: string
  asesorId?: string
  resultado?: string
}
