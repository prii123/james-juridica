import { NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AsesoriasService } from '@/modules/asesorias/services'

export const dynamic = 'force-dynamic'

// Conteos por estado, usados para los números de las pestañas de /asesorias.
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.VIEW)

    const asesoriasService = new AsesoriasService()
    const stats = await asesoriasService.getAsesoriasStats()

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
