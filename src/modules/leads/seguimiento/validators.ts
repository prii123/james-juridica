/**
 * Validadores para Seguimiento de Leads
 */

import { z } from 'zod'
import { TipoSeguimiento } from '@prisma/client'

export const crearSeguimientoValidator = z.object({
  tipo: z.nativeEnum(TipoSeguimiento),
  descripcion: z.string()
    .min(10, 'Descripción debe tener al menos 10 caracteres')
    .max(1000, 'Descripción no puede exceder 1000 caracteres'),
  duracion: z.number().int().positive().optional(),
  resultado: z.string().max(500, 'Resultado no puede exceder 500 caracteres').optional(),
  proximoSeguimiento: z.coerce.date().optional(),
})

export type CrearSeguimientoInput = z.infer<typeof crearSeguimientoValidator>

export const actualizarSeguimientoValidator = z.object({
  tipo: z.nativeEnum(TipoSeguimiento).optional(),
  descripcion: z.string()
    .min(10, 'Descripción debe tener al menos 10 caracteres')
    .max(1000, 'Descripción no puede exceder 1000 caracteres')
    .optional(),
  duracion: z.number().int().positive().nullable().optional(),
  resultado: z.string().max(500, 'Resultado no puede exceder 500 caracteres').nullable().optional(),
  proximoSeguimiento: z.coerce.date().nullable().optional(),
})

export type ActualizarSeguimientoInput = z.infer<typeof actualizarSeguimientoValidator>
