import { NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { BotService } from '@/modules/bot/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const botService = new BotService()
    const stats = await botService.getStats()

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('[API] Error al obtener estadísticas del bot:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
