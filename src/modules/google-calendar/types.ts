export interface CalendarSyncEvent {
  id: string
  type: 'asesoria' | 'audiencia'
  title: string
  description: string
  startTime: Date
  endTime: Date
  location?: string
  status?: string
}

export interface SyncResult {
  success: boolean
  created: number
  updated: number
  deleted: number
  errors: string[]
  timestamp: Date
}

export interface GoogleCalendarConfig {
  clientEmail: string
  privateKey: string
  calendarId: string
}

export const APP_EVENT_ID_PREFIX = 'AppID: '
export const APP_DESCRIPTION_FOOTER = 'Creado desde Sistema de Gestión Jurídica'

export function encodeAppEventId(type: string, id: string): string {
  return `${APP_EVENT_ID_PREFIX}${type}-${id}`
}

export function decodeAppEventId(text: string): { type: string; id: string } | null {
  const prefix = APP_EVENT_ID_PREFIX
  const idx = text.indexOf(prefix)
  if (idx === -1) return null
  const rest = text.substring(idx + prefix.length).trim()
  const [type, ...idParts] = rest.split('-')
  return { type, id: idParts.join('-') }
}
