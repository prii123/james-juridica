import { EstadoCaso } from '@prisma/client'
import { CasosRepository } from './repository'
import { CreateCasoData, UpdateCasoData, CasoFilters } from './types'
import { createCasoSchema, updateCasoSchema, validateValorDeudaByTipo } from './validators'
import { calculateCasePriority } from '@/lib/workflows'

export class CasosService {
  private repository: CasosRepository

  constructor() {
    this.repository = new CasosRepository()
  }

  async createCaso(data: CreateCasoData) {
    // Validar datos de entrada
    const validatedData = createCasoSchema.parse(data)

    // Validaciones de negocio
    if (!validateValorDeudaByTipo(validatedData.valorDeuda, validatedData.tipoInsolvencia)) {
      throw new Error('El valor de la deuda no es válido para el tipo de insolvencia seleccionado')
    }

    // Calcular prioridad automáticamente si no se proporciona
    if (!validatedData.prioridad) {
      validatedData.prioridad = calculateCasePriority(
        validatedData.valorDeuda,
        new Date(),
        validatedData.tipoInsolvencia
      )
    }

    return await this.repository.create(validatedData)
  }

  async updateCaso(id: string, data: UpdateCasoData) {
    // Verificar que el caso existe
    const existingCaso = await this.repository.findById(id)
    if (!existingCaso) {
      throw new Error('Caso no encontrado')
    }

    // Validar datos de entrada
    const validatedData = updateCasoSchema.parse(data)

    // Validaciones de negocio específicas
    if (validatedData.valorDeuda && validatedData.tipoInsolvencia &&
        !validateValorDeudaByTipo(validatedData.valorDeuda, validatedData.tipoInsolvencia)) {
      throw new Error('El valor de la deuda no es válido para el tipo de insolvencia seleccionado')
    }

    // Si se está cerrando el caso, establecer fecha de cierre
    if (validatedData.estado === 'CERRADO' && !validatedData.fechaCierre) {
      validatedData.fechaCierre = new Date()
    }

    // Si se está reactivando un caso cerrado, quitar fecha de cierre
    if (validatedData.estado === 'ACTIVO' && existingCaso.estado === 'CERRADO') {
      validatedData.fechaCierre = undefined
    }

    return await this.repository.update(id, validatedData)
  }

  async getCasoById(id: string) {
    const caso = await this.repository.findById(id)
    if (!caso) {
      throw new Error('Caso no encontrado')
    }
    return caso
  }

  async getCasos(filters: CasoFilters = {}, page: number = 1, limit: number = 10) {
    return await this.repository.findAll(filters, page, limit)
  }

  async deleteCaso(id: string) {
    // Verificar que el caso existe
    const existingCaso = await this.repository.findById(id)
    if (!existingCaso) {
      throw new Error('Caso no encontrado')
    }

    // Verificar que el caso no tenga elementos relacionados
    const hasRelations = existingCaso._count && (
      existingCaso._count.documentos > 0 ||
      existingCaso._count.actuaciones > 0 ||
      existingCaso._count.audiencias > 0 ||
      existingCaso._count.honorarios > 0
    )

    if (hasRelations) {
      throw new Error('No se puede eliminar un caso que tiene documentos, actuaciones, audiencias u honorarios asociados')
    }

    return await this.repository.delete(id)
  }

  async searchCasos(query: string, limit: number = 10) {
    if (!query.trim()) {
      return []
    }
    return await this.repository.search(query.trim(), limit)
  }

  async closeCaso(id: string, observaciones?: string) {
    const updateData: UpdateCasoData = { 
      estado: 'CERRADO',
      fechaCierre: new Date()
    }

    if (observaciones) {
      updateData.observaciones = observaciones
    }

    return await this.updateCaso(id, updateData)
  }

  async suspendCaso(id: string, observaciones?: string) {
    const updateData: UpdateCasoData = { estado: 'SUSPENDIDO' }

    if (observaciones) {
      updateData.observaciones = observaciones
    }

    return await this.updateCaso(id, updateData)
  }

  async reactivateCaso(id: string) {
    return await this.updateCaso(id, { estado: 'ACTIVO' })
  }

  async archiveCaso(id: string) {
    return await this.updateCaso(id, { estado: 'ARCHIVADO' })
  }

  async assignResponsible(casoId: string, responsableId: string) {
    return await this.updateCaso(casoId, { responsableId })
  }

  async updatePriority(casoId: string, prioridad: any) {
    return await this.updateCaso(casoId, { prioridad })
  }

  async getCasosByResponsable(responsableId: string) {
    return await this.repository.getCasosByResponsable(responsableId)
  }

  async getCasosStats() {
    return await this.repository.getCasosStats()
  }

  async getCasosWithUpcomingDeadlines(days: number = 7) {
    return await this.repository.getCasosWithUpcomingDeadlines(days)
  }

  async getTotalValueByStatus() {
    return await this.repository.getTotalValueByStatus()
  }

  // Método para obtener insights de casos
  async getCasosInsights(startDate: Date, endDate: Date) {
    const [stats, valueByStatus, upcomingDeadlines] = await Promise.all([
      this.getCasosStats(),
      this.getTotalValueByStatus(),
      this.getCasosWithUpcomingDeadlines(7)
    ])

    const totalValue = Object.values(valueByStatus).reduce((sum, value) => sum + value, 0)
    const activeValue = valueByStatus.ACTIVO || 0

    return {
      stats,
      valueByStatus,
      totalValue,
      activeValue,
      upcomingDeadlines: upcomingDeadlines.length,
      insights: {
        totalCases: stats.total,
        activeCases: stats.porEstado.ACTIVO,
        criticalCases: stats.porPrioridad.CRITICA,
        totalPortfolioValue: totalValue,
        activePortfolioValue: activeValue,
        needsAttention: upcomingDeadlines.length
      }
    }
  }

  // Método para crear un caso desde un lead convertido
  async createCasoFromLead(leadData: any, additionalCasoData: Partial<CreateCasoData>) {
    const casoData: CreateCasoData = {
      tipoInsolvencia: additionalCasoData.tipoInsolvencia!,
      valorDeuda: additionalCasoData.valorDeuda!,
      observaciones: `Caso creado a partir del lead: ${leadData.observaciones || ''}`,
      clienteId: additionalCasoData.clienteId!,
      responsableId: additionalCasoData.responsableId || leadData.responsableId,
      creadoPorId: additionalCasoData.creadoPorId!,
      ...additionalCasoData
    }

    return await this.createCaso(casoData)
  }

  // Método para obtener resumen de un caso
  async getCasoSummary(casoId: string) {
    const caso = await this.getCasoById(casoId)
    
    const [actuacionesPendientes, proximasAudiencias, honorariosPendientes] = await Promise.all([
      // Obtener actuaciones pendientes (esto requiere el repositorio de actuaciones)
      Promise.resolve([]), // Placeholder
      // Obtener próximas audiencias (esto requiere el repositorio de audiencias) 
      Promise.resolve([]), // Placeholder
      // Obtener honorarios pendientes (esto requiere el repositorio de honorarios)
      Promise.resolve([]) // Placeholder
    ])

    return {
      caso,
      actuacionesPendientes: actuacionesPendientes.length,
      proximasAudiencias: proximasAudiencias.length,
      honorariosPendientes: honorariosPendientes.length,
      // Más métricas según sea necesario
    }
  }
}