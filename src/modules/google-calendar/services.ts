import { google, calendar_v3 } from 'googleapis'
import { prisma } from '@/lib/db'
import {
  CalendarSyncEvent,
  SyncResult,
  GoogleCalendarConfig,
  encodeAppEventId,
  decodeAppEventId,
  APP_DESCRIPTION_FOOTER,
} from './types'

const RATE_LIMIT_DELAY_MS = 250

function getConfig(): GoogleCalendarConfig {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  if (!clientEmail || !privateKey) {
    throw new Error('Google Calendar credentials not configured. Check GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars.')
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    calendarId,
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === maxRetries) throw error

      const isRateLimit = error?.code === 429 || error?.status === 429
      const isServerError = error?.code >= 500 && error?.code < 600
      const isNetworkError = error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || !error?.code

      if (!isRateLimit && !isServerError && !isNetworkError && error?.code >= 400 && error?.code < 500) {
        throw error
      }

      const delay = isRateLimit
        ? Math.min(baseDelayMs * Math.pow(4, attempt - 1) + Math.random() * 2000, maxDelayMs)
        : Math.min(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000, maxDelayMs)
      console.warn(`[GoogleCalendar] Retry ${attempt}/${maxRetries} after ${delay}ms. Error: ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null
  private config: GoogleCalendarConfig
  private lastAuthTime: number = 0
  private authTtlMs: number = 50 * 60 * 1000

  constructor() {
    this.config = getConfig()
  }

  private async ensureAuth(): Promise<calendar_v3.Calendar> {
    const now = Date.now()
    if (this.calendar && now - this.lastAuthTime < this.authTtlMs) {
      return this.calendar
    }

    const auth = new google.auth.JWT({
      email: this.config.clientEmail,
      key: this.config.privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    this.calendar = google.calendar({ version: 'v3', auth })
    this.lastAuthTime = now
    return this.calendar
  }

  private buildEventBody(event: CalendarSyncEvent): calendar_v3.Schema$Event {
    return {
      summary: event.title,
      description: `${event.description}\n\n${encodeAppEventId(event.type, event.id)}\n${APP_DESCRIPTION_FOOTER}`,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Bogota',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Bogota',
      },
      ...(event.location ? { location: event.location } : {}),
      ...(event.status ? { status: event.status === 'CANCELADA' || event.status === 'CANCELED' ? 'cancelled' : 'confirmed' } : {}),
    }
  }

  private async getMapping(eventType: string, eventId: string): Promise<{ googleEventId: string } | null> {
    const mapping = await prisma.calendarEventSync.findUnique({
      where: { eventType_eventId: { eventType, eventId } },
    })
    return mapping ? { googleEventId: mapping.googleEventId } : null
  }

  private async saveMapping(eventType: string, eventId: string, googleEventId: string): Promise<void> {
    await prisma.calendarEventSync.upsert({
      where: { eventType_eventId: { eventType, eventId } },
      update: { googleEventId, lastSyncedAt: new Date() },
      create: {
        eventType,
        eventId,
        googleEventId,
        googleCalendarId: this.config.calendarId,
      },
    })
  }

  private async deleteMapping(eventType: string, eventId: string): Promise<void> {
    await prisma.calendarEventSync.deleteMany({
      where: { eventType, eventId },
    })
  }

  async createEvent(event: CalendarSyncEvent): Promise<string> {
    const calendar = await this.ensureAuth()
    return retryWithBackoff(async () => {
      const response = await calendar.events.insert({
        calendarId: this.config.calendarId,
        requestBody: this.buildEventBody(event),
      })
      return response.data.id!
    })
  }

  async updateEvent(googleEventId: string, event: CalendarSyncEvent): Promise<void> {
    const calendar = await this.ensureAuth()
    return retryWithBackoff(async () => {
      await calendar.events.update({
        calendarId: this.config.calendarId,
        eventId: googleEventId,
        requestBody: this.buildEventBody(event),
      })
    })
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    const calendar = await this.ensureAuth()
    return retryWithBackoff(async () => {
      await calendar.events.delete({
        calendarId: this.config.calendarId,
        eventId: googleEventId,
      })
    })
  }

  async listAllEvents(): Promise<Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>> {
    const calendar = await this.ensureAuth()
    const eventMap = new Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>()

    await retryWithBackoff(async () => {
      let pageToken: string | undefined
      do {
        const response = await calendar.events.list({
          calendarId: this.config.calendarId,
          pageToken,
          singleEvents: true,
          orderBy: 'startTime',
        })

        const items = response.data.items || []
        for (const item of items) {
          const desc = item.description || ''
          const decoded = decodeAppEventId(desc)
          if (decoded) {
            const key = `${decoded.type}-${decoded.id}`
            eventMap.set(key, { googleEventId: item.id!, event: item })
          }
        }

        pageToken = response.data.nextPageToken || undefined
      } while (pageToken)
    })

    return eventMap
  }

  private async backfillMapping(
    eventType: string,
    eventId: string,
    googleEvents: Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>
  ): Promise<string | null> {
    const key = `${eventType}-${eventId}`
    const existing = googleEvents.get(key)
    if (existing) {
      await this.saveMapping(eventType, eventId, existing.googleEventId)
      return existing.googleEventId
    }
    return null
  }

  async syncAsesorias(googleEvents: Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0
    let updated = 0
    const errors: string[] = []

    try {
      const asesorias = await prisma.asesoria.findMany({
        include: {
          lead: { select: { nombre: true } },
          asesor: { select: { nombre: true, apellido: true } },
        },
      })

      for (const asesoria of asesorias) {
        try {
          const startTime = new Date(asesoria.fecha)
          const endTime = new Date(startTime.getTime() + (asesoria.duracion || 60) * 60 * 1000)

          const syncEvent: CalendarSyncEvent = {
            id: asesoria.id,
            type: 'asesoria',
            title: `[Asesoría] ${asesoria.tema}`,
            description: `Asesoría: ${asesoria.tema}\nCliente: ${asesoria.lead?.nombre || 'N/A'}\nAbogado: ${asesoria.asesor?.nombre || ''} ${asesoria.asesor?.apellido || ''}\nEstado: ${asesoria.estado}\nModalidad: ${asesoria.modalidad}`,
            startTime,
            endTime,
            status: asesoria.estado,
          }

          const mapping = await this.getMapping('asesoria', asesoria.id)

          if (mapping) {
            await this.updateEvent(mapping.googleEventId, syncEvent)
            updated++
          } else {
            const googleId = await this.backfillMapping('asesoria', asesoria.id, googleEvents)
            if (googleId) {
              await this.updateEvent(googleId, syncEvent)
              updated++
            } else {
              const newGoogleId = await this.createEvent(syncEvent)
              await this.saveMapping('asesoria', asesoria.id, newGoogleId)
              created++
            }
          }

          await delay(RATE_LIMIT_DELAY_MS)
        } catch (error: any) {
          errors.push(`Asesoria ${asesoria.id}: ${error.message}`)
        }
      }
    } catch (error: any) {
      errors.push(`Error fetching asesorias: ${error.message}`)
    }

    return { created, updated, errors }
  }

  async syncAudiencias(googleEvents: Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>): Promise<{ created: number; updated: number; errors: string[] }> {
    let created = 0
    let updated = 0
    const errors: string[] = []

    try {
      const audiencias = await prisma.audiencia.findMany({
        include: {
          caso: { select: { numeroCaso: true } },
        },
      })

      for (const audiencia of audiencias) {
        try {
          const startTime = new Date(audiencia.fechaHora)
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

          const syncEvent: CalendarSyncEvent = {
            id: audiencia.id,
            type: 'audiencia',
            title: `[Audiencia] Caso ${audiencia.caso?.numeroCaso || 'N/A'} - ${audiencia.tipo}`,
            description: `Audiencia de tipo: ${audiencia.tipo}\nCaso: ${audiencia.caso?.numeroCaso || 'N/A'}\nEstado: ${audiencia.estado}\nModalidad: ${audiencia.modalidad}`,
            startTime,
            endTime,
            location: audiencia.direccion || undefined,
            status: audiencia.estado,
          }

          const mapping = await this.getMapping('audiencia', audiencia.id)

          if (mapping) {
            await this.updateEvent(mapping.googleEventId, syncEvent)
            updated++
          } else {
            const googleId = await this.backfillMapping('audiencia', audiencia.id, googleEvents)
            if (googleId) {
              await this.updateEvent(googleId, syncEvent)
              updated++
            } else {
              const newGoogleId = await this.createEvent(syncEvent)
              await this.saveMapping('audiencia', audiencia.id, newGoogleId)
              created++
            }
          }

          await delay(RATE_LIMIT_DELAY_MS)
        } catch (error: any) {
          errors.push(`Audiencia ${audiencia.id}: ${error.message}`)
        }
      }
    } catch (error: any) {
      errors.push(`Error fetching audiencias: ${error.message}`)
    }

    return { created, updated, errors }
  }

  async syncAll(): Promise<SyncResult> {
    const errors: string[] = []
    let created = 0
    let updated = 0
    let deleted = 0

    try {
      console.log('[GoogleCalendar] Starting full sync...')

      let googleEvents = new Map<string, { googleEventId: string; event: calendar_v3.Schema$Event }>()
      try {
        googleEvents = await this.listAllEvents()
      } catch (err: any) {
        console.warn('[GoogleCalendar] Could not fetch existing Google events (will use DB mappings only):', err.message)
      }

      const asesoriaResult = await this.syncAsesorias(googleEvents)
      created += asesoriaResult.created
      updated += asesoriaResult.updated
      errors.push(...asesoriaResult.errors)

      const audienciaResult = await this.syncAudiencias(googleEvents)
      created += audienciaResult.created
      updated += audienciaResult.updated
      errors.push(...audienciaResult.errors)

      console.log(`[GoogleCalendar] Sync completed: ${created} created, ${updated} updated, ${deleted} deleted`)

      return {
        success: errors.length === 0,
        created,
        updated,
        deleted,
        errors,
        timestamp: new Date(),
      }
    } catch (error: any) {
      console.error('[GoogleCalendar] Sync failed:', error)
      return {
        success: false,
        created,
        updated,
        deleted,
        errors: [error.message],
        timestamp: new Date(),
      }
    }
  }
}
