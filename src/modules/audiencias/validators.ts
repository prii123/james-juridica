import { z } from 'zod'
import { TipoAudiencia, EstadoAudiencia, ModalidadAudiencia, ResultadoAudiencia } from '@prisma/client'

export const createAudienciaSchema = z.object({
    casoId: z.string().cuid('ID de caso inválido'),

    tipo: z.nativeEnum(TipoAudiencia, {
        errorMap: () => ({ message: 'Tipo de audiencia inválido' })
    }),

    fechaHora: z.coerce.date({
        errorMap: () => ({ message: 'Fecha y hora inválida' })
    }).refine(
        (date) => date > new Date(),
        { message: 'La fecha de la audiencia debe ser en el futuro' }
    ),

    responsableId: z.string().cuid('ID de responsable inválido'),

    estado: z.nativeEnum(EstadoAudiencia).optional(),

    resultadoAudiencia: z.nativeEnum(ResultadoAudiencia).optional(),

    modalidad: z.nativeEnum(ModalidadAudiencia).optional(),

    direccion: z.string()
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional(),

    enlace: z.string()
        .url('El enlace debe ser una URL válida')
        .optional()
        .or(z.literal('')),

    observaciones: z.string()
        .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
        .optional(),

    resultado: z.string()
        .max(1000, 'El resultado no puede exceder 1000 caracteres')
        .optional()
}).strict()

export const updateAudienciaSchema = z.object({
    tipo: z.nativeEnum(TipoAudiencia, {
        errorMap: () => ({ message: 'Tipo de audiencia inválido' })
    }).optional(),

    fechaHora: z.coerce.date({
        errorMap: () => ({ message: 'Fecha y hora inválida' })
    }).optional(),

    estado: z.nativeEnum(EstadoAudiencia).optional(),

    resultadoAudiencia: z.nativeEnum(ResultadoAudiencia).optional(),

    modalidad: z.nativeEnum(ModalidadAudiencia).optional(),

    direccion: z.string()
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional(),

    enlace: z.string()
        .url('El enlace debe ser una URL válida')
        .optional()
        .or(z.literal('')),

    observaciones: z.string()
        .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
        .optional(),

    resultado: z.string()
        .max(1000, 'El resultado no puede exceder 1000 caracteres')
        .optional(),

    responsableId: z.string().cuid('ID de responsable inválido').optional()
}).strict()

export const audienciaFiltersSchema = z.object({
    casoId: z.string().cuid().optional(),
    tipo: z.nativeEnum(TipoAudiencia).optional(),
    estado: z.nativeEnum(EstadoAudiencia).optional(),
    resultadoAudiencia: z.nativeEnum(ResultadoAudiencia).optional(),
    modalidad: z.nativeEnum(ModalidadAudiencia).optional(),
    responsableId: z.string().cuid().optional(),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional()
}).strict()

// Tipos inferidos de los esquemas
export type CreateAudienciaSchemaType = z.infer<typeof createAudienciaSchema>
export type UpdateAudienciaSchemaType = z.infer<typeof updateAudienciaSchema>
export type AudienciaFiltersSchemaType = z.infer<typeof audienciaFiltersSchema>
