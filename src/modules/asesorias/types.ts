import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria, ResultadoAsesoria } from '@prisma/client'

// Interface para datos de Asesor
export interface AsesorData {
  id: string
  nombre: string
  apellido: string
  email: string
}

// Interface para datos de Lead en contexto de asesoría
export interface LeadData {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}

// Interface para crear una asesoría
export interface CreateAsesoriaData {
  tipo: TipoAsesoria
  fecha: Date
  tema: string
  descripcion?: string
  duracion?: number
  modalidad?: ModalidadAsesoria
  leadId: string
  asesorId: string
  notas?: string
  valor?: number
}

// Interface para actualizar una asesoría
export interface UpdateAsesoriaData {
  tipo?: TipoAsesoria
  estado?: EstadoAsesoria
  fecha?: Date
  tema?: string
  descripcion?: string
  duracion?: number
  modalidad?: ModalidadAsesoria
  notas?: string
  valor?: number
  resultado?: ResultadoAsesoria
}

// Interface para filtros de asesorías
export interface AsesoriaFilters {
  tipo?: TipoAsesoria
  estado?: EstadoAsesoria
  modalidad?: ModalidadAsesoria
  asesorId?: string
  leadId?: string
  fechaDesde?: Date
  fechaHasta?: Date
  search?: string
}

// Interface para asesoría con relaciones
export interface AsesoriaWithRelations {
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: Date
  duracion?: number | null
  modalidad: ModalidadAsesoria
  tema: string
  descripcion?: string | null
  notas?: string | null
  valor?: number | null
  resultado?: ResultadoAsesoria | null
  createdAt: Date
  updatedAt: Date
  lead: LeadData
  asesor: AsesorData
}
