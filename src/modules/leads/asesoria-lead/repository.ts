/**
 * Repositorio de Asesorías de Leads
 */

import { prisma } from '@/lib/db'
import { CrearAsesoriaLeadInput } from './types'

export class AsesoriaLeadRepository {
  /**
   * Obtiene asesorías de un lead
   */
  async obtenerPorLead(leadId: string) {
    return await prisma.asesoria.findMany({
      where: { leadId },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })
  }

  /**
   * Crea una asesoría
   */
  async crear(leadId: string, datos: CrearAsesoriaLeadInput) {
    return await prisma.asesoria.create({
      data: {
        ...datos,
        leadId,
      },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          }
        },
        lead: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    })
  }
}
