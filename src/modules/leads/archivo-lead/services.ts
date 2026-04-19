/**
 * Servicios de Archivos de Leads
 */

import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { ArchivoLeadRepository } from './repository'
import { FiltrosArchivo } from './types'
import { validarArchivo } from './validators'
import {
  ArchivoLeadNoEncontradoError,
  LeadNoEncontradoError,
  ErrorAlmacenamientoError,
  mapearArchivoParaRespuesta,
  construirRutaArchivo,
} from './models'
import { uploadFile, isSpacesConfigured, deleteFile, getSignedFileUrl } from '@/lib/spaces'

export class ArchivoLeadService {
  private repository: ArchivoLeadRepository

  constructor() {
    this.repository = new ArchivoLeadRepository()
  }

  /**
   * Lista archivos de un lead
   */
  async listarArchivos(leadId: string, filtros: FiltrosArchivo = {}) {
    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new LeadNoEncontradoError(leadId)

    const archivos = await this.repository.obtenerPorLead(leadId, filtros)

    // Generar URLs firmadas en paralelo
    const archivosConUrls = await Promise.all(
      archivos.map(async (archivo) => {
        try {
          const signedUrl = await getSignedFileUrl(archivo.rutaArchivo, 3600)
          return mapearArchivoParaRespuesta(archivo, signedUrl)
        } catch (error) {
          console.error(`Error generando URL para archivo ${archivo.id}:`, error)
          return mapearArchivoParaRespuesta(archivo)
        }
      })
    )

    return { archivos: archivosConUrls }
  }

  /**
   * Sube un archivo
   */
  async subirArchivo(leadId: string, usuarioId: string, file: File) {
    // Validar almacenamiento
    if (!isSpacesConfigured()) {
      throw new ErrorAlmacenamientoError('Configuración de almacenamiento no disponible')
    }

    // Verificar que lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) throw new LeadNoEncontradoError(leadId)

    // Validar archivo
    const validacion = validarArchivo(file)
    if (!validacion.valido) {
      throw new ErrorAlmacenamientoError(validacion.error || 'Archivo inválido')
    }

    // Generar nombres únicos
    const extension = file.name.split('.').pop()
    const nombreUnico = `${uuidv4()}.${extension}`
    const rutaArchivo = construirRutaArchivo(leadId, nombreUnico)

    try {
      // Subir archivo
      const uploadResult = await uploadFile({
        file,
        key: rutaArchivo,
        contentType: file.type
      })

      // Guardar en BD
      const archivo = await this.repository.crear({
        nombreOriginal: file.name,
        nombreArchivo: nombreUnico,
        rutaArchivo,
        tamano: file.size,
        tipoMime: file.type,
        url: uploadResult.url,
        leadId,
        subidoPorId: usuarioId
      })

      return {
        archivo: mapearArchivoParaRespuesta(archivo)
      }
    } catch (error) {
      console.error('Error al subir archivo:', error)
      throw new ErrorAlmacenamientoError('Error al subir el archivo al almacenamiento')
    }
  }

  /**
   * Obtiene un archivo
   */
  async obtenerArchivo(leadId: string, archivoId: string) {
    const archivo = await this.repository.obtenerPorId(archivoId, leadId)
    if (!archivo) throw new ArchivoLeadNoEncontradoError(archivoId)

    try {
      const signedUrl = await getSignedFileUrl(archivo.rutaArchivo, 3600)
      return mapearArchivoParaRespuesta(archivo, signedUrl)
    } catch (error) {
      console.error('Error generando URL:', error)
      throw new ErrorAlmacenamientoError('Error al generar URL de acceso al archivo')
    }
  }

  /**
   * Elimina un archivo
   */
  async eliminarArchivo(leadId: string, archivoId: string) {
    // Verificar que existe
    const existe = await this.repository.existe(archivoId, leadId)
    if (!existe) throw new ArchivoLeadNoEncontradoError(archivoId)

    const archivo = await this.repository.obtenerPorId(archivoId, leadId)

    try {
      // Eliminar del storage
      await deleteFile(archivo!.rutaArchivo)
    } catch (error) {
      console.error('Error eliminando del storage:', error)
      // Continuar y eliminar de BD de todas formas
    }

    // Eliminar de BD
    await this.repository.eliminar(archivoId)
  }
}
