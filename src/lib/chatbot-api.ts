// Cliente del servicio del bot de WhatsApp (Lambda en chatbot-insolvencia).
// Solo para uso server-side: lleva el token interno (CHATBOT_API_TOKEN) en las cabeceras.

export class ChatbotApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

function baseUrl(): string {
  const url = process.env.CHATBOT_API_URL
  if (!url) throw new ChatbotApiError('CHATBOT_API_URL no configurada', 501)
  return url.replace(/\/$/, '')
}

function token(): string {
  const t = process.env.CHATBOT_API_TOKEN
  if (!t) throw new ChatbotApiError('CHATBOT_API_TOKEN no configurado', 501)
  return t
}

export interface MensajeBotApi {
  id: string
  contactoId: string
  direccion: 'in' | 'out'
  waMessageId: string | null
  tipo: string
  contenido: string | null
  mediaUrl: string | null
  mimeType: string | null
  estadoEntrega: string | null
  createdAt: string
}

export interface ContactoBotApi {
  id: string
  telefono: string
  estadoConversacion: string
  waPhoneNumberId: string | null
}

export interface ConversacionBotApi {
  contacto: ContactoBotApi
  mensajes: MensajeBotApi[]
}

async function llamar(path: string, init: RequestInit = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { 'X-Internal-Token': token(), 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ChatbotApiError(data.error || `El servicio del bot respondió ${res.status}`, res.status)
  return data
}

export function obtenerConversacionBot(telefono: string, limite = 50): Promise<ConversacionBotApi> {
  return llamar(`/conversaciones/${encodeURIComponent(telefono)}/mensajes?limite=${limite}`)
}

export function enviarMensajeBot(
  telefono: string,
  texto: string,
  autor?: string,
): Promise<{ waMessageId: string | null }> {
  return llamar(`/conversaciones/${encodeURIComponent(telefono)}/mensajes`, {
    method: 'POST',
    body: JSON.stringify({ texto, autor }),
  })
}
