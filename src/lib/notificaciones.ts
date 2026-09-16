interface EmailParams {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer; encoding?: 'base64' }[]
}

interface WhatsAppParams {
  to: string
  templateName: string
  languageCode?: string
  variables?: string[]
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

const ZEPTOMAIL_URL = 'https://api.zeptomail.com/v1.1/email'
const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

export async function sendEmail(params: EmailParams): Promise<SendResult> {
  const token = process.env.ZEPTOMAIL_TOKEN
  const fromEmail = process.env.EMAIL_FROM

  if (!token || !fromEmail) {
    return { success: false, error: 'Configuración de email no encontrada' }
  }

  try {
    const body: Record<string, unknown> = {
      from: { address: fromEmail },
      to: [{ email_address: { address: params.to } }],
      subject: params.subject,
      htmlbody: params.html,
    }

    if (params.attachments?.length) {
      body.attachments = params.attachments.map((a) => ({
        name: a.filename,
        content: a.encoding === 'base64' ? a.content : a.content.toString('base64'),
        encoding: 'base64',
      }))
    }

    const response = await fetch(ZEPTOMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || `Error HTTP ${response.status}` }
    }

    return { success: true, messageId: data.data?.message_id || data.message_id }
  } catch (error: any) {
    console.error('Error al enviar email:', error)
    return { success: false, error: error.message || 'Error al enviar email' }
  }
}

export async function sendWhatsApp(params: WhatsAppParams): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneNumberId) {
    return { success: false, error: 'Configuración de WhatsApp no encontrada' }
  }

  try {
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'es' },
        components: params.variables?.length
          ? [
              {
                type: 'body',
                parameters: params.variables.map((v) => ({
                  type: 'text',
                  text: v,
                })),
              },
            ]
          : [],
      },
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error?.message || `Error HTTP ${response.status}` }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error: any) {
    console.error('Error al enviar WhatsApp:', error)
    return { success: false, error: error.message || 'Error al enviar WhatsApp' }
  }
}

export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '')
  if (!cleaned.startsWith('57')) {
    cleaned = '57' + cleaned
  }
  return cleaned
}
