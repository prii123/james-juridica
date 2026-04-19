/**
 * Repositorio de Archivos de Leads
 */

import { prisma } from '@/lib/db'
import { FiltrosArchivo } from './types'

export class ArchivoLeadRepository {
  /**
   * Obtiene archivos de un lead con filtros
   */
  async obtenerPorLead(leadId: string, filtros: FiltrosArchivo = {}) {
    const where: any = { leadId }

    if (filtros.search) {
      where.nombreOriginal = {
        contains: filtros.search,
        mode: 'insensitive'
      }
    }

    if (filtros.tipo) {
      where.tipoMime = {
        contains: filtros.tipo,
        mode: 'insensitive'
      }
    }

    return await prisma.archivo.findMany({
      where,
      include: {
        subidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: { fechaSubida: 'desc' }
    })
  }

  /**
   * Obtiene un archivo específico de un lead
   */
  async obtenerPorId(archivoId: string, leadId: string) {
    return await prisma.archivo.findFirst({
      where: {
        id: archivoId,
        leadId
      },
      include: {
        subidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })
  }

  /**
   * Crea un archivo
   */
  async crear(datos: {
    nombreOriginal: string
    nombreArchivo: string
    rutaArchivo: string
    tamano: number
    tipoMime: string
    url: string
    leadId: string
    subidoPorId: string
  }) {
    return await prisma.archivo.create({
      data: datos,
      include: {
        subidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })
  }

  /**
   * Elimina un archivo
   */
  async eliminar(archivoId: string) {
    return await prisma.archivo.delete({
      where: { id: archivoId }
    })
  }

  /**
   * Verifica que archivo existe
   */
  async existe(archivoId: string, leadId: string): Promise<boolean> {
    const archivo = await prisma.archivo.findFirst({
      where: { id: archivoId, leadId }
    })
    return !!archivo
  }
}
