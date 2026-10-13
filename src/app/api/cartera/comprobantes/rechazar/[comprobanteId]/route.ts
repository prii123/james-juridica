import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/cartera/comprobantes/rechazar/[comprobanteId] - Descarta un soporte que no es un
// comprobante de pago válido. Solo se puede rechazar uno que siga pendiente de revisión.
export async function POST(request: NextRequest, { params }: { params: { comprobanteId: string } }) {
  try {
    await requirePermission(PERMISSIONS.CARTERA.MANAGE)

    const { motivo } = await request.json().catch(() => ({ motivo: '' }))
    const texto = typeof motivo === 'string' ? motivo.trim() : ''

    // updateMany con el estado en el filtro: si alguien lo aplicó o rechazó mientras tanto, no pisa nada.
    const { count } = await prisma.comprobantePago.updateMany({
      where: { id: params.comprobanteId, estado: 'PENDIENTE_REVISION' },
      data: { estado: 'RECHAZADO', ...(texto ? { observaciones: texto } : {}) },
    })

    if (count === 0) {
      return NextResponse.json({ error: 'El comprobante no existe o ya fue procesado' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
