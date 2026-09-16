import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { BotService } from '@/modules/bot/services'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const botService = new BotService()
    const contacto = await botService.getContactoById(params.contactoId)

    return NextResponse.json(contacto)
  } catch (error: any) {
    const status = error.message === 'Contacto no encontrado' ? 404 : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}

// Seguimiento: etapa comercial, notas y abogado asignado del caso más reciente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.EDIT)

    const body = await request.json()
    const botService = new BotService()
    const caso = await botService.updateSeguimiento(params.contactoId, {
      casoId: body.casoId,
      etapa_comercial: body.etapa_comercial,
      notas: body.notas,
      abogado_asignado: body.abogado_asignado,
    })

    return NextResponse.json(caso)
  } catch (error: any) {
    console.error('[API] Error al actualizar seguimiento del bot:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
