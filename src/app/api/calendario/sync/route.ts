import { NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/modules/google-calendar'

export async function POST() {
  try {
    const service = new GoogleCalendarService()
    const result = await service.syncAll()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API] Error syncing Google Calendar:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al sincronizar con Google Calendar' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary'

    const isConfigured = !!(GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)

    return NextResponse.json({
      configured: isConfigured,
      clientEmail: isConfigured ? GOOGLE_CLIENT_EMAIL : null,
      calendarId: GOOGLE_CALENDAR_ID,
      status: isConfigured ? 'ready' : 'not_configured',
    })
  } catch (error: any) {
    return NextResponse.json(
      { configured: false, error: error.message },
      { status: 500 }
    )
  }
}
