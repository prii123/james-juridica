import { z } from 'zod'
import { TipoInsolvencia, EstadoCaso, Prioridad } from '@prisma/client'

export const createCasoSchema = z.object({
  tipoInsolvencia: z.nativeEnum(TipoInsolvencia, {
    errorMap: () => ({ message: 'Tipo de insolvencia inválido' })
  }),
  
  prioridad: z.nativeEnum(Prioridad).optional(),
  
  observaciones: z.string()
    .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
    .optional(),
  
  clienteId: z.string().cuid('ID de cliente inválido'),
  responsableId: z.string().cuid('ID de responsable inválido'),
  creadoPorId: z.string().cuid('ID de creador inválido')
})

export const updateCasoSchema = z.object({
  estado: z.nativeEnum(EstadoCaso, {
    errorMap: () => ({ message: 'Estado inválido' })
  }).optional(),
  
  tipoInsolvencia: z.nativeEnum(TipoInsolvencia, {
    errorMap: () => ({ message: 'Tipo de insolvencia inválido' })
  }).optional(),
  
  prioridad: z.nativeEnum(Prioridad).optional(),
  fechaCierre: z.date().optional(),
  
  observaciones: z.string()
    .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
    .optional(),
  
  clienteId: z.string().cuid('ID de cliente inválido').optional(),
  responsableId: z.string().cuid('ID de responsable inválido').optional()
})

export const casoFiltersSchema = z.object({
  estado: z.nativeEnum(EstadoCaso).optional(),
  tipoInsolvencia: z.nativeEnum(TipoInsolvencia).optional(),
  prioridad: z.nativeEnum(Prioridad).optional(),
  responsableId: z.string().cuid().optional(),
  fechaInicioDesde: z.date().optional(),
  fechaInicioHasta: z.date().optional(),
  busqueda: z.string().optional()
})