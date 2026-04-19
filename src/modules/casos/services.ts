/**
 * Capa de Servicios - Casos
 * 
 * Responsabilidades:
 * - Implementar lógica de negocio
 * - Orquestar operaciones (coordinar múltiples repositorios)
 * - Validaciones de reglas de negocio
 * - Manejo de eventos y notificaciones
 * - Llamadas a otros servicios
 * 
 * NO DEBE:
 * - Saber nada de HTTP
 * - Validar campos (eso está en validators)
 * - Acceder directamente a requests/responses
 */

import { EstadoCaso } from '@prisma/client'
import { CasosRepository } from './repository'
import { CreateCasoData, UpdateCasoData, CasoFilters } from './types'
import { createCasoSchema, updateCasoSchema } from './validators'
import { calculateCasePriority } from '@/lib/workflows'
import {
  CasoNoEncontradoError,
  CasoConRelacionesError,
  validarPuedeEliminarCaso,
  validarPuedeCerrarCaso,
  validarPuedeReactivarCaso,
  mapearCasoParaRespuesta,
} from './models'

export class CasosService {
  private repository: CasosRepository

  constructor() {
    this.repository = new CasosRepository()
  }

  /**
   * Crea un nuevo caso
   * @throws {ValidationError} Si los datos de entrada son inválidos
   */
  async createCaso(data: CreateCasoData) {
    // Validar datos de entrada
    const validatedData = createCasoSchema.parse(data)

    // Calcular prioridad automáticamente si no se proporciona
    if (!validatedData.prioridad) {
      validatedData.prioridad = calculateCasePriority(
        new Date(),
        validatedData.tipoInsolvencia
      )
    }

    const caso = await this.repository.create(validatedData)
    return mapearCasoParaRespuesta(caso)
  }

  /**
   * Actualiza un caso existente
   * @throws {CasoNoEncontradoError} Si el caso no existe
   * @throws {ValidationError} Si los datos de entrada son inválidos
   */
  async updateCaso(id: string, data: UpdateCasoData) {
    // Verificar que el caso existe
    const existingCaso = await this.repository.findById(id)
    if (!existingCaso) {
      throw new CasoNoEncontradoError(id)
    }

    // Validar datos de entrada
    const validatedData = updateCasoSchema.parse(data)

    // Si se está cerrando el caso, establecer fecha de cierre
    if (validatedData.estado === 'CERRADO' && !validatedData.fechaCierre) {
      validatedData.fechaCierre = new Date()
    }

    // Si se está reactivando un caso cerrado, quitar fecha de cierre
    if (validatedData.estado === 'ACTIVO' && existingCaso.estado === 'CERRADO') {
      validatedData.fechaCierre = undefined
    }

    const caso = await this.repository.update(id, validatedData)
    return mapearCasoParaRespuesta(caso)
  }

  /**
   * Obtiene un caso por ID
   * @throws {CasoNoEncontradoError} Si el caso no existe
   */
  async getCasoById(id: string) {
    const caso = await this.repository.findById(id)
    if (!caso) {
      throw new CasoNoEncontradoError(id)
    }
    return mapearCasoParaRespuesta(caso)
  }

  /**
   * Obtiene todos los casos con filtros opcionales
   */
  async getCasos(filters: CasoFilters = {}, page: number = 1, limit: number = 10) {
    const resultado = await this.repository.findAll(filters, page, limit)
    return {
      ...resultado,
      casos: resultado.casos.map(mapearCasoParaRespuesta),
    }
  }

  /**
   * Elimina un caso
   * @throws {CasoNoEncontradoError} Si el caso no existe
   * @throws {CasoConRelacionesError} Si el caso tiene relaciones
   */
  async deleteCaso(id: string) {
    // Verificar que el caso existe
    const existingCaso = await this.repository.findById(id)
    if (!existingCaso) {
      throw new CasoNoEncontradoError(id)
    }

    // Verificar que el caso no tenga elementos relacionados
    const relacionesPresentes = validarPuedeEliminarCaso(existingCaso)
    if (relacionesPresentes.length > 0) {
      throw new CasoConRelacionesError(relacionesPresentes)
    }

    return await this.repository.delete(id)
  }

  /**
   * Busca casos por query
   */
  async searchCasos(query: string, limit: number = 10) {
    if (!query.trim()) {
      return []
    }
    const resultados = await this.repository.search(query.trim(), limit)
    return resultados.map(mapearCasoParaRespuesta)
  }

  /**
   * Cierra un caso
   * @throws {CasoNoEncontradoError} Si el caso no existe
   */
  async closeCaso(id: string, observaciones?: string) {
    // Validar que puede cerrarse
    const caso = await this.repository.findById(id)
    if (!caso) {
      throw new CasoNoEncontradoError(id)
    }
    validarPuedeCerrarCaso(caso)

    const updateData: UpdateCasoData = { 
      estado: 'CERRADO',
      fechaCierre: new Date()
    }

    if (observaciones) {
      updateData.observaciones = observaciones
    }

    return await this.updateCaso(id, updateData)
  }

  /**
   * Suspende un caso
   */
  async suspendCaso(id: string, observaciones?: string) {
    const updateData: UpdateCasoData = { estado: 'SUSPENDIDO' }

    if (observaciones) {
      updateData.observaciones = observaciones
    }

    return await this.updateCaso(id, updateData)
  }

  /**
   * Reactiva un caso cerrado
   * @throws {CasoNoEncontradoError} Si el caso no existe
   */
  async reactivateCaso(id: string) {
    // Validar que puede reactivarse
    const caso = await this.repository.findById(id)
    if (!caso) {
      throw new CasoNoEncontradoError(id)
    }
    validarPuedeReactivarCaso(caso)

    return await this.updateCaso(id, { estado: 'ACTIVO' })
  }

  /**
   * Archiva un caso
   */
  async archiveCaso(id: string) {
    return await this.updateCaso(id, { estado: 'ARCHIVADO' })
  }

  /**
   * Asigna un responsable a un caso
   */
  async assignResponsible(casoId: string, responsableId: string) {
    return await this.updateCaso(casoId, { responsableId })
  }

  /**
   * Actualiza la prioridad de un caso
   */
  async updatePriority(casoId: string, prioridad: any) {
    return await this.updateCaso(casoId, { prioridad })
  }

  /**
   * Obtiene los casos asignados a un responsable
   */
  async getCasosByResponsable(responsableId: string) {
    const casos = await this.repository.getCasosByResponsable(responsableId)
    return casos.map(mapearCasoParaRespuesta)
  }

  /**
   * Obtiene estadísticas de casos
   */
  async getCasosStats() {
    return await this.repository.getCasosStats()
  }

  /**
   * Obtiene casos con próximas audiencias
   */
  async getCasosWithUpcomingDeadlines(days: number = 7) {
    const casos = await this.repository.getCasosWithUpcomingDeadlines(days)
    return casos.map(mapearCasoParaRespuesta)
  }

  /**
   * Obtiene insights de casos para dashboard
   */
  async getCasosInsights(startDate: Date, endDate: Date) {
    const [stats, upcomingDeadlines] = await Promise.all([
      this.getCasosStats(),
      this.getCasosWithUpcomingDeadlines(7)
    ])

    return {
      stats,
      upcomingDeadlines: upcomingDeadlines.length,
      insights: {
        totalCases: stats.total,
        activeCases: stats.porEstado.ACTIVO,
        criticalCases: stats.porPrioridad.CRITICA,
        needsAttention: upcomingDeadlines.length
      }
    }
  }

  /**
   * Crea un caso a partir de un lead convertido
   */
  async createCasoFromLead(leadData: any, additionalCasoData: Partial<CreateCasoData>) {
    const casoData: CreateCasoData = {
      tipoInsolvencia: additionalCasoData.tipoInsolvencia!,
      observaciones: `Caso creado a partir del lead: ${leadData.observaciones || ''}`,
      clienteId: additionalCasoData.clienteId!,
      responsableId: additionalCasoData.responsableId || leadData.responsableId,
      creadoPorId: additionalCasoData.creadoPorId!,
      ...additionalCasoData
    }

    return await this.createCaso(casoData)
  }

  /**
   * Obtiene un resumen completo de un caso
   */
  async getCasoSummary(casoId: string) {
    const caso = await this.getCasoById(casoId)
    
    // TODO: Obtener datos de otros módulos cuando estén disponibles
    const [actuacionesPendientes, proximasAudiencias, honorariosPendientes] = await Promise.all([
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([])
    ])

    return {
      caso,
      actuacionesPendientes: actuacionesPendientes.length,
      proximasAudiencias: proximasAudiencias.length,
      honorariosPendientes: honorariosPendientes.length,
    }
  }
}