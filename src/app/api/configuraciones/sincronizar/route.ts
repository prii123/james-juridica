import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Función auxiliar para sincronizar evento con Google Calendar
async function syncEventToGoogleCalendar(eventData: {
  id: string;
  type: 'asesoria' | 'audiencia';
  title: string;
  description: string;
  start: Date;
  end: Date;
}) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/configuraciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync with Google Calendar');
    }

    const result = await response.json();

    if (result.success) {
      // Actualizar la base de datos con el eventId de Google
      if (eventData.type === 'asesoria') {
        await prisma.asesoria.update({
          where: { id: eventData.id },
          data: {
            googleEventId: result.event.id,
            sincronizadoGoogle: true,
          },
        });
      } else {
        await prisma.audiencia.update({
          where: { id: eventData.id },
          data: {
            googleEventId: result.event.id,
            sincronizadoGoogle: true,
          },
        });
      }

      return { success: true, eventId: result.event.id };
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error syncing event to Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Sincronizar evento individual
export async function POST(request: NextRequest) {
  try {
    const { eventId, eventType } = await request.json();

    if (!eventId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'eventId and eventType are required' },
        { status: 400 }
      );
    }

    let eventData;

    if (eventType === 'asesoria') {
      const asesoria = await prisma.asesoria.findUnique({
        where: { id: eventId },
        include: {
          lead: true,
          asesor: true,
        },
      });

      if (!asesoria) {
        return NextResponse.json(
          { success: false, error: 'Asesoría not found' },
          { status: 404 }
        );
      }

      if (asesoria.sincronizadoGoogle) {
        return NextResponse.json(
          { success: false, error: 'Event already synced' },
          { status: 400 }
        );
      }

      const endDate = new Date(asesoria.fecha);
      endDate.setMinutes(endDate.getMinutes() + (asesoria.duracion || 60));

      eventData = {
        id: asesoria.id,
        type: 'asesoria' as const,
        title: `Asesoría: ${asesoria.tema}`,
        description: `Cliente: ${asesoria.lead.nombre}\nAsesor: ${asesoria.asesor.nombre} ${asesoria.asesor.apellido}\nTipo: ${asesoria.tipo}\nModalidad: ${asesoria.modalidad}\nDuración: ${asesoria.duracion} minutos`,
        start: asesoria.fecha,
        end: endDate,
      };
    } else if (eventType === 'audiencia') {
      const audiencia = await prisma.audiencia.findUnique({
        where: { id: eventId },
        include: {
          caso: true,
          responsable: true,
        },
      });

      if (!audiencia) {
        return NextResponse.json(
          { success: false, error: 'Audiencia not found' },
          { status: 404 }
        );
      }

      if (audiencia.sincronizadoGoogle) {
        return NextResponse.json(
          { success: false, error: 'Event already synced' },
          { status: 400 }
        );
      }

      const endDate = new Date(audiencia.fechaHora);
      endDate.setHours(endDate.getHours() + 1); // Asumir 1 hora de duración por defecto

      eventData = {
        id: audiencia.id,
        type: 'audiencia' as const,
        title: `Audiencia: Caso ${audiencia.caso.numeroCaso}`,
        description: `Tipo: ${audiencia.tipo}\nCaso: ${audiencia.caso.numeroCaso}\nResponsable: ${audiencia.responsable.nombre} ${audiencia.responsable.apellido}\nModalidad: ${audiencia.modalidad}${audiencia.direccion ? `\nDirección: ${audiencia.direccion}` : ''}${audiencia.enlace ? `\nEnlace: ${audiencia.enlace}` : ''}`,
        start: audiencia.fechaHora,
        end: endDate,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid eventType. Must be "asesoria" or "audiencia"' },
        { status: 400 }
      );
    }

    const result = await syncEventToGoogleCalendar(eventData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Desincronizar evento individual
export async function DELETE(request: NextRequest) {
  try {
    const { eventId, eventType } = await request.json();

    if (!eventId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'eventId and eventType are required' },
        { status: 400 }
      );
    }

    let event;

    if (eventType === 'asesoria') {
      event = await prisma.asesoria.findUnique({
        where: { id: eventId },
        select: { id: true, googleEventId: true, sincronizadoGoogle: true },
      });
    } else if (eventType === 'audiencia') {
      event = await prisma.audiencia.findUnique({
        where: { id: eventId },
        select: { id: true, googleEventId: true, sincronizadoGoogle: true },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid eventType. Must be "asesoria" or "audiencia"' },
        { status: 400 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.sincronizadoGoogle || !event.googleEventId) {
      return NextResponse.json(
        { success: false, error: 'Event not synced with Google Calendar' },
        { status: 400 }
      );
    }

    // Aquí podríamos eliminar el evento de Google Calendar usando la API
    // Por ahora solo marcamos como no sincronizado en la base de datos

    if (eventType === 'asesoria') {
      await prisma.asesoria.update({
        where: { id: eventId },
        data: {
          googleEventId: null,
          sincronizadoGoogle: false,
        },
      });
    } else {
      await prisma.audiencia.update({
        where: { id: eventId },
        data: {
          googleEventId: null,
          sincronizadoGoogle: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Event desynchronized from Google Calendar'
    });
  } catch (error) {
    console.error('Error in desync endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}