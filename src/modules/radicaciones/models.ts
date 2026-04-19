/**
 * Modelos y Lógica de Dominio - Radicaciones
 */

import { NotFoundError, BusinessError } from '@/lib/api-errors'
import { RadicacionResponse, EstadoRadicacion, ResultadoRadicacion } from './types'
import { EstadoRadicacion as EstadoRadicacionEnum } from '@prisma/client'

export class RadicacionNoEncontradaError extends NotFoundError {
  constructor(id: string) {
    super(`Radicación ${id}`)
  }
}

export class AsesoriaNoEncontradaError extends NotFoundError {
  constructor(id: string) {
    super(`Asesoría ${id}`)
  }
}

export class RadicacionDuplicadaError extends BusinessError {
  constructor(numero: string) {
    super(`Ya existe una radicación con el número ${numero}`, 'RADICACION_DUPLICADA')
  }
}

/**
 * Mapea entidad a DTO
 */
export function mapearRadicacionParaRespuesta(radicacion: any): RadicacionResponse {
  return {
    id: radicacion.id,
    numero: radicacion.numero,
    demandante: radicacion.demandante,
    demandado: radicacion.demandado,
    valor: radicacion.valor,
    estado: radicacion.estado,
    resultado: radicacion.resultado,
    fechaSolicitud: radicacion.fechaSolicitud,
    fechaAudiencia: radicacion.fechaAudiencia,
    observaciones: radicacion.observaciones,
    asesoriaId: radicacion.asesoriaId,
    asesoria: radicacion.asesoria ? {
      id: radicacion.asesoria.id,
      tipo: radicacion.asesoria.tipoAsesoria,
      lead: radicacion.asesoria.lead ? {
        id: radicacion.asesoria.lead.id,
        nombre: radicacion.asesoria.lead.nombre,
        email: radicacion.asesoria.lead.email,
      } : undefined,
      asesor: radicacion.asesoria.asesor ? {
        id: radicacion.asesoria.asesor.id,
        nombre: radicacion.asesoria.asesor.nombre,
        apellido: radicacion.asesoria.asesor.apellido,
        email: radicacion.asesoria.asesor.email,
      } : undefined,
    } : undefined,
    createdAt: radicacion.createdAt,
    updatedAt: radicacion.updatedAt,
  }
}

/**
 * Genera número de radicación único
 */
export async function generarNumeroRadicacion(ultimoNumero?: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  const prefix = `RAD-${currentYear}`

  let nextNumber = 1
  if (ultimoNumero) {
    const parts = ultimoNumero.split('-')
    if (parts.length === 3) {
      const num = parseInt(parts[2])
      if (!isNaN(num)) {
        nextNumber = num + 1
      }
    }
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Valida si la radicación puede cambiar de estado
 */
export function validarCambioEstado(
  estadoActual: EstadoRadicacionEnum,
  estadoNuevo: EstadoRadicacionEnum,
): boolean {
  const transicionesValidas: Record<string, string[]> = {
    SOLICITADA: ['PROGRAMADA', 'CANCELADA'],
    PROGRAMADA: ['REALIZADA', 'CANCELADA'],
    REALIZADA: ['CANCELADA'],
    CANCELADA: [],
  }

  return transicionesValidas[estadoActual]?.includes(estadoNuevo) ?? false
}

/**
 * Valida si se puede crear caso desde radicación
 */
export function validarPuedeCrearCaso(estado: EstadoRadicacionEnum): boolean {
  return estado === 'REALIZADA'
}

/**
 * Calcula porcentaje para honorarios (15% por defecto)
 */
export function calcularValorHonorario(valor: number, porcentaje: number = 0.15): number {
  return Number((valor * porcentaje).toFixed(2))
}

/**
 * Calcula impuestos (IVA 19% por defecto)
 */
export function calcularIVA(subtotal: number, porcentaje: number = 0.19): number {
  return Number((subtotal * porcentaje).toFixed(2))
}

/**
 * Genera número de caso único
 */
export function generarNumeroCaso(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `CASO-${year}-${randomNum}`
}

/**
 * Genera número de factura único
 */
export function generarNumeroFactura(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `FACT-${year}-${randomNum}`
}
