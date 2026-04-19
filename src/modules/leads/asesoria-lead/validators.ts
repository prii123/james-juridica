/**
 * Validadores para Asesorías de Leads
 */

import { z } from 'zod'

export const crearAsesoriaLeadValidator = z.object({
  tipo: z.string().min(1, 'Tipo de asesoría requerido'),
  estado: z.string().min(1, 'Estado requerido'),
  fecha: z.coerce.date().optional(),
  tema: z.string().min(5, 'Tema debe tener al menos 5 caracteres').max(255),
  descripcion: z.string().max(2000).optional(),
  asesorId: z.string().optional(),
  resultado: z.string().max(500).optional(),
})

export type CrearAsesoriaLeadInput = z.infer<typeof crearAsesoriaLeadValidator>
