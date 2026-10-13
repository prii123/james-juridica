import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { urlFirmadaComprobante } from '@/lib/comprobantes-s3'

export const dynamic = 'force-dynamic'

// GET /api/cartera/comprobantes/archivo/[comprobanteId] - Redirige a la imagen del comprobante.
export async function GET(_request: NextRequest, { params }: { params: { comprobanteId: string } }) {
  try {
    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    const comprobante = await prisma.comprobantePago.findUnique({ where: { id: params.comprobanteId } })
    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    const url = await urlFirmadaComprobante(
      comprobante.s3Bucket,
      comprobante.s3Key,
      comprobante.tipoMime,
      comprobante.nombreOriginal,
    )
    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error('Error al abrir comprobante:', error)
    // Lo más probable: faltan las credenciales de AWS (COMPROBANTES_S3_*) o la región no coincide.
    const sinCredenciales = /credential/i.test(error?.message || '')
    return NextResponse.json(
      {
        error: sinCredenciales
          ? 'No se pudo abrir el comprobante: faltan las credenciales de AWS (COMPROBANTES_S3_ACCESS_KEY_ID y COMPROBANTES_S3_SECRET_ACCESS_KEY en el .env).'
          : error.message || 'No se pudo abrir el comprobante',
      },
      { status: 500 },
    )
  }
}
