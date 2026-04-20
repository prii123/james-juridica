import { EstadoAsesoria, ResultadoAsesoria } from '@prisma/client'
import { AsesoriasRepository } from './repository'
import { CreateAsesoriaData, UpdateAsesoriaData, AsesoriaFilters } from './types'
import { createAsesoriaSchema, updateAsesoriaSchema, validateRangoFechas } from './validators'
import { prisma } from '@/lib/db'

export class AsesoriasService {
  private repository: AsesoriasRepository

  constructor() {
    this.repository = new AsesoriasRepository()
  }

  async createAsesoria(data: CreateAsesoriaData) {
    // Validar datos de entrada
    const validatedData = createAsesoriaSchema.parse(data)

    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: validatedData.leadId }
    })

    if (!lead) {
      throw new Error('Lead no encontrado')
    }

    // Verificar que el asesor existe
    const asesor = await prisma.user.findUnique({
      where: { id: validatedData.asesorId }
    })

    if (!asesor) {
      throw new Error('Asesor no encontrado')
    }

    // Verificar que el asesor esté activo
    if (!asesor.activo) {
      throw new Error('El asesor no está activo')
    }

    return await this.repository.create(validatedData)
  }

  async updateAsesoria(id: string, data: UpdateAsesoriaData) {
    // Verificar que la asesoría existe
    const existingAsesoria = await this.repository.findById(id)
    if (!existingAsesoria) {
      throw new Error('Asesoría no encontrada')
    }

    // Validar datos de entrada
    const validatedData = updateAsesoriaSchema.parse(data)

    // No permitir actualizar asesorías canceladas o realizadas (a menos que sea un cambio de estado)
    if (existingAsesoria.estado === EstadoAsesoria.CANCELADA && !validatedData.estado) {
      throw new Error('No se puede modificar una asesoría cancelada')
    }

    return await this.repository.update(id, validatedData)
  }

  async getAsesoriaById(id: string) {
    const asesoria = await this.repository.findById(id)
    if (!asesoria) {
      throw new Error('Asesoría no encontrada')
    }
    return asesoria
  }

  async getAsesorias(filters: AsesoriaFilters = {}, page: number = 1, limit: number = 10) {
    // Validar rango de fechas si se proporcionan ambas
    if (filters.fechaDesde && filters.fechaHasta) {
      if (!validateRangoFechas(filters.fechaDesde, filters.fechaHasta)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
      }
    }

    return await this.repository.findAll(filters, page, limit)
  }

  async deleteAsesoria(id: string) {
    // Verificar que la asesoría existe
    const existingAsesoria = await this.repository.findById(id)
    if (!existingAsesoria) {
      throw new Error('Asesoría no encontrada')
    }

    // No permitir eliminar asesorías realizadas
    if (existingAsesoria.estado === EstadoAsesoria.REALIZADA) {
      throw new Error('No se puede eliminar una asesoría que ya fue realizada')
    }

    return await this.repository.delete(id)
  }

  async getAsesoriasByAsesor(asesorId: string) {
    // Verificar que el asesor existe
    const asesor = await prisma.user.findUnique({
      where: { id: asesorId }
    })

    if (!asesor) {
      throw new Error('Asesor no encontrado')
    }

    return await this.repository.findByAsesor(asesorId)
  }

  async getAsesoriasByLead(leadId: string) {
    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      throw new Error('Lead no encontrado')
    }

    return await this.repository.findByLead(leadId)
  }

  async updateAsesoriaStatus(id: string, estado: EstadoAsesoria, notas?: string) {
    const updateData: UpdateAsesoriaData = { estado }

    if (notas) {
      updateData.notas = notas
    }

    return await this.updateAsesoria(id, updateData)
  }

  async cancelarAsesoria(id: string, motivo?: string) {
    return await this.updateAsesoriaStatus(id, EstadoAsesoria.CANCELADA, motivo)
  }

  async completarAsesoria(id: string, resultado: ResultadoAsesoria, notas?: string) {
    const updateData: UpdateAsesoriaData = {
      estado: EstadoAsesoria.REALIZADA,
      resultado
    }

    if (notas) {
      updateData.notas = notas
    }

    return await this.updateAsesoria(id, updateData)
  }

  async reagendarAsesoria(id: string, nuevaFecha: Date, notas?: string) {
    const updateData: UpdateAsesoriaData = {
      fecha: nuevaFecha
    }

    if (notas) {
      updateData.notas = notas
    }

    return await this.updateAsesoria(id, updateData)
  }

  async getAsesoriasStats() {
    return await this.repository.getAsesoriasStats()
  }

  async getAsesoriasByDateRange(startDate: Date, endDate: Date) {
    if (!validateRangoFechas(startDate, endDate)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
    }

    return await this.repository.getAsesoriasByDateRange(startDate, endDate)
  }

  async getUpcomingAsesorias(limit: number = 10) {
    return await this.repository.getUpcomingAsesorias(limit)
  }

  async getAsesorWorkload(asesorId: string, startDate: Date, endDate: Date) {
    // Verificar que el asesor existe
    const asesor = await prisma.user.findUnique({
      where: { id: asesorId }
    })

    if (!asesor) {
      throw new Error('Asesor no encontrado')
    }

    const asesorias = await prisma.asesoria.findMany({
      where: {
        asesorId,
        fecha: {
          gte: startDate,
          lte: endDate
        },
        estado: {
          in: [EstadoAsesoria.PROGRAMADA, EstadoAsesoria.REALIZADA]
        }
      }
    })

    const totalAsesorias = asesorias.length
    const totalMinutos = asesorias.reduce((sum, a) => sum + (a.duracion || 0), 0)
    const totalHoras = totalMinutos / 60

    return {
      asesorId,
      asesorNombre: `${asesor.nombre} ${asesor.apellido}`,
      periodo: {
        inicio: startDate,
        fin: endDate
      },
      totalAsesorias,
      totalMinutos,
      totalHoras,
      asesorias
    }
  }

  async getLeadAsesoriaHistory(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        asesorias: {
          include: {
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
        }
      }
    })

    if (!lead) {
      throw new Error('Lead no encontrado')
    }

    return {
      leadId: lead.id,
      leadNombre: lead.nombre,
      leadEmail: lead.email,
      totalAsesorias: lead.asesorias.length,
      asesorias: lead.asesorias
    }
  }

  async getAsesoriaInsights(startDate: Date, endDate: Date) {
    const [stats, asesorias] = await Promise.all([
      this.getAsesoriasStats(),
      this.getAsesoriasByDateRange(startDate, endDate)
    ])

    const realizadas = asesorias.filter(a => a.estado === EstadoAsesoria.REALIZADA).length
    const canceladas = asesorias.filter(a => a.estado === EstadoAsesoria.CANCELADA).length
    const tasaCompletitud = asesorias.length > 0 ? (realizadas / asesorias.length) * 100 : 0
    const tasaCancelacion = asesorias.length > 0 ? (canceladas / asesorias.length) * 100 : 0

    return {
      stats,
      periodo: {
        inicio: startDate,
        fin: endDate,
        totalAsesorias: asesorias.length
      },
      metricas: {
        realizadas,
        canceladas,
        tasaCompletitud,
        tasaCancelacion
      }
    }
  }
}
