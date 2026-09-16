import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requirePermission, PERMISSIONS } from '@/lib/permissions'
import { BotService } from '@/modules/bot/services'

export const dynamic = 'force-dynamic'

// Crea un Lead en el sistema principal a partir de un contacto del bot
export async function POST(
  request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.CREATE)

    const body = await request.json()
    const user = await getCurrentUser()

    const botService = new BotService()
    const lead = await botService.copiarALeads(params.contactoId, {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      documento: body.documento,
      empresa: body.empresa,
      tipoPersona: body.tipoPersona,
      observaciones: body.observaciones,
      responsableId: body.responsableId || user?.id,
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error al copiar contacto del bot a leads:', error)
    const message = error.name === 'ZodError'
      ? error.errors?.map((e: any) => e.message).join('. ')
      : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
