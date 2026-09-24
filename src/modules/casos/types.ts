import { TipoInsolvencia, EstadoCaso, Prioridad } from '@prisma/client'

export interface CreateCasoData {
  tipoInsolvencia: TipoInsolvencia
  prioridad?: Prioridad
  observaciones?: string
  clienteId?: string
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
  /** Un estado, o varios para agrupar pantallas (p. ej. "Activos" = ACTIVO + SUSPENDIDO). */
  estado?: EstadoCaso | EstadoCaso[]
  tipoInsolvencia?: TipoInsolvencia
  prioridad?: Prioridad
  responsableId?: string
  clienteId?: string
  /** 0 = sin facturar, 1 = ya facturado. */
  facturado?: 0 | 1
  fechaInicioDesde?: Date
  fechaInicioHasta?: Date
  /** Número de caso, nombre/apellido/documento del cliente. */
  search?: string
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