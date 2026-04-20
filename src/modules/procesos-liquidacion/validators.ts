import { z } from 'zod'

const PasoLiquidacionSchema = z.object({
    id: z.string(),
    nombre: z.string(),
    completado: z.boolean(),
    descripcion: z.string().optional()
})

export const createProcesoLiquidacionSchema = z.object({
    audienciaId: z.string().min(1, 'Audiencia ID es requerido'),
    casoId: z.string().min(1, 'Caso ID es requerido'),
    pasos: z.array(PasoLiquidacionSchema).optional()
})

export const updateProcesoLiquidacionSchema = z.object({
    pasos: z.array(PasoLiquidacionSchema)
})

export type CreateProcesoLiquidacionSchemaType = z.infer<typeof createProcesoLiquidacionSchema>
export type UpdateProcesoLiquidacionSchemaType = z.infer<typeof updateProcesoLiquidacionSchema>
