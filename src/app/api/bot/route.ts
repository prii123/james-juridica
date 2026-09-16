import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { BotService } from '@/modules/bot/services'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const etapa = searchParams.get('etapa') || undefined
    const estadoConversacion = searchParams.get('estadoConversacion') || undefined

    const botService = new BotService()
    const result = await botService.getContactos({ search, etapa, estadoConversacion }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error al listar contactos del bot:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
