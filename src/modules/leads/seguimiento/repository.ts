/**
 * Repositorio de Seguimiento
 */

import { prisma } from '@/lib/db'
import { CrearSeguimientoInput, ActualizarSeguimientoInput } from './types'

export class SeguimientoRepository {
  /**
   * Crea un nuevo seguimiento
   */
  async crear(datos: CrearSeguimientoInput) {
    return await prisma.seguimiento.create({
      data: {
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        duracion: datos.duracion || null,
        resultado: datos.resultado || null,
        proximoSeguimiento: datos.proximoSeguimiento || null,
        leadId: datos.leadId,
        usuarioId: datos.usuarioId,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    })
  }

  /**
   * Obtiene un seguimiento por ID
   */
  async obtenerPorId(id: string, leadId: string) {
    return await prisma.seguimiento.findFirst({
      where: { id, leadId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    })
  }

  /**
   * Obtiene todos los seguimientos de un lead
   */
  async obtenerPorLead(leadId: string, ordenar: 'asc' | 'desc' = 'desc') {
    return await prisma.seguimiento.findMany({
      where: { leadId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        }
      },
      orderBy: { fecha: ordenar }
    })
  }

  /**
   * Actualiza un seguimiento
   */
  async actualizar(id: string, datos: ActualizarSeguimientoInput) {
    return await prisma.seguimiento.update({
      where: { id },
      data: {
        ...(datos.tipo && { tipo: datos.tipo }),
        ...(datos.descripcion && { descripcion: datos.descripcion }),
        ...(datos.duracion !== undefined && { duracion: datos.duracion }),
        ...(datos.resultado !== undefined && { resultado: datos.resultado }),
        ...(datos.proximoSeguimiento !== undefined && { proximoSeguimiento: datos.proximoSeguimiento }),
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    })
  }

  /**
   * Elimina un seguimiento
   */
  async eliminar(id: string) {
    return await prisma.seguimiento.delete({
      where: { id }
    })
  }

  /**
   * Verifica que el seguimiento existe y pertenece al lead
   */
  async existeEnLead(id: string, leadId: string): Promise<boolean> {
    const resultado = await prisma.seguimiento.findFirst({
      where: { id, leadId }
    })
    return !!resultado
  }
}
