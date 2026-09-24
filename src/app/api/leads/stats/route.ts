import { NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { LeadsService } from '@/modules/leads/services'

export const dynamic = 'force-dynamic'

// Conteos por estado, usados para los números de las pestañas de /leads.
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const leadsService = new LeadsService()
    const stats = await leadsService.getLeadsStats()

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
