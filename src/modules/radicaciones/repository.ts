/**
 * Repositorio de Radicaciones
 */

import { prisma } from '@/lib/db'
import { CrearRadicacionInput, ActualizarRadicacionInput, FiltrosRadicacion } from './types'

export class RadicacionRepository {
  /**
   * Crea una radicación
   */
  async crear(datos: CrearRadicacionInput & { numero: string }) {
    return await prisma.radicacion.create({
      data: {
        numero: datos.numero,
        demandante: datos.demandante,
        demandado: datos.demandado,
        valor: datos.valor,
        estado: datos.estado || 'SOLICITADA',
        fechaSolicitud: datos.fechaSolicitud || new Date(),
        fechaAudiencia: datos.fechaAudiencia,
        observaciones: datos.observaciones,
        asesoriaId: datos.asesoriaId,
      },
      include: {
        asesoria: {
          include: {
            lead: {
              select: { id: true, nombre: true, email: true, telefono: true }
            },
            asesor: {
              select: { id: true, nombre: true, apellido: true, email: true }
            }
          }
        }
      }
    })
  }

  /**
   * Obtiene radicación por ID
   */
  async obtenerPorId(id: string) {
    return await prisma.radicacion.findUnique({
      where: { id },
      include: {
        asesoria: {
          include: {
            lead: {
              select: { id: true, nombre: true, email: true, telefono: true }
            },
            asesor: {
              select: { id: true, nombre: true, apellido: true, email: true }
            }
          }
        }
      }
    })
  }

  /**
   * Obtiene radicaciones con filtros y paginación
   */
  async obtenerPorFiltros(filtros: FiltrosRadicacion = {}, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const where: any = {}

    if (filtros.estado) where.estado = filtros.estado
    if (filtros.resultado) where.resultado = filtros.resultado

    if (filtros.search) {
      where.OR = [
        { numero: { contains: filtros.search, mode: 'insensitive' } },
        { demandante: { contains: filtros.search, mode: 'insensitive' } },
        { demandado: { contains: filtros.search, mode: 'insensitive' } }
      ]
    }

    const [radicaciones, total] = await Promise.all([
      prisma.radicacion.findMany({
        where,
        include: {
          asesoria: {
            include: {
              lead: {
                select: { id: true, nombre: true, email: true }
              },
              asesor: {
                select: { id: true, nombre: true, apellido: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.radicacion.count({ where })
    ])

    return {
      radicaciones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * Actualiza radicación
   */
  async actualizar(id: string, datos: ActualizarRadicacionInput) {
    const updateData: any = {}

    if (datos.estado !== undefined) updateData.estado = datos.estado
    if (datos.resultado !== undefined) updateData.resultado = datos.resultado
    if (datos.demandante !== undefined) updateData.demandante = datos.demandante
    if (datos.demandado !== undefined) updateData.demandado = datos.demandado
    if (datos.valor !== undefined) updateData.valor = datos.valor
    if (datos.fechaSolicitud !== undefined) updateData.fechaSolicitud = datos.fechaSolicitud
    if (datos.fechaAudiencia !== undefined) updateData.fechaAudiencia = datos.fechaAudiencia
    if (datos.observaciones !== undefined) updateData.observaciones = datos.observaciones

    return await prisma.radicacion.update({
      where: { id },
      data: updateData,
      include: {
        asesoria: {
          include: {
            lead: {
              select: { id: true, nombre: true, email: true, telefono: true }
            },
            asesor: {
              select: { id: true, nombre: true, apellido: true, email: true }
            }
          }
        }
      }
    })
  }

  /**
   * Elimina radicación
   */
  async eliminar(id: string) {
    return await prisma.radicacion.delete({
      where: { id }
    })
  }

  /**
   * Obtiene última radicación para generar número
   */
  async obtenerUltimoPorAno(ano: number) {
    return await prisma.radicacion.findFirst({
      where: { numero: { startsWith: `RAD-${ano}` } },
      orderBy: { numero: 'desc' }
    })
  }

  /**
   * Verifica si número de radicación existe
   */
  async existeNumero(numero: string): Promise<boolean> {
    const resultado = await prisma.radicacion.findUnique({
      where: { numero }
    })
    return !!resultado
  }
}
