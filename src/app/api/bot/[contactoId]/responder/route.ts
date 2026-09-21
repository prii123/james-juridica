import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser, PERMISSIONS } from '@/lib/permissions'
import { prismaBot } from '@/lib/db-bot'
import { ChatbotApiError, enviarMensajeBot, obtenerConversacionBot } from '@/lib/chatbot-api'

export const dynamic = 'force-dynamic'

// El servicio del bot identifica conversaciones por teléfono, no por el id del ERP;
// se resuelve siempre en el servidor (nunca se confía en un teléfono que mande el cliente).
async function resolverTelefono(contactoId: string): Promise<string> {
  const contacto = await prismaBot.contactos.findUnique({
    where: { id: contactoId },
    select: { telefono: true },
  })
  if (!contacto) throw new ChatbotApiError('Contacto no encontrado', 404)
  return contacto.telefono
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const telefono = await resolverTelefono(params.contactoId)
    const conversacion = await obtenerConversacionBot(telefono)

    return NextResponse.json(conversacion)
  } catch (error: any) {
    const status = error instanceof ChatbotApiError ? error.status : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contactoId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.EDIT)

    const body = await request.json()
    const texto = String(body?.texto ?? '').trim()
    if (!texto) return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })

    const telefono = await resolverTelefono(params.contactoId)

    // Defensa en profundidad: el composer del ERP ya se deshabilita fuera de este estado,
    // pero se valida también aquí por si la llamada no viene de esa UI.
    const actual = await obtenerConversacionBot(telefono)
    if (actual.contacto.estadoConversacion !== 'ESPERANDO_HUMANO') {
      return NextResponse.json(
        { error: 'El bot todavía está atendiendo esta conversación; no se puede responder manualmente.' },
        { status: 409 }
      )
    }

    const usuario = await getCurrentUser()
    const envio = await enviarMensajeBot(telefono, texto, usuario?.name)

    return NextResponse.json(envio, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error al enviar respuesta de abogado:', error)
    const status = error instanceof ChatbotApiError ? error.status : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}
