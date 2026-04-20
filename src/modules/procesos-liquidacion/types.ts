export interface PasoLiquidacion {
    id: string
    nombre: string
    completado: boolean
    descripcion?: string
}

export const PASOS_LIQUIDACION_DEFAULT: PasoLiquidacion[] = [
    {
        id: 'autodeadmision',
        nombre: 'Autodeadmisión',
        completado: false,
        descripcion: 'Auto de Admisión de la insolvencia'
    },
    {
        id: 'nombrar-liquidador',
        nombre: 'Nombrar Liquidador',
        completado: false,
        descripcion: 'Nombrar al liquidador del proceso'
    },
    {
        id: 'inventario-avaluo',
        nombre: 'Inventario y Avalúo',
        completado: false,
        descripcion: 'Diligenciar inventario y avalúo de bienes'
    },
    {
        id: 'audiencia-adjudicacion',
        nombre: 'Audiencia y Adjudicación',
        completado: false,
        descripcion: 'Realizar audiencia y adjudicación de bienes'
    },
    {
        id: 'sentencia',
        nombre: 'Sentencia',
        completado: false,
        descripcion: 'Sentencia de liquidación'
    },
    {
        id: 'notificar-cliente',
        nombre: 'Notificar al Cliente Terminación del Caso',
        completado: false,
        descripcion: 'Notificar al cliente la terminación del caso'
    }
]

export interface CreateProcesoLiquidacionData {
    audienciaId: string
    casoId: string
    pasos?: PasoLiquidacion[]
}

export interface UpdateProcesoLiquidacionData {
    pasos?: PasoLiquidacion[]
}

export interface ProcesoLiquidacionFilters {
    audienciaId?: string
    casoId?: string
}

export interface ProcesoLiquidacionWithRelations {
    id: string
    audienciaId: string
    casoId: string
    pasos: PasoLiquidacion[]
    createdAt: Date
    updatedAt: Date
}
