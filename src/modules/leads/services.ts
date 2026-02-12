import { EstadoLead } from '@prisma/client'
import { LeadsRepository } from './repository'
import { CreateLeadData, UpdateLeadData, LeadFilters } from './types'
import { createLeadSchema, updateLeadSchema, validateDocumentoColombia, validateTelefonoColombia } from './validators'

export class LeadsService {
  private repository: LeadsRepository

  constructor() {
    this.repository = new LeadsRepository()
  }

  async createLead(data: CreateLeadData) {
    // Validar datos de entrada
    const validatedData = createLeadSchema.parse(data)

    // Validaciones específicas para Colombia
    if (validatedData.documento && !validateDocumentoColombia(validatedData.documento, validatedData.tipoPersona)) {
      throw new Error('Documento inválido para el tipo de persona seleccionado')
    }

    if (!validateTelefonoColombia(validatedData.telefono)) {
      throw new Error('Número de teléfono inválido')
    }

    // Verificar que no exista otro lead con el mismo email
    const existingLeadByEmail = await this.repository.findByEmail(validatedData.email)
    if (existingLeadByEmail) {
      throw new Error('Ya existe un lead con este email')
    }

    // Verificar que no exista otro lead con el mismo documento (si se proporciona)
    if (validatedData.documento) {
      const existingLeadByDoc = await this.repository.findByDocumento(validatedData.documento)
      if (existingLeadByDoc) {
        throw new Error('Ya existe un lead con este documento')
      }
    }

    return await this.repository.create(validatedData)
  }

  async updateLead(id: string, data: UpdateLeadData) {
    // Validar que el lead existe
    const existingLead = await this.repository.findById(id)
    if (!existingLead) {
      throw new Error('Lead no encontrado')
    }

    // Validar datos de entrada
    const validatedData = updateLeadSchema.parse(data)

    // Validaciones específicas para Colombia
    if (validatedData.documento && validatedData.tipoPersona && 
        !validateDocumentoColombia(validatedData.documento, validatedData.tipoPersona)) {
      throw new Error('Documento inválido para el tipo de persona seleccionado')
    }

    if (validatedData.telefono && !validateTelefonoColombia(validatedData.telefono)) {
      throw new Error('Número de teléfono inválido')
    }

    // Verificar duplicados si se está actualizando email
    if (validatedData.email && validatedData.email !== existingLead.email) {
      const existingLeadByEmail = await this.repository.findByEmail(validatedData.email)
      if (existingLeadByEmail) {
        throw new Error('Ya existe un lead con este email')
      }
    }

    // Verificar duplicados si se está actualizando documento
    if (validatedData.documento && validatedData.documento !== existingLead.documento) {
      const existingLeadByDoc = await this.repository.findByDocumento(validatedData.documento)
      if (existingLeadByDoc) {
        throw new Error('Ya existe un lead con este documento')
      }
    }

    return await this.repository.update(id, validatedData)
  }

  async getLeadById(id: string) {
    const lead = await this.repository.findById(id)
    if (!lead) {
      throw new Error('Lead no encontrado')
    }
    return lead
  }

  async getLeads(filters: LeadFilters = {}, page: number = 1, limit: number = 10) {
    return await this.repository.findAll(filters, page, limit)
  }

  async deleteLead(id: string) {
    // Verificar que el lead existe
    const existingLead = await this.repository.findById(id)
    if (!existingLead) {
      throw new Error('Lead no encontrado')
    }

    // Verificar que el lead no tenga asesorías asociadas
    if (existingLead._count.asesorias > 0) {
      throw new Error('No se puede eliminar un lead que tiene asesorías asociadas')
    }

    return await this.repository.delete(id)
  }

  async searchLeads(query: string, limit: number = 10) {
    if (!query.trim()) {
      return []
    }
    return await this.repository.search(query.trim(), limit)
  }

  async updateLeadStatus(id: string, estado: EstadoLead, observaciones?: string) {
    const updateData: UpdateLeadData = { estado }

    // Si se está marcando para seguimiento, establecer fecha
    if (estado === 'CONTACTADO') {
      const nextFollowUp = new Date()
      nextFollowUp.setDate(nextFollowUp.getDate() + 3) // Seguimiento en 3 días
      updateData.fechaSeguimiento = nextFollowUp
    }

    if (observaciones) {
      updateData.observaciones = observaciones
    }

    return await this.updateLead(id, updateData)
  }

  async convertLeadToAsesoria(leadId: string) {
    // Esta función se llamaría cuando se crea una asesoría desde un lead
    return await this.updateLeadStatus(leadId, 'CONVERTIDO', 'Lead convertido a asesoría')
  }

  async getLeadsForFollowUp() {
    return await this.repository.getLeadsNeedingFollowUp()
  }

  async getLeadsByResponsable(responsableId: string) {
    return await this.repository.getLeadsByResponsable(responsableId)
  }

  async getLeadsStats() {
    return await this.repository.getLeadsStats()
  }

  async getLeadsConversionRate(startDate: Date, endDate: Date) {
    return await this.repository.getLeadsConversionRate(startDate, endDate)
  }

  async assignResponsable(leadId: string, responsableId: string) {
    return await this.updateLead(leadId, { responsableId })
  }

  async scheduleFollowUp(leadId: string, fechaSeguimiento: Date, observaciones?: string) {
    const updateData: UpdateLeadData = { fechaSeguimiento }
    if (observaciones) {
      updateData.observaciones = observaciones
    }
    return await this.updateLead(leadId, updateData)
  }

  // Método para obtener insights de leads
  async getLeadsInsights(startDate: Date, endDate: Date) {
    const [stats, conversion] = await Promise.all([
      this.getLeadsStats(),
      this.getLeadsConversionRate(startDate, endDate)
    ])

    const leadsNeedingFollowUp = await this.getLeadsForFollowUp()

    return {
      stats,
      conversion,
      followUpNeeded: leadsNeedingFollowUp.length,
      insights: {
        totalLeads: stats.total,
        activeLeads: stats.porEstado.NUEVO + stats.porEstado.CONTACTADO + stats.porEstado.CALIFICADO,
        conversionRate: conversion.conversionRate,
        needsAttention: leadsNeedingFollowUp.length
      }
    }
  }
}