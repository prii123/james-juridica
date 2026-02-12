import { z } from 'zod'
import { TipoInsolvencia, EstadoCaso, Prioridad } from '@prisma/client'

export const createCasoSchema = z.object({
  tipoInsolvencia: z.nativeEnum(TipoInsolvencia, {
    errorMap: () => ({ message: 'Tipo de insolvencia inválido' })
  }),
  
  valorDeuda: z.number()
    .positive('El valor de la deuda debe ser positivo')
    .max(999999999999, 'El valor de la deuda es demasiado alto'),
  
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
  
  valorDeuda: z.number()
    .positive('El valor de la deuda debe ser positivo')
    .max(999999999999, 'El valor de la deuda es demasiado alto')
    .optional(),
  
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
  valorDeudaMin: z.number().positive().optional(),
  valorDeudaMax: z.number().positive().optional(),
  fechaInicioDesde: z.date().optional(),
  fechaInicioHasta: z.date().optional(),
  busqueda: z.string().optional()
})

// Validaciones de negocio específicas
export const validateValorDeudaByTipo = (valorDeuda: number, tipoInsolvencia: TipoInsolvencia): boolean => {
  // Validaciones según normativa colombiana de insolvencia
  switch (tipoInsolvencia) {
    case TipoInsolvencia.INSOLVENCIA_PERSONA_NATURAL:
      // Para persona natural no debe exceder cierto límite
      return valorDeuda <= 5000000000 // 5 mil millones
    case TipoInsolvencia.REORGANIZACION:
    case TipoInsolvencia.LIQUIDACION_JUDICIAL:
      // Para empresas el límite es mayor
      return valorDeuda >= 100000000 // Mínimo 100 millones para justificar proceso empresarial
    default:
      return true
  }
}