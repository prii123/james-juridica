/**
 * Validadores para Radicaciones
 */

import { z } from 'zod'
import { EstadoRadicacion, ResultadoRadicacion } from '@prisma/client'

export const crearRadicacionValidator = z.object({
  numero: z.string().optional(),
  demandante: z.string().min(3, 'Demandante debe tener al menos 3 caracteres').max(255),
  demandado: z.string().min(3, 'Demandado debe tener al menos 3 caracteres').max(255),
  valor: z.number().positive('Valor debe ser positivo'),
  estado: z.nativeEnum(EstadoRadicacion).optional(),
  fechaSolicitud: z.coerce.date().optional(),
  fechaAudiencia: z.coerce.date().optional(),
  observaciones: z.string().max(2000).optional(),
  asesoriaId: z.string().cuid('ID de asesoría inválido'),
})

export type CrearRadicacionInput = z.infer<typeof crearRadicacionValidator>

export const actualizarRadicacionValidator = z.object({
  estado: z.nativeEnum(EstadoRadicacion).optional(),
  resultado: z.nativeEnum(ResultadoRadicacion).optional(),
  demandante: z.string().min(3).max(255).optional(),
  demandado: z.string().min(3).max(255).optional(),
  valor: z.number().positive().optional(),
  fechaSolicitud: z.coerce.date().optional(),
  fechaAudiencia: z.coerce.date().nullable().optional(),
  observaciones: z.string().max(2000).optional(),
  createCase: z.boolean().optional(),
}).refine((data) => {
  // Si se intenta crear caso, debe estar en estado REALIZADA
  if (data.createCase && data.estado && data.estado !== 'REALIZADA') {
    return false
  }
  return true
}, {
  message: 'Solo se puede crear caso cuando la radicación está REALIZADA',
  path: ['createCase'],
})

export type ActualizarRadicacionInput = z.infer<typeof actualizarRadicacionValidator>

export const filtrosRadicacionValidator = z.object({
  estado: z.nativeEnum(EstadoRadicacion).optional(),
  resultado: z.nativeEnum(ResultadoRadicacion).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
})

export type FiltrosRadicacionInput = z.infer<typeof filtrosRadicacionValidator>
