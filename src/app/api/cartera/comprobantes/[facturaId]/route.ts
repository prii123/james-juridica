import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/cartera/comprobantes/[facturaId] - Soportes de pago que el cliente envió para esta factura.
// `url` apunta a nuestro endpoint /archivo/[id], que genera un enlace nuevo de S3 en cada clic
// (los enlaces firmados caducan, así que no se guardan ni se mandan en la lista).
export async function GET(_request: NextRequest, { params }: { params: { facturaId: string } }) {
  try {
    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    const comprobantes = await prisma.comprobantePago.findMany({
      where: { facturaId: params.facturaId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      comprobantes: comprobantes.map((c) => ({
        id: c.id,
        estado: c.estado,
        nombreOriginal: c.nombreOriginal,
        tipoMime: c.tipoMime,
        tamano: c.tamano,
        telefono: c.telefono,
        observaciones: c.observaciones,
        createdAt: c.createdAt.toISOString(),
        url: `/api/cartera/comprobantes/archivo/${c.id}`,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
