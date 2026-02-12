import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { CreateCasoData, UpdateCasoData, CasoFilters, CasoWithRelations } from './types'

export class CasosRepository {
  async create(data: CreateCasoData) {
    // Generar número de caso único
    const numeroCaso = await this.generateCasoNumber()

    return await prisma.caso.create({
      data: {
        ...data,
        numeroCaso,
        valorDeuda: new Decimal(data.valorDeuda)
      },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })
  }

  async findById(id: string): Promise<CasoWithRelations | null> {
    const caso = await prisma.caso.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            email: true,
            telefono: true
          }
        },
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: {
            documentos: true,
            actuaciones: true,
            audiencias: true,
            honorarios: true
          }
        }
      }
    })

    if (!caso) return null

    return {
      ...caso,
      valorDeuda: caso.valorDeuda.toNumber()
    } as CasoWithRelations
  }

  async findByNumero(numeroCaso: string) {
    return await prisma.caso.findUnique({
      where: { numeroCaso }
    })
  }

  async findAll(filters: CasoFilters = {}, page: number = 1, limit: number = 10) {
    const where: any = {}

    if (filters.estado) {
      where.estado = filters.estado
    }

    if (filters.tipoInsolvencia) {
      where.tipoInsolvencia = filters.tipoInsolvencia
    }

    if (filters.prioridad) {
      where.prioridad = filters.prioridad
    }

    if (filters.responsableId) {
      where.responsableId = filters.responsableId
    }

    if (filters.valorDeudaMin || filters.valorDeudaMax) {
      where.valorDeuda = {}
      if (filters.valorDeudaMin) {
        where.valorDeuda.gte = new Decimal(filters.valorDeudaMin)
      }
      if (filters.valorDeudaMax) {
        where.valorDeuda.lte = new Decimal(filters.valorDeudaMax)
      }
    }

    if (filters.fechaInicioDesde || filters.fechaInicioHasta) {
      where.fechaInicio = {}
      if (filters.fechaInicioDesde) {
        where.fechaInicio.gte = filters.fechaInicioDesde
      }
      if (filters.fechaInicioHasta) {
        where.fechaInicio.lte = filters.fechaInicioHasta
      }
    }

    const skip = (page - 1) * limit

    const [casos, total] = await Promise.all([
      prisma.caso.findMany({
        where,
        skip,
        take: limit,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              documento: true,
              email: true,
              telefono: true
            }
          },
          responsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          creadoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          },
          _count: {
            select: {
              documentos: true,
              actuaciones: true,
              audiencias: true,
              honorarios: true
            }
          }
        },
        orderBy: [
          { prioridad: 'desc' },
          { fechaInicio: 'desc' }
        ]
      }),
      prisma.caso.count({ where })
    ])

    const casosWithDecimal = casos.map(caso => ({
      ...caso,
      valorDeuda: caso.valorDeuda.toNumber()
    })) as CasoWithRelations[]

    return {
      casos: casosWithDecimal,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  async update(id: string, data: UpdateCasoData) {
    const updateData: any = { ...data }
    
    if (data.valorDeuda !== undefined) {
      updateData.valorDeuda = new Decimal(data.valorDeuda)
    }

    const caso = await prisma.caso.update({
      where: { id },
      data: updateData,
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })

    return {
      ...caso,
      valorDeuda: caso.valorDeuda.toNumber()
    }
  }

  async delete(id: string) {
    return await prisma.caso.delete({
      where: { id }
    })
  }

  async search(query: string, limit: number = 10) {
    const casos = await prisma.caso.findMany({
      where: {
        OR: [
          {
            numeroCaso: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            observaciones: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            cliente: {
              OR: [
                {
                  nombre: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  documento: {
                    contains: query
                  }
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        ]
      },
      take: limit,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            email: true
          }
        },
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

    return casos.map(caso => ({
      ...caso,
      valorDeuda: caso.valorDeuda.toNumber()
    }))
  }

  async getCasosByResponsable(responsableId: string) {
    const casos = await prisma.caso.findMany({
      where: { 
        responsableId,
        estado: 'ACTIVO'
      },
      include: {
        _count: {
          select: {
            actuaciones: {
              where: {
                estado: 'PENDIENTE'
              }
            }
          }
        }
      },
      orderBy: {
        prioridad: 'desc'
      }
    })

    return casos.map(caso => ({
      ...caso,
      valorDeuda: caso.valorDeuda.toNumber()
    }))
  }

  async getCasosStats() {
    const [total, activo, cerrado, suspendido, archivado] = await Promise.all([
      prisma.caso.count(),
      prisma.caso.count({ where: { estado: 'ACTIVO' } }),
      prisma.caso.count({ where: { estado: 'CERRADO' } }),
      prisma.caso.count({ where: { estado: 'SUSPENDIDO' } }),
      prisma.caso.count({ where: { estado: 'ARCHIVADO' } })
    ])

    const [critica, alta, media, baja] = await Promise.all([
      prisma.caso.count({ where: { prioridad: 'CRITICA', estado: 'ACTIVO' } }),
      prisma.caso.count({ where: { prioridad: 'ALTA', estado: 'ACTIVO' } }),
      prisma.caso.count({ where: { prioridad: 'MEDIA', estado: 'ACTIVO' } }),
      prisma.caso.count({ where: { prioridad: 'BAJA', estado: 'ACTIVO' } })
    ])

    const [reorganizacion, liquidacion, personaNatural, acuerdo] = await Promise.all([
      prisma.caso.count({ where: { tipoInsolvencia: 'REORGANIZACION' } }),
      prisma.caso.count({ where: { tipoInsolvencia: 'LIQUIDACION_JUDICIAL' } }),
      prisma.caso.count({ where: { tipoInsolvencia: 'INSOLVENCIA_PERSONA_NATURAL' } }),
      prisma.caso.count({ where: { tipoInsolvencia: 'ACUERDO_REORGANIZACION' } })
    ])

    return {
      total,
      porEstado: {
        ACTIVO: activo,
        CERRADO: cerrado,
        SUSPENDIDO: suspendido,
        ARCHIVADO: archivado
      },
      porPrioridad: {
        CRITICA: critica,
        ALTA: alta,
        MEDIA: media,
        BAJA: baja
      },
      porTipo: {
        REORGANIZACION: reorganizacion,
        LIQUIDACION_JUDICIAL: liquidacion,
        INSOLVENCIA_PERSONA_NATURAL: personaNatural,
        ACUERDO_REORGANIZACION: acuerdo
      }
    }
  }

  async getCasosWithUpcomingDeadlines(days: number = 7) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return await prisma.caso.findMany({
      where: {
        estado: 'ACTIVO',
        actuaciones: {
          some: {
            fechaVencimiento: {
              lte: futureDate,
              gte: new Date()
            },
            estado: 'PENDIENTE'
          }
        }
      },
      include: {
        responsable: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        actuaciones: {
          where: {
            fechaVencimiento: {
              lte: futureDate,
              gte: new Date()
            },
            estado: 'PENDIENTE'
          },
          orderBy: {
            fechaVencimiento: 'asc'
          },
          take: 1
        }
      }
    })
  }

  private async generateCasoNumber(): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = `CASO-${currentYear}`
    
    const lastCaso = await prisma.caso.findFirst({
      where: {
        numeroCaso: {
          startsWith: prefix
        }
      },
      orderBy: {
        numeroCaso: 'desc'
      }
    })

    let nextNumber = 1
    if (lastCaso) {
      const lastNumber = parseInt(lastCaso.numeroCaso.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
  }

  async getTotalValueByStatus() {
    const result = await prisma.caso.groupBy({
      by: ['estado'],
      _sum: {
        valorDeuda: true
      }
    })

    return result.reduce((acc, item) => {
      acc[item.estado] = item._sum.valorDeuda?.toNumber() || 0
      return acc
    }, {} as Record<string, number>)
  }
}