import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Los comprobantes de pago los sube el chatbot de WhatsApp a un bucket S3 de AWS (no al Space de
// DigitalOcean que usa el resto del sistema), así que tienen su propia configuración:
//   COMPROBANTES_S3_REGION             región del bucket (por defecto us-east-1)
//   COMPROBANTES_S3_ACCESS_KEY_ID      credenciales con permiso s3:GetObject sobre ese bucket
//   COMPROBANTES_S3_SECRET_ACCESS_KEY  (si no se definen, se usa la cadena de credenciales por defecto de AWS)
let client: S3Client | null = null

function getClient() {
  if (!client) {
    const accessKeyId = process.env.COMPROBANTES_S3_ACCESS_KEY_ID
    const secretAccessKey = process.env.COMPROBANTES_S3_SECRET_ACCESS_KEY
    client = new S3Client({
      region: process.env.COMPROBANTES_S3_REGION || 'us-east-1',
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    })
  }
  return client
}

/** URL temporal (10 min) para ver el comprobante guardado en `bucket/key`. */
export async function urlFirmadaComprobante(bucket: string, key: string, tipoMime?: string, nombre?: string | null) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // inline: que el navegador muestre la imagen en lugar de descargarla.
      ResponseContentDisposition: `inline${nombre ? `; filename="${nombre.replace(/"/g, '')}"` : ''}`,
      ...(tipoMime ? { ResponseContentType: tipoMime } : {}),
    }),
    { expiresIn: 600 },
  )
}
