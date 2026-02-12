import { z } from 'zod'
import { TipoPersona, EstadoLead } from '@prisma/client'

export const createLeadSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  telefono: z.string()
    .min(10, 'El teléfono debe tener al menos 10 caracteres')
    .max(15, 'El teléfono no puede exceder 15 caracteres')
    .regex(/^\d+$/, 'El teléfono solo puede contener números'),
  
  empresa: z.string()
    .max(200, 'El nombre de la empresa no puede exceder 200 caracteres')
    .optional(),
  
  tipoPersona: z.nativeEnum(TipoPersona, {
    errorMap: () => ({ message: 'Tipo de persona inválido' })
  }),
  
  documento: z.string()
    .min(7, 'El documento debe tener al menos 7 caracteres')
    .max(15, 'El documento no puede exceder 15 caracteres')
    .regex(/^\d+$/, 'El documento solo puede contener números')
    .optional(),
  
  origen: z.string()
    .max(100, 'El origen no puede exceder 100 caracteres')
    .optional(),
  
  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional(),
  
  responsableId: z.string().cuid().optional()
})

export const updateLeadSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  
  telefono: z.string()
    .min(10, 'El teléfono debe tener al menos 10 caracteres')
    .max(15, 'El teléfono no puede exceder 15 caracteres')
    .regex(/^\d+$/, 'El teléfono solo puede contener números')
    .optional(),
  
  empresa: z.string()
    .max(200, 'El nombre de la empresa no puede exceder 200 caracteres')
    .optional(),
  
  tipoPersona: z.nativeEnum(TipoPersona, {
    errorMap: () => ({ message: 'Tipo de persona inválido' })
  }).optional(),
  
  documento: z.string()
    .min(7, 'El documento debe tener al menos 7 caracteres')
    .max(15, 'El documento no puede exceder 15 caracteres')
    .regex(/^\d+$/, 'El documento solo puede contener números')
    .optional(),
  
  estado: z.nativeEnum(EstadoLead, {
    errorMap: () => ({ message: 'Estado inválido' })
  }).optional(),
  
  origen: z.string()
    .max(100, 'El origen no puede exceder 100 caracteres')
    .optional(),
  
  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional(),
  
  responsableId: z.string().cuid().optional(),
  
  fechaSeguimiento: z.date().optional()
})

export const leadFiltersSchema = z.object({
  estado: z.nativeEnum(EstadoLead).optional(),
  tipoPersona: z.nativeEnum(TipoPersona).optional(),
  responsableId: z.string().cuid().optional(),
  origen: z.string().optional(),
  fechaCreacionDesde: z.date().optional(),
  fechaCreacionHasta: z.date().optional(),
  busqueda: z.string().optional()
})

// Validaciones específicas para el contexto colombiano
export const validateDocumentoColombia = (documento: string, tipoPersona: TipoPersona): boolean => {
  if (!documento) return true // Es opcional
  
  if (tipoPersona === TipoPersona.NATURAL) {
    // Cédula de ciudadanía (7-10 dígitos)
    return /^\d{7,10}$/.test(documento)
  } else {
    // NIT (9-10 dígitos)
    return /^\d{9,10}$/.test(documento)
  }
}

export const validateTelefonoColombia = (telefono: string): boolean => {
  // Teléfonos colombianos: celular (10 dígitos empezando por 3) o fijo (7-8 dígitos)
  return /^(3\d{9}|[1-8]\d{6,7})$/.test(telefono)
}