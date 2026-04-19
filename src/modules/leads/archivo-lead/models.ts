/**
 * Modelos y Lógica de Dominio - Archivos de Leads
 */

import { NotFoundError, BusinessError } from '@/lib/api-errors'
import { ArchivoLeadResponse } from './types'

export class ArchivoLeadNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Archivo ${id}`)
  }
}

export class LeadNoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`Lead ${id}`)
  }
}

export class ErrorAlmacenamientoError extends BusinessError {
  constructor(message: string) {
    super(message, 'ERROR_ALMACENAMIENTO')
  }
}

/**
 * Mapea entidad a DTO
 */
export function mapearArchivoParaRespuesta(archivo: any, url?: string): ArchivoLeadResponse {
  return {
    id: archivo.id,
    nombreOriginal: archivo.nombreOriginal,
    nombreArchivo: archivo.nombreArchivo,
    tamano: archivo.tamano,
    tipoMime: archivo.tipoMime,
    url: url || archivo.url,
    rutaArchivo: archivo.rutaArchivo,
    leadId: archivo.leadId,
    subidoPorId: archivo.subidoPorId,
    subidoPor: archivo.subidoPor ? {
      id: archivo.subidoPor.id,
      nombre: archivo.subidoPor.nombre,
      apellido: archivo.subidoPor.apellido,
    } : undefined,
    fechaSubida: archivo.fechaSubida,
    createdAt: archivo.createdAt,
    updatedAt: archivo.updatedAt,
  }
}

/**
 * Construye ruta de almacenamiento
 */
export function construirRutaArchivo(leadId: string, nombreUnico: string): string {
  return `leads/${leadId}/archivos/${nombreUnico}`
}
