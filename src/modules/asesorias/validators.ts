import { z } from 'zod'
import { TipoAsesoria, EstadoAsesoria, ModalidadAsesoria, ResultadoAsesoria } from '@prisma/client'

// Esquema para validar datos de Asesor
export const asesorDataSchema = z.object({
  id: z.string().cuid(),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
})

// Esquema para validar datos de Lead
export const leadDataSchema = z.object({
  id: z.string().cuid(),
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
  estado: z.string()
})

// Esquema para crear una asesoría
export const createAsesoriaSchema = z.object({
  tipo: z.nativeEnum(TipoAsesoria, {
    errorMap: () => ({ message: 'Tipo de asesoría inválido' })
  }),
  
  fecha: z.date({
    required_error: 'La fecha es requerida',
    invalid_type_error: 'Formato de fecha inválido'
  }),
  
  tema: z.string()
    .min(5, 'El tema debe tener al menos 5 caracteres')
    .max(200, 'El tema no puede exceder 200 caracteres'),
  
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  duracion: z.number()
    .int('La duración debe ser un número entero')
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 480 minutos (8 horas)')
    .optional(),
  
  modalidad: z.nativeEnum(ModalidadAsesoria, {
    errorMap: () => ({ message: 'Modalidad inválida' })
  }).optional(),
  
  leadId: z.string().cuid('ID de lead inválido'),
  
  asesorId: z.string().cuid('ID de asesor inválido'),
  
  notas: z.string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional(),
  
  valor: z.number()
    .min(0, 'El valor no puede ser negativo')
    .optional()
})

// Esquema para actualizar una asesoría
export const updateAsesoriaSchema = z.object({
  tipo: z.nativeEnum(TipoAsesoria, {
    errorMap: () => ({ message: 'Tipo de asesoría inválido' })
  }).optional(),
  
  estado: z.nativeEnum(EstadoAsesoria, {
    errorMap: () => ({ message: 'Estado inválido' })
  }).optional(),
  
  fecha: z.date({
    invalid_type_error: 'Formato de fecha inválido'
  }).optional(),
  
  tema: z.string()
    .min(5, 'El tema debe tener al menos 5 caracteres')
    .max(200, 'El tema no puede exceder 200 caracteres')
    .optional(),
  
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  
  duracion: z.number()
    .int('La duración debe ser un número entero')
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 480 minutos (8 horas)')
    .optional(),
  
  modalidad: z.nativeEnum(ModalidadAsesoria, {
    errorMap: () => ({ message: 'Modalidad inválida' })
  }).optional(),
  
  notas: z.string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional(),
  
  valor: z.number()
    .min(0, 'El valor no puede ser negativo')
    .optional(),
  
  resultado: z.nativeEnum(ResultadoAsesoria, {
    errorMap: () => ({ message: 'Resultado inválido' })
  }).optional()
})

// Esquema para filtros de asesorías
export const asesoriaFiltersSchema = z.object({
  tipo: z.nativeEnum(TipoAsesoria).optional(),
  estado: z.nativeEnum(EstadoAsesoria).optional(),
  modalidad: z.nativeEnum(ModalidadAsesoria).optional(),
  asesorId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  search: z.string().optional()
})

// Validación para verificar que la fecha sea en el presente o futuro
export const isFechaEnFuturoOPresente = (fecha: Date): boolean => {
  const now = new Date()
  return fecha >= now
}

// Validación para verificar que la fecha de fin sea después de la fecha de inicio
export const validateRangoFechas = (fechaDesde: Date, fechaHasta: Date): boolean => {
  return fechaHasta >= fechaDesde
}
