/**
 * Validadores del Módulo Asesorías
 * Esquemas Zod para validación de entrada
 */

import { z } from 'zod'
import { TipoAsesoria, EstadoAsesoria, ResultadoAsesoria } from '@prisma/client'

/**
 * Validador para crear una asesoría
 */
export const crearAsesoriaValidator = z.object({
  leadId: z.string().cuid('ID de lead inválido'),
  
  tipoAsesoria: z.nativeEnum(TipoAsesoria, {
    errorMap: () => ({ message: 'Tipo de asesoría inválido' })
  }),
  
  fechaProgramada: z.coerce.date()
    .min(new Date(), 'La fecha debe ser en el futuro'),
  
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  notas: z.string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional(),
  
  abogadoId: z.string().cuid('ID de abogado inválido'),
  
  creadoPorId: z.string().cuid('ID de creador inválido'),
})

export type CrearAsesoriaInput = z.infer<typeof crearAsesoriaValidator>

/**
 * Validador para actualizar una asesoría
 */
export const actualizarAsesoriaValidator = z.object({
  estado: z.nativeEnum(EstadoAsesoria, {
    errorMap: () => ({ message: 'Estado inválido' })
  }).optional(),
  
  resultado: z.nativeEnum(ResultadoAsesoria, {
    errorMap: () => ({ message: 'Resultado inválido' })
  }).optional(),
  
  fechaProgramada: z.coerce.date().optional(),
  
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  notas: z.string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional(),
  
  abogadoId: z.string().cuid('ID de abogado inválido').optional(),
})

export type ActualizarAsesoriaInput = z.infer<typeof actualizarAsesoriaValidator>

/**
 * Validador para filtros de búsqueda
 */
export const filtrosAsesoriaValidator = z.object({
  estado: z.nativeEnum(EstadoAsesoria).optional(),
  tipoAsesoria: z.nativeEnum(TipoAsesoria).optional(),
  resultado: z.nativeEnum(ResultadoAsesoria).optional(),
  abogadoId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(10),
})

export type FiltrosAsesoriaInput = z.infer<typeof filtrosAsesoriaValidator>

/**
 * Validador para cambiar estado de asesoría
 */
export const cambiarEstadoAsesoriaValidator = z.object({
  estado: z.nativeEnum(EstadoAsesoria),
  observaciones: z.string().optional(),
}).refine(
  (data) => {
    // Solo se pueden hacer ciertos cambios de estado
    // Esto se validará en el servicio con el estado actual
    return true
  }
)

/**
 * Validador para registrar resultado de asesoría
 */
export const registrarResultadoAsesoriaValidator = z.object({
  resultado: z.nativeEnum(ResultadoAsesoria),
  observaciones: z.string().optional(),
  fechaRealizada: z.coerce.date().optional(),
})
