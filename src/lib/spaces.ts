import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configuración de DigitalOcean Spaces
const SPACES_KEY = process.env.DO_SPACES_KEY
const SPACES_SECRET = process.env.DO_SPACES_SECRET
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET
const SPACES_REGION = process.env.DO_SPACES_REGION || 'sfo3'

// Validar configuración al cargar el módulo
if (process.env.NODE_ENV === 'development' && SPACES_KEY && SPACES_SECRET && SPACES_BUCKET) {
  console.log('DigitalOcean Spaces Config:', {
    endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
    bucket: SPACES_BUCKET,
    region: SPACES_REGION,
    hasKey: !!SPACES_KEY,
    hasSecret: !!SPACES_SECRET
  })
}

// Cliente S3 configurado para DigitalOcean Spaces
export const spacesClient = new S3Client({
  endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_KEY!,
    secretAccessKey: SPACES_SECRET!
  },
  forcePathStyle: false // DigitalOcean Spaces utiliza virtual-hosted-style
})

export interface UploadFileParams {
  file: File
  key: string // Ruta completa en el bucket
  contentType?: string
}

export interface UploadResult {
  url: string
  key: string
}

/**
 * Sube un archivo a DigitalOcean Spaces
 */
export async function uploadFile({ file, key, contentType }: UploadFileParams): Promise<UploadResult> {
  // Validar configuración con mensajes de error específicos
  if (!SPACES_REGION) {
    throw new Error('Variable DO_SPACES_REGION no configurada')
  }
  if (!SPACES_KEY) {
    throw new Error('Variable DO_SPACES_KEY no configurada')
  }
  if (!SPACES_SECRET) {
    throw new Error('Variable DO_SPACES_SECRET no configurada')
  }
  if (!SPACES_BUCKET) {
    throw new Error('Variable DO_SPACES_BUCKET no configurada')
  }

  try {
    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const endpoint = `https://${SPACES_REGION}.digitaloceanspaces.com`
    console.log('Intentando subir archivo:', {
      endpoint: endpoint,
      bucket: SPACES_BUCKET,
      key: key,
      fileSize: buffer.length,
      contentType: contentType || file.type,
      // Debug para credenciales (solo primeros caracteres por seguridad)
      accessKeyPreview: SPACES_KEY?.substring(0, 8) + '...',
      secretKeyPreview: SPACES_SECRET?.substring(0, 8) + '...'
    })

    // Comando para subir el archivo
    const command = new PutObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || file.type,
      ACL: 'private' // Los archivos son privados por defecto
    })

    // Subir el archivo
    await spacesClient.send(command)

    // Para archivos privados, retornamos el key y generamos URLs firmadas cuando se necesiten
    console.log('Archivo subido exitosamente (privado):', { key })

    return { url: key, key } // Retornamos el key como URL temporal, se reemplazará con signed URL
  } catch (error) {
    console.error('Error al subir archivo a Spaces:', error)
    console.error('Configuración utilizada:', {
      endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
      bucket: SPACES_BUCKET,
      region: SPACES_REGION,
      accessKeyPreview: SPACES_KEY?.substring(0, 8) + '...',
      secretKeyPreview: SPACES_SECRET?.substring(0, 8) + '...'
    })
    
    // Error específico para credenciales inválidas
    if (error && typeof error === 'object' && 'Code' in error) {
      if (error.Code === 'InvalidAccessKeyId') {
        throw new Error('Las credenciales de DigitalOcean Spaces no son válidas. Verifica tu Access Key ID.')
      }
      if (error.Code === 'SignatureDoesNotMatch') {
        throw new Error('La Secret Key de DigitalOcean Spaces no es válida. Verifica tu Secret Access Key.')
      }
    }
    
    throw new Error(`Error al subir archivo al almacenamiento: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Elimina un archivo de DigitalOcean Spaces
 */
export async function deleteFile(key: string): Promise<void> {
  if (!SPACES_BUCKET) {
    throw new Error('Configuración de DigitalOcean Spaces incompleta')
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: key
    })

    await spacesClient.send(command)
    console.log('Archivo eliminado exitosamente:', key)
  } catch (error) {
    console.error('Error al eliminar archivo de Spaces:', error)
    throw new Error('Error al eliminar archivo del almacenamiento')
  }
}

/**
 * Genera una URL firmada para acceder temporalmente a un archivo privado
 * @param key - La clave del archivo en el bucket
 * @param expiresIn - Tiempo de expiración en segundos (por defecto 1 hora)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!SPACES_BUCKET) {
    throw new Error('Configuración de DigitalOcean Spaces incompleta')
  }

  try {
    const command = new GetObjectCommand({
      Bucket: SPACES_BUCKET,
      Key: key
    })

    const signedUrl = await getSignedUrl(spacesClient, command, { expiresIn })
    console.log('URL firmada generada para:', key)
    return signedUrl
  } catch (error) {
    console.error('Error al generar URL firmada:', error)
    throw new Error('Error al generar URL de acceso al archivo')
  }
}

/**
 * Verifica si la configuración de Spaces está completa
 */
export function isSpacesConfigured(): boolean {
  return !!(SPACES_KEY && SPACES_SECRET && SPACES_BUCKET && SPACES_REGION)
}