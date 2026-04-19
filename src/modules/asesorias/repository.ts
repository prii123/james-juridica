/**
 * Repositorio de Asesorías
 * Capa de acceso a datos con Prisma
 */

import { prisma } from '@/lib/db'
import { CrearAsesoriaInput, ActualizarAsesoriaInput, FiltrosAsesoria } from './types'
import { EstadoAsesoria, ResultadoAsesoria } from '@prisma/client'

export class AsesoriaRepository {
  /**
   * Crea una nueva asesoría
   */
  async crear(datos: CrearAsesoriaInput) {
    return await prisma.asesoria.create({
      data: {
        leadId: datos.leadId,
        tipo: datos.tipoAsesoria,
        fecha: datos.fechaProgramada,
        tema: datos.tema || '',
        descripcion: datos.descripcion,
        notas: datos.notas,
        asesorId: datos.abogadoId,
      },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,

            email: true,
          },
        },
      },
    })
  }

  /**
   * Obtiene una asesoría por ID
   */
  async obtenerPorId(id: string) {
    return await prisma.asesoria.findUnique({
      where: { id },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,

            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            nombre: true,

          },
        },
      },
    })
  }

  /**
   * Actualiza una asesoría
   */
  async actualizar(id: string, datos: ActualizarAsesoriaInput) {
    return await prisma.asesoria.update({
      where: { id },
      data: {
        ...(datos.estado && { estado: datos.estado }),
        ...(datos.resultado && { resultado: datos.resultado }),
        ...(datos.fechaProgramada && { fecha: datos.fechaProgramada }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(datos.notas !== undefined && { notas: datos.notas }),
        ...(datos.abogadoId && { asesorId: datos.abogadoId }),
        updatedAt: new Date(),
      },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,

            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            nombre: true,

          },
        },
      },
    })
  }

  /**
   * Elimina una asesoría
   */
  async eliminar(id: string) {
    return await prisma.asesoria.delete({
      where: { id },
    })
  }

  /**
   * Obtiene asesorías con filtros
   */
  async obtenerPorFiltros(
    filtros: FiltrosAsesoria = {},
    pagina: number = 1,
    limite: number = 10,
  ) {
    const skip = (pagina - 1) * limite

    const where: any = {}

    if (filtros.estado) where.estado = filtros.estado
    if (filtros.tipoAsesoria) where.tipoAsesoria = filtros.tipoAsesoria
    if (filtros.resultado) where.resultado = filtros.resultado
    if (filtros.asesorId) where.asesorId = filtros.asesorId
    if (filtros.leadId) where.leadId = filtros.leadId

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha = {}
      if (filtros.fechaDesde) {
        where.fecha.gte = filtros.fechaDesde
      }
      if (filtros.fechaHasta) {
        where.fecha.lte = filtros.fechaHasta
      }
    }

    const [asesorias, total] = await Promise.all([
      prisma.asesoria.findMany({
        where,
        skip,
        take: limite,
        orderBy: { fecha: 'asc' },
        include: {
          asesor: {
            select: {
              id: true,
              nombre: true,

              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              nombre: true,

            },
          },
        },
      }),
      prisma.asesoria.count({ where }),
    ])

    return {
      asesorias,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    }
  }

  /**
   * Obtiene asesorías próximas a la fecha actual
   */
  async obtenerPróximas(diasDesdeAhora: number = 3) {
    const ahora = new Date()
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + diasDesdeAhora)

    return await prisma.asesoria.findMany({
      where: {
        estado: 'PROGRAMADA',
        fecha: {
          gte: ahora,
          lte: futuro,
        },
      },
      orderBy: { fecha: 'asc' },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,

            email: true,
          },
        },
      },
    })
  }

  /**
   * Obtiene asesorías vencidas (no realizadas)
   */
  async obtenerVencidas() {
    const ahora = new Date()

    return await prisma.asesoria.findMany({
      where: {
        estado: 'PROGRAMADA',
        fecha: {
          lt: ahora,
        },
      },
      orderBy: { fecha: 'asc' },
      include: {
        asesor: {
          select: {
            id: true,
            nombre: true,

          },
        },
      },
    })
  }

  /**
   * Obtiene estadísticas de asesorías
   */
  async obtenerEstadisticas(desde?: Date, hasta?: Date) {
    const where: any = {}

    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = desde
      if (hasta) where.createdAt.lte = hasta
    }

    const [total, porEstado, porResultado, realizadas] = await Promise.all([
      prisma.asesoria.count({ where }),
      prisma.asesoria.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.asesoria.groupBy({
        by: ['resultado'],
        where: { ...where, resultado: { not: null } },
        _count: true,
      }),
      prisma.asesoria.count({
        where: { ...where, estado: 'REALIZADA' },
      }),
    ])

    const estadoMap = porEstado.reduce(
      (acc, item) => {
        acc[item.estado] = item._count
        return acc
      },
      {} as Record<EstadoAsesoria, number>,
    )

    const resultadoMap = porResultado.reduce(
      (acc, item) => {
        if (item.resultado) {
          acc[item.resultado] = item._count
        }
        return acc
      },
      {} as Record<ResultadoAsesoria, number>,
    )

    const tasaExito = total > 0 ? Math.round((realizadas / total) * 100) : 0

    return {
      total,
      porEstado: estadoMap,
      porResultado: resultadoMap,
      realizadas,
      tasaExito,
    }
  }

  /**
   * Obtiene asesorías de un abogado
   */
  async obtenerPorAbogado(asesorId: string, solo_pendientes: boolean = false) {
    return await prisma.asesoria.findMany({
      where: {
        asesorId,
        ...(solo_pendientes && { estado: 'PROGRAMADA' }),
      },
      orderBy: { fecha: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,

          },
        },
      },
    })
  }

  /**
   * Obtiene asesorías de un lead
   */
  async obtenerPorLead(leadId: string) {
    return await prisma.asesoria.findMany({
      where: { leadId },
      orderBy: { fecha: 'desc' },
    })
  }

  /**
   * Busca asesorías por texto
   */
  async buscar(query: string, limite: number = 10) {
    return await prisma.asesoria.findMany({
      where: {
        OR: [
          { descripcion: { contains: query, mode: 'insensitive' } },
          { notas: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limite,
    })
  }
}
