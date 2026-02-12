import { TipoPersona, EstadoLead } from '@prisma/client'

export interface CreateLeadData {
  nombre: string
  email: string
  telefono: string
  empresa?: string
  tipoPersona: TipoPersona
  documento?: string
  origen?: string
  observaciones?: string
  responsableId?: string
}

export interface UpdateLeadData {
  nombre?: string
  email?: string
  telefono?: string
  empresa?: string
  tipoPersona?: TipoPersona
  documento?: string
  estado?: EstadoLead
  origen?: string
  observaciones?: string
  responsableId?: string
  fechaSeguimiento?: Date
}

export interface LeadFilters {
  estado?: EstadoLead
  tipoPersona?: TipoPersona
  responsableId?: string
  origen?: string
  fechaCreacionDesde?: Date
  fechaCreacionHasta?: Date
}

export interface LeadWithRelations {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa?: string | null
  tipoPersona: TipoPersona
  documento?: string | null
  estado: EstadoLead
  origen?: string | null
  observaciones?: string | null
  fechaSeguimiento?: Date | null
  createdAt: Date
  updatedAt: Date
  responsable?: {
    id: string
    nombre: string
    apellido: string
    email: string
  } | null
  _count: {
    asesorias: number
  }
}