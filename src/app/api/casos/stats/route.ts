import { NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { CasosService } from '@/modules/casos/services'

export const dynamic = 'force-dynamic'

// Conteos por estado, usados para los números de las pestañas de /casos.
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const casosService = new CasosService()
    const stats = await casosService.getCasosStats()

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
