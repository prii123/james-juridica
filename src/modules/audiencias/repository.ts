import { prisma } from '@/lib/db'
import { CreateAudienciaData, UpdateAudienciaData, AudienciaFilters, AudienciaWithRelations } from './types'

export class AudienciasRepository {
    async create(data: CreateAudienciaData) {
        return await prisma.audiencia.create({
            data: {
                tipo: data.tipo,
                fechaHora: data.fechaHora,
                estado: data.estado || 'PROGRAMADA',
                resultadoAudiencia: data.resultadoAudiencia || 'PENDIENTE',
                modalidad: data.modalidad || 'PRESENCIAL',
                direccion: data.direccion,
                enlace: data.enlace,
                observaciones: data.observaciones,
                resultado: data.resultado,
                casoId: data.casoId,
                responsableId: data.responsableId
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
                caso: {
                    select: {
                        id: true,
                        numeroCaso: true,
                        estado: true
                    }
                }
            }
        })
    }

    async findById(id: string): Promise<AudienciaWithRelations | null> {
        const audiencia = await prisma.audiencia.findUnique({
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
                caso: {
                    select: {
                        id: true,
                        numeroCaso: true,
                        estado: true
                    }
                }
            }
        })

        return audiencia as AudienciaWithRelations | null
    }

    async findByCaso(casoId: string, filters?: AudienciaFilters) {
        const where: any = { casoId }

        if (filters) {
            if (filters.tipo) where.tipo = filters.tipo
            if (filters.estado) where.estado = filters.estado
            if (filters.resultadoAudiencia) where.resultadoAudiencia = filters.resultadoAudiencia
            if (filters.modalidad) where.modalidad = filters.modalidad
            if (filters.responsableId) where.responsableId = filters.responsableId

            if (filters.fechaDesde || filters.fechaHasta) {
                where.fechaHora = {}
                if (filters.fechaDesde) where.fechaHora.gte = filters.fechaDesde
                if (filters.fechaHasta) where.fechaHora.lte = filters.fechaHasta
            }
        }

        return await prisma.audiencia.findMany({
            where,
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
                fechaHora: 'asc'
            }
        })
    }

    async findAll(filters?: AudienciaFilters, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit
        const where: any = {}

        if (filters) {
            if (filters.casoId) where.casoId = filters.casoId
            if (filters.tipo) where.tipo = filters.tipo
            if (filters.estado) where.estado = filters.estado
            if (filters.modalidad) where.modalidad = filters.modalidad
            if (filters.responsableId) where.responsableId = filters.responsableId

            if (filters.fechaDesde || filters.fechaHasta) {
                where.fechaHora = {}
                if (filters.fechaDesde) where.fechaHora.gte = filters.fechaDesde
                if (filters.fechaHasta) where.fechaHora.lte = filters.fechaHasta
            }
        }

        const [data, total] = await Promise.all([
            prisma.audiencia.findMany({
                where,
                include: {
                    responsable: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true,
                            email: true
                        }
                    },
                    caso: {
                        select: {
                            id: true,
                            numeroCaso: true,
                            estado: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    fechaHora: 'desc'
                }
            }),
            prisma.audiencia.count({ where })
        ])

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    async update(id: string, data: UpdateAudienciaData) {
        return await prisma.audiencia.update({
            where: { id },
            data: {
                ...(data.tipo && { tipo: data.tipo }),
                ...(data.fechaHora && { fechaHora: data.fechaHora }),
                ...(data.estado && { estado: data.estado }),
                ...(data.resultadoAudiencia && { resultadoAudiencia: data.resultadoAudiencia }),
                ...(data.modalidad && { modalidad: data.modalidad }),
                ...(data.direccion !== undefined && { direccion: data.direccion }),
                ...(data.enlace !== undefined && { enlace: data.enlace }),
                ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
                ...(data.resultado !== undefined && { resultado: data.resultado }),
                ...(data.responsableId && { responsableId: data.responsableId })
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
                caso: {
                    select: {
                        id: true,
                        numeroCaso: true,
                        estado: true
                    }
                }
            }
        })
    }

    async delete(id: string) {
        return await prisma.audiencia.delete({
            where: { id }
        })
    }

    async countByCaso(casoId: string) {
        return await prisma.audiencia.count({
            where: { casoId }
        })
    }

    async getProximas(dias: number = 7) {
        const ahora = new Date()
        const enDias = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000)

        return await prisma.audiencia.findMany({
            where: {
                estado: 'PROGRAMADA',
                fechaHora: {
                    gte: ahora,
                    lte: enDias
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
                caso: {
                    select: {
                        id: true,
                        numeroCaso: true,
                        estado: true
                    }
                }
            },
            orderBy: {
                fechaHora: 'asc'
            }
        })
    }
}
