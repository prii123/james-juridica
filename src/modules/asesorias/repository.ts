import { prisma } from '@/lib/db'
import { CreateAsesoriaData, UpdateAsesoriaData, AsesoriaFilters, AsesoriaWithRelations } from './types'

export class AsesoriasRepository {
  async create(data: CreateAsesoriaData) {
    return await prisma.asesoria.create({
      data: {
        tipo: data.tipo,
        fecha: data.fecha,
        tema: data.tema,
        descripcion: data.descripcion,
        duracion: data.duracion,
        modalidad: data.modalidad || 'PRESENCIAL',
        leadId: data.leadId,
        asesorId: data.asesorId,
        notas: data.notas,
        valor: data.valor ? { toFixed: () => data.valor!.toString() } as any : undefined
      },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })
  }

  async findById(id: string): Promise<AsesoriaWithRelations | null> {
    return await prisma.asesoria.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    }) as AsesoriaWithRelations | null
  }

  async findAll(filters: AsesoriaFilters = {}, page: number = 1, limit: number = 10) {
    const where: any = {}

    if (filters.tipo) {
      where.tipo = filters.tipo
    }

    if (filters.estado) {
      where.estado = filters.estado
    }

    if (filters.modalidad) {
      where.modalidad = filters.modalidad
    }

    if (filters.asesorId) {
      where.asesorId = filters.asesorId
    }

    if (filters.leadId) {
      where.leadId = filters.leadId
    }

    // Búsqueda por texto
    if (filters.search) {
      where.OR = [
        {
          tema: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          descripcion: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          lead: {
            nombre: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        },
        {
          asesor: {
            nombre: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        },
        {
          asesor: {
            apellido: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Filtro por rango de fechas
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fecha = {}
      if (filters.fechaDesde) {
        where.fecha.gte = filters.fechaDesde
      }
      if (filters.fechaHasta) {
        where.fecha.lte = filters.fechaHasta
      }
    }

    const skip = (page - 1) * limit

    const [asesorias, total] = await Promise.all([
      prisma.asesoria.findMany({
        where,
        skip,
        take: limit,
        include: {
          lead: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              estado: true
            }
          },
          asesor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      }),
      prisma.asesoria.count({ where })
    ])

    return {
      asesorias: asesorias as AsesoriaWithRelations[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async update(id: string, data: UpdateAsesoriaData) {
    return await prisma.asesoria.update({
      where: { id },
      data: {
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.estado && { estado: data.estado }),
        ...(data.fecha && { fecha: data.fecha }),
        ...(data.tema && { tema: data.tema }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.duracion !== undefined && { duracion: data.duracion }),
        ...(data.modalidad && { modalidad: data.modalidad }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.valor !== undefined && { valor: data.valor ? { toFixed: () => data.valor!.toString() } as any : null }),
        ...(data.resultado !== undefined && { resultado: data.resultado })
      },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })
  }

  async delete(id: string) {
    return await prisma.asesoria.delete({
      where: { id }
    })
  }

  async findByAsesor(asesorId: string) {
    return await prisma.asesoria.findMany({
      where: { asesorId },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    }) as AsesoriaWithRelations[]
  }

  async findByLead(leadId: string) {
    return await prisma.asesoria.findMany({
      where: { leadId },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    }) as AsesoriaWithRelations[]
  }

  async getAsesoriasStats() {
    const [total, programadas, realizadas, canceladas, pendientes] = await Promise.all([
      prisma.asesoria.count(),
      prisma.asesoria.count({ where: { estado: 'PROGRAMADA' } }),
      prisma.asesoria.count({ where: { estado: 'REALIZADA' } }),
      prisma.asesoria.count({ where: { estado: 'CANCELADA' } }),
      prisma.asesoria.count({ where: { estado: 'PENDIENTE' } })
    ])

    return {
      total,
      porEstado: {
        PROGRAMADA: programadas,
        REALIZADA: realizadas,
        CANCELADA: canceladas,
        PENDIENTE: pendientes
      }
    }
  }

  async getAsesoriasByDateRange(startDate: Date, endDate: Date) {
    return await prisma.asesoria.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    }) as AsesoriaWithRelations[]
  }

  async getUpcomingAsesorias(limit: number = 10) {
    const now = new Date()
    return await prisma.asesoria.findMany({
      where: {
        fecha: {
          gte: now
        },
        estado: 'PROGRAMADA'
      },
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    }) as AsesoriaWithRelations[]
  }
}
