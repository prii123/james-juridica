/**
 * Servicios de Asesorías de Leads
 */

import { prisma } from '@/lib/db'
import { AsesoriaLeadRepository } from './repository'
import { CrearAsesoriaLeadInput } from './types'
import { crearAsesoriaLeadValidator } from './validators'
import {
  LeadNoEncontradoError,
  mapearAsesoriaParaRespuesta,
} from './models'

export class AsesoriaLeadService {
  private repository: AsesoriaLeadRepository

  constructor() {
    this.repository = new AsesoriaLeadRepository()
  }

  /**
   * Obtiene asesorías de un lead
   */
  async obtenerAsesoriasLead(leadId: string) {
    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, nombre: true }
    })

    if (!lead) throw new LeadNoEncontradoError(leadId)

    const asesorias = await this.repository.obtenerPorLead(leadId)

    return {
      leadId: lead.id,
      leadNombre: lead.nombre,
      asesorias: asesorias.map(mapearAsesoriaParaRespuesta)
    }
  }

  /**
   * Crea una asesoría para un lead
   */
  async crearAsesoriaLead(leadId: string, datos: any) {
    // Validar datos
    const datosValidados = crearAsesoriaLeadValidator.parse(datos)

    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new LeadNoEncontradoError(leadId)

    const asesoria = await this.repository.crear(leadId, datosValidados)
    return {
      ...mapearAsesoriaParaRespuesta(asesoria),
      lead: asesoria.lead
    }
  }
}
