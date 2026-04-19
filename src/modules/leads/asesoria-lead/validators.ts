/**
 * Validadores para Asesorías de Leads
 */

import { z } from 'zod'

export const crearAsesoriaLeadValidator = z.object({
  tipo: z.enum(['INICIAL', 'SEGUIMIENTO', 'ESPECIALIZADA'], {
    errorMap: () => ({ message: 'Tipo de asesoría inválido' })
  }),
  estado: z.enum(['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'REPROGRAMADA'], {
    errorMap: () => ({ message: 'Estado inválido' })
  }),
  fecha: z.coerce.date().optional(),
  tema: z.string().min(5, 'Tema debe tener al menos 5 caracteres').max(255),
  descripcion: z.string().max(2000).optional(),
  asesorId: z.string().optional(),
  resultado: z.enum(['EXITOSA', 'RECHAZADA'], {
    errorMap: () => ({ message: 'Resultado inválido' })
  }).optional(),
})

export type CrearAsesoriaLeadInput = z.infer<typeof crearAsesoriaLeadValidator>
