/**
 * Tipos para Archivos de Leads
 */

export interface SubirArchivoInput {
  file: File
  leadId: string
  usuarioId: string
}

export interface FiltrosArchivo {
  search?: string
  tipo?: string
}

export interface ArchivoLeadResponse {
  id: string
  nombreOriginal: string
  nombreArchivo: string
  tamano: number
  tipoMime: string
  url?: string
  rutaArchivo: string
  leadId: string
  subidoPorId: string
  subidoPor?: {
    id: string
    nombre: string
    apellido: string
  }
  fechaSubida?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ArchivoListaResponse {
  archivos: ArchivoLeadResponse[]
}
