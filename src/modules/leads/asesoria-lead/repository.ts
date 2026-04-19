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
    const createData: any = {
      tipo: datos.tipo,
      estado: datos.estado,
      tema: datos.tema,
      leadId,
    }

    if (datos.fecha) createData.fecha = datos.fecha
    if (datos.descripcion) createData.descripcion = datos.descripcion
    if (datos.asesorId) createData.asesorId = datos.asesorId
    if (datos.resultado) createData.resultado = datos.resultado

    return await prisma.asesoria.create({
      data: createData,
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
