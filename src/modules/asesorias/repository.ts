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
        tipoAsesoria: datos.tipoAsesoria,
        estado: 'PROGRAMADA',
        fechaProgramada: datos.fechaProgramada,
        descripcion: datos.descripcion,
        notas: datos.notas,
        abogadoId: datos.abogadoId,
        creadoPorId: datos.creadoPorId,
      },
      include: {
        abogado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
        abogado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
        ...(datos.fechaProgramada && { fechaProgramada: datos.fechaProgramada }),
        ...(datos.fechaRealizada && { fechaRealizada: datos.fechaRealizada }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(datos.notas !== undefined && { notas: datos.notas }),
        ...(datos.abogadoId && { abogadoId: datos.abogadoId }),
        ...(datos.observaciones !== undefined && { observaciones: datos.observaciones }),
        updatedAt: new Date(),
      },
      include: {
        abogado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
    if (filtros.abogadoId) where.abogadoId = filtros.abogadoId
    if (filtros.leadId) where.leadId = filtros.leadId

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fechaProgramada = {}
      if (filtros.fechaDesde) {
        where.fechaProgramada.gte = filtros.fechaDesde
      }
      if (filtros.fechaHasta) {
        where.fechaProgramada.lte = filtros.fechaHasta
      }
    }

    const [asesorias, total] = await Promise.all([
      prisma.asesoria.findMany({
        where,
        skip,
        take: limite,
        orderBy: { fechaProgramada: 'asc' },
        include: {
          abogado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          creadoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
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
        fechaProgramada: {
          gte: ahora,
          lte: futuro,
        },
      },
      orderBy: { fechaProgramada: 'asc' },
      include: {
        abogado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
        fechaProgramada: {
          lt: ahora,
        },
      },
      orderBy: { fechaProgramada: 'asc' },
      include: {
        abogado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
  async obtenerPorAbogado(abogadoId: string, solo_pendientes: boolean = false) {
    return await prisma.asesoria.findMany({
      where: {
        abogadoId,
        ...(solo_pendientes && { estado: 'PROGRAMADA' }),
      },
      orderBy: { fechaProgramada: 'asc' },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
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
      orderBy: { fechaProgramada: 'desc' },
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
          { observaciones: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limite,
    })
  }
}
