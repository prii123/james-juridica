import { TipoInsolvencia, EstadoCaso, Prioridad } from '@prisma/client'

export interface CreateCasoData {
  tipoInsolvencia: TipoInsolvencia
  prioridad?: Prioridad
  observaciones?: string
  clienteId: string
  responsableId: string
  creadoPorId: string
}

export interface UpdateCasoData {
  estado?: EstadoCaso
  tipoInsolvencia?: TipoInsolvencia
  prioridad?: Prioridad
  fechaCierre?: Date
  observaciones?: string
  clienteId?: string
  responsableId?: string
}

export interface CasoFilters {
  estado?: EstadoCaso
  tipoInsolvencia?: TipoInsolvencia
  prioridad?: Prioridad
  responsableId?: string
  fechaInicioDesde?: Date
  fechaInicioHasta?: Date
}

export interface CasoWithRelations {
  id: string
  numeroCaso: string
  estado: EstadoCaso
  tipoInsolvencia: TipoInsolvencia
  fechaInicio: Date
  fechaCierre?: Date | null
  prioridad: Prioridad
  observaciones?: string | null
  clienteId: string
  responsableId: string
  creadoPorId: string
  
  createdAt: Date
  updatedAt: Date
  
  cliente?: {
    id: string
    nombre: string
    apellido?: string | null
    documento: string
    email: string
    telefono: string
  }
  
  responsable: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  
  creadoPor: {
    id: string
    nombre: string
    apellido: string
  }
  
  _count?: {
    documentos: number
    actuaciones: number
    audiencias: number
    honorarios: number
  }
}