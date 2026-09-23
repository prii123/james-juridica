import { NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { BotService } from '@/modules/bot/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 403 explícito: el cliente deja de consultar si el usuario no puede ver el bot.
    if (!(await hasPermission(PERMISSIONS.LEADS.VIEW))) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const botService = new BotService()
    return NextResponse.json(await botService.getPendientes())
  } catch (error: any) {
    console.error('[API] Error al obtener pendientes del bot:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
