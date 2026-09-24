import { prisma } from '@/lib/db'
import { CreateLeadData, UpdateLeadData, LeadFilters, LeadWithRelations } from './types'

export class LeadsRepository {
  async create(data: CreateLeadData) {
    return await prisma.lead.create({
      data,
      include: {
        responsable: {
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

  async findById(id: string): Promise<LeadWithRelations | null> {
    return await prisma.lead.findUnique({
      where: { id },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        asesorias: {
          include: {
            asesor: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          }
        },
        _count: {
          select: {
            asesorias: true
          }
        }
      }
    })
  }

  async findAll(filters: LeadFilters = {}, page: number = 1, limit: number = 10) {
    const where: any = {}

    if (filters.estado) {
      where.estado = Array.isArray(filters.estado) ? { in: filters.estado } : filters.estado
    }

    if (filters.tipoPersona) {
      where.tipoPersona = filters.tipoPersona
    }

    if (filters.responsableId) {
      where.responsableId = filters.responsableId
    }

    if (filters.origen) {
      where.origen = {
        contains: filters.origen,
        mode: 'insensitive'
      }
    }

    // Agregar funcionalidad de búsqueda
    if (filters.search) {
      where.OR = [
        {
          nombre: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          empresa: {
            contains: filters.search,
            mode: 'insensitive'
          }
        },
        {
          documento: {
            contains: filters.search
          }
        },
        {
          telefono: {
            contains: filters.search
          }
        }
      ]
    }

    if (filters.fechaCreacionDesde || filters.fechaCreacionHasta) {
      where.createdAt = {}
      if (filters.fechaCreacionDesde) {
        where.createdAt.gte = filters.fechaCreacionDesde
      }
      if (filters.fechaCreacionHasta) {
        where.createdAt.lte = filters.fechaCreacionHasta
      }
    }

    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        include: {
          responsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          _count: {
            select: {
              asesorias: true
            }
          }
        },
        orderBy: {
          createdAt: filters.orden ?? 'desc'
        }
      }),
      prisma.lead.count({ where })
    ])

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async update(id: string, data: UpdateLeadData) {
    return await prisma.lead.update({
      where: { id },
      data,
      include: {
        responsable: {
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
    return await prisma.lead.delete({
      where: { id }
    })
  }

  async findByEmail(email: string) {
    return await prisma.lead.findFirst({
      where: { email }
    })
  }

  async findByDocumento(documento: string) {
    return await prisma.lead.findFirst({
      where: { documento }
    })
  }

  async search(query: string, limit: number = 10) {
    return await prisma.lead.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            empresa: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            documento: {
              contains: query
            }
          }
        ]
      },
      take: limit,
      include: {
        responsable: {
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

  async getLeadsByResponsable(responsableId: string) {
    return await prisma.lead.findMany({
      where: { responsableId },
      include: {
        _count: {
          select: {
            asesorias: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async getLeadsNeedingFollowUp() {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    return await prisma.lead.findMany({
      where: {
        estado: {
          in: ['NUEVO', 'CONTACTADO']
        },
        OR: [
          {
            fechaSeguimiento: {
              lte: new Date()
            }
          },
          {
            fechaSeguimiento: null,
            createdAt: {
              lte: threeDaysAgo
            }
          }
        ]
      },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  async getLeadsStats() {
    const [total, nuevo, contactado, calificado, perdido, convertidos] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { estado: 'NUEVO' } }),
      prisma.lead.count({ where: { estado: 'CONTACTADO' } }),
      prisma.lead.count({ where: { estado: 'CALIFICADO' } }),
      prisma.lead.count({ where: { estado: 'PERDIDO' } }),
      // Ya no hay estado CONVERTIDO: un lead convertido es el que tiene asesorías.
      prisma.lead.count({ where: { asesorias: { some: {} } } })
    ])

    return {
      total,
      convertidos,
      porEstado: {
        NUEVO: nuevo,
        CONTACTADO: contactado,
        CALIFICADO: calificado,
        PERDIDO: perdido
      }
    }
  }

  async getLeadsConversionRate(startDate: Date, endDate: Date) {
    const totalLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const convertedLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        asesorias: { some: {} }
      }
    })

    return {
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    }
  }
}