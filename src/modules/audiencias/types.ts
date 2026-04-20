import { TipoAudiencia, EstadoAudiencia, ModalidadAudiencia, ResultadoAudiencia } from '@prisma/client'

export interface CreateAudienciaData {
    casoId: string
    tipo: TipoAudiencia
    fechaHora: Date
    responsableId: string
    estado?: EstadoAudiencia
    resultadoAudiencia?: ResultadoAudiencia
    modalidad?: ModalidadAudiencia
    direccion?: string
    enlace?: string
    observaciones?: string
    resultado?: string
}

export interface UpdateAudienciaData {
    tipo?: TipoAudiencia
    fechaHora?: Date
    estado?: EstadoAudiencia
    resultadoAudiencia?: ResultadoAudiencia
    modalidad?: ModalidadAudiencia
    direccion?: string
    enlace?: string
    observaciones?: string
    resultado?: string
    responsableId?: string
}

export interface AudienciaFilters {
    casoId?: string
    tipo?: TipoAudiencia
    estado?: EstadoAudiencia
    resultadoAudiencia?: ResultadoAudiencia
    modalidad?: ModalidadAudiencia
    responsableId?: string
    fechaDesde?: Date
    fechaHasta?: Date
}

export interface AudienciaWithRelations {
    id: string
    tipo: TipoAudiencia
    fechaHora: Date
    estado: EstadoAudiencia
    resultadoAudiencia: ResultadoAudiencia
    modalidad: ModalidadAudiencia
    direccion?: string | null
    enlace?: string | null
    observaciones?: string | null
    resultado?: string | null
    casoId: string
    responsableId: string
    createdAt: Date
    updatedAt: Date

    responsable?: {
        id: string
        nombre: string
        apellido: string
        email: string
    }
    caso?: {
        id: string
        numeroCaso: string
        estado: string
    }
}
