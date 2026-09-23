import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prismaBot } from '@/lib/db-bot'
import { ChatbotApiError, cerrarAtencionBot } from '@/lib/chatbot-api'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.EDIT)

    // El teléfono se resuelve en el servidor, igual que en /responder.
    const contacto = await prismaBot.contactos.findUnique({
      where: { id: params.contactoId },
      select: { telefono: true },
    })
    if (!contacto) return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })

    const resultado = await cerrarAtencionBot(contacto.telefono)
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('[API] Error al cerrar atención del bot:', error)
    const status = error instanceof ChatbotApiError ? error.status : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}
