import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function POST(request: NextRequest) {
  try {
    const { summary, description, start, end, calendarId } = await request.json();

    // Configurar autenticación con service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'America/Bogota', // Ajustar zona horaria según necesidad
      },
      end: {
        dateTime: end,
        timeZone: 'America/Bogota',
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId || 'primary',
      requestBody: event,
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Error creating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}