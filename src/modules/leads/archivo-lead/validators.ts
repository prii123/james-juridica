/**
 * Validadores para Archivos de Leads
 */

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Valida un archivo
 */
export function validarArchivo(file: File): { valido: boolean; error?: string } {
  if (!file) {
    return { valido: false, error: 'No se proporcionó archivo' }
  }

  if (file.size > MAX_SIZE) {
    return { valido: false, error: 'El archivo excede el tamaño máximo de 10MB' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valido: false, error: 'Tipo de archivo no permitido' }
  }

  return { valido: true }
}

/**
 * Obtiene tipos permitidos
 */
export function obtenerTiposPermitidos(): string[] {
  return ALLOWED_TYPES
}

/**
 * Obtiene tamaño máximo permitido
 */
export function obtenerTamanoMaximo(): number {
  return MAX_SIZE
}
