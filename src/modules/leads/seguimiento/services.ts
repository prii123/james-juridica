/**
 * Servicios de Seguimiento
 */

import { prisma } from '@/lib/db'
import { SeguimientoRepository } from './repository'
import { CrearSeguimientoInput, ActualizarSeguimientoInput } from './types'
import { crearSeguimientoValidator, actualizarSeguimientoValidator } from './validators'
import {
  SeguimientoNoEncontradoError,
  LeadNoEncontradoError,
  mapearSeguimientoParaRespuesta,
  validarIntegridad,
} from './models'

export class SeguimientoService {
  private repository: SeguimientoRepository

  constructor() {
    this.repository = new SeguimientoRepository()
  }

  /**
   * Crea un nuevo seguimiento
   */
  async crearSeguimiento(leadId: string, usuarioId: string, datos: any) {
    // Validar datos
    const datosValidados = crearSeguimientoValidator.parse(datos)
    validarIntegridad(datosValidados)

    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new LeadNoEncontradoError(leadId)

    // Crear seguimiento
    const seguimiento = await this.repository.crear({
      ...datosValidados,
      leadId,
      usuarioId,
    })

    // Actualizar fecha de seguimiento del lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { fechaSeguimiento: new Date() }
    })

    return mapearSeguimientoParaRespuesta(seguimiento)
  }

  /**
   * Obtiene un seguimiento
   */
  async obtenerSeguimiento(leadId: string, seguimientoId: string) {
    const seguimiento = await this.repository.obtenerPorId(seguimientoId, leadId)
    if (!seguimiento) throw new SeguimientoNoEncontradoError(seguimientoId)
    return mapearSeguimientoParaRespuesta(seguimiento)
  }

  /**
   * Lista seguimientos de un lead
   */
  async listarSeguimientos(leadId: string) {
    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new LeadNoEncontradoError(leadId)

    const seguimientos = await this.repository.obtenerPorLead(leadId)
    return seguimientos.map(mapearSeguimientoParaRespuesta)
  }

  /**
   * Actualiza un seguimiento
   */
  async actualizarSeguimiento(leadId: string, seguimientoId: string, datos: any) {
    // Validar datos
    const datosValidados = actualizarSeguimientoValidator.parse(datos)

    // Verificar que existe
    const existe = await this.repository.existeEnLead(seguimientoId, leadId)
    if (!existe) throw new SeguimientoNoEncontradoError(seguimientoId)

    const seguimiento = await this.repository.actualizar(seguimientoId, datosValidados)
    return mapearSeguimientoParaRespuesta(seguimiento)
  }

  /**
   * Elimina un seguimiento
   */
  async eliminarSeguimiento(leadId: string, seguimientoId: string) {
    // Verificar que existe
    const existe = await this.repository.existeEnLead(seguimientoId, leadId)
    if (!existe) throw new SeguimientoNoEncontradoError(seguimientoId)

    await this.repository.eliminar(seguimientoId)
  }
}
